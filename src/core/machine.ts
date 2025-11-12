import type { Packet } from 'nmea-simple'

import type { ActorRefFrom } from 'xstate'
import type { NmeaContext, NmeaEvent, NmeaMachineConfig } from './types'
/// <reference types="@types/w3c-web-serial" />
import { assign, fromCallback, fromPromise, sendTo, setup } from 'xstate'
import { parseUnsafeNmeaSentence } from '../parser'

/**
 * Type guard to check if a sentence ID is in the allowed list.
 *
 * @param sentenceId - The sentence ID to check.
 * @param allowedIds - Array of allowed sentence IDs.
 * @returns True if the sentence ID is allowed, false otherwise.
 */
function isAllowedSentenceId(
  sentenceId: string | undefined,
  allowedIds: readonly string[] | undefined,
): boolean {
  if (!allowedIds || allowedIds.length === 0) {
    return true // If no filter specified, allow all
  }
  return sentenceId !== undefined && allowedIds.includes(sentenceId)
}

/**
 * A custom TransformStream transformer that buffers text and splits it by \r\n.
 * This is the idiomatic way to handle line-based text streams from serial ports.
 */
class LineBreakTransformer {
  /** Buffer for incomplete lines that span multiple chunks. */
  private container: string

  constructor() {
    this.container = ''
  }

  /**
   * Transforms incoming text chunks by splitting on \r\n and emitting complete lines.
   * Incomplete lines are buffered until the next chunk arrives.
   *
   * @param chunk - The text chunk to process.
   * @param controller - The transform stream controller to enqueue complete lines.
   */
  transform(chunk: string, controller: TransformStreamDefaultController<string>): void {
    this.container += chunk
    const lines = this.container.split('\r\n')
    // The last element is kept as it might be an incomplete line
    const lastLine = lines.pop()
    this.container = lastLine ?? ''
    // Enqueue all complete lines (filter out empty lines)
    lines.forEach((line) => {
      if (line.length > 0) {
        controller.enqueue(line)
      }
    })
  }

  /**
   * Flushes any remaining buffered data when the stream closes.
   * Incomplete NMEA sentences are discarded as they cannot be reliably parsed.
   *
   * @param controller - The transform stream controller (required by interface but unused).
   */
  flush(controller: TransformStreamDefaultController<string>): void {
    // When the stream is closed, discard any remaining incomplete data.
    // Incomplete NMEA sentences should not be parsed.
    // The container is reset, so no incomplete sentence is emitted.
    void controller // Parameter required by interface but intentionally unused
    this.container = ''
  }
}

// --- XState Actors ---

/**
 * Actor: connectToSerial (Invoked Promise)
 * Handles the one-time task of requesting and opening the Web Serial port.
 *
 * Requests a serial port from the user, opens it at the specified baud rate,
 * and returns the opened port. If the port is already open, it closes it first.
 *
 * @param input - Object containing the baud rate to use.
 * @param input.baudRate - The baud rate for serial communication.
 * @throws {Error} If the Web Serial API is not supported in the browser.
 * @returns The opened SerialPort instance.
 */
const connectToSerialLogic = fromPromise<SerialPort, { baudRate: number }>(async ({ input }) => {
  if (!navigator.serial) {
    throw new Error('Web Serial API is not supported in this browser.')
  }

  console.log('Requesting serial port...')
  const port = await navigator.serial.requestPort()

  console.log(`Opening port at ${input.baudRate} baud...`)
  // Check if port is already open before trying to open
  if (port.readable || port.writable) {
    console.log('Port is already open, closing first...')
    try {
      await port.close()
    } catch (error) {
      console.warn('Error closing already-open port:', error)
    }
  }
  await port.open({ baudRate: input.baudRate })
  console.log('Port open.')

  return port
})

/**
 * Actor: closePort (Invoked Promise)
 * Handles closing the serial port gracefully.
 *
 * Closes the provided serial port if it exists and is open.
 * Errors during closing are logged but do not cause the promise to reject,
 * allowing the machine to transition to disconnected state even if closing fails.
 *
 * @param input - Object containing the port to close.
 * @param input.port - The SerialPort to close, or null if no port.
 */
const closePortLogic = fromPromise<void, { port: SerialPort | null }>(async ({ input }) => {
  if (input.port) {
    try {
      if (input.port.readable || input.port.writable) {
        await input.port.close()
        console.log('Port closed successfully.')
      }
    } catch (error) {
      console.warn('Error closing port:', error)
      // Don't throw - we want to transition to disconnected even if close fails
    }
  }
})

/**
 * Actor: readNmeaStream (Invoked Callback)
 * Handles the continuous task of reading, transforming, and parsing the NMEA stream.
 *
 * Sets up a stream transformation pipeline that:
 * 1. Decodes bytes to text using TextDecoderStream
 * 2. Splits text into lines using LineBreakTransformer
 * 3. Parses each line as an NMEA sentence
 * 4. Sends parsed packets to the parent machine via SERIAL.DATA events
 *
 * Uses the unsafe parser that supports standard NMEA packets plus custom depth
 * packets (DPT, DBS, DBK). Unknown packets are silently ignored.
 *
 * Can be stopped by sending a STOP event, which cancels the reader and triggers cleanup.
 *
 * @param input - Object containing the serial port to read from.
 * @param input.port - The SerialPort instance to read from.
 */
const readNmeaStreamLogic = fromCallback<NmeaEvent, { port: SerialPort }>(
  ({ input, sendBack, receive }) => {
    const { port } = input
    if (!port || !port.readable) {
      sendBack({ type: 'SERIAL.ERROR', error: 'Invalid port context.' })
      return
    }

    // Set up the stream transformation pipeline
    const transformer = new LineBreakTransformer()
    // TextDecoderStream is available in modern browsers (Chrome 71+, Edge 79+, Firefox 105+, Safari 14.1+)
    // Type assertion needed due to TypeScript's strict typing of BufferSource vs Uint8Array
    const lineStream = port.readable
      .pipeThrough(new TextDecoderStream() as TransformStream<Uint8Array, string>) // Bytes to text
      .pipeThrough(
        new TransformStream<string, string>({
          transform: transformer.transform.bind(transformer),
          flush: transformer.flush.bind(transformer),
        }),
      ) // Text to lines

    const reader = lineStream.getReader()
    let keepReading = true

    // --- Read Loop ---
    async function readLoop() {
      try {
        // eslint-disable-next-line no-unmodified-loop-condition
        while (keepReading) {
          // Read from the *transformed* stream (which gives us lines)
          const { value: line, done } = await reader.read()

          if (done) {
            break
          }

          if (line && line.length > 0) {
            try {
              // Parse the NMEA sentence using the unsafe parser which returns
              // UnknownPacket for unknown sentences instead of throwing
              const packet = parseUnsafeNmeaSentence(line)
              // Skip unknown packets silently - we don't care about them
              // UnknownPacket has sentenceId "?", all other packets have specific IDs
              if (packet.sentenceId === '?') {
                continue
              }
              // Send the parsed packet to the parent machine
              sendBack({ type: 'SERIAL.DATA', data: packet })
            } catch (error) {
              // This should rarely happen with the unsafe parser, but handle
              // any unexpected errors (e.g., malformed sentence structure)
              const errorMessage = error instanceof Error ? error.message : String(error)
              console.warn('Failed to parse NMEA sentence:', line, errorMessage)
              sendBack({
                type: 'SERIAL.ERROR',
                error: `Parser Error: ${errorMessage}`,
              })
            }
          }
        }
      } catch (error) {
        // This catches a *fatal* stream error (e.g., port unplugged)
        console.error('Read loop error:', error)
        if (keepReading) {
          // Report the error only if it was unexpected
          const errorMessage = error instanceof Error ? error.message : String(error)
          sendBack({ type: 'FATAL_ERROR', error: errorMessage })
        }
      } finally {
        console.log('Read loop finished.')
        // Signal that the stream has ended (gracefully or not)
        sendBack({ type: 'SERIAL.DISCONNECTED' })
      }
    }

    readLoop() // Start the loop

    // --- Handle Stop Commands ---
    receive((event: NmeaEvent) => {
      if (event.type === 'STOP') {
        console.log('Received STOP, cancelling reader...')
        keepReading = false
        reader.cancel().catch(() => {})
      }
    })

    // --- Cleanup ---
    return () => {
      console.log('Cleaning up stream reader actor...')
      keepReading = false
      if (reader) {
        reader.cancel().catch(() => {})
      }
      // Note: We don't close the port here - let the DISCONNECT action handle it
      // Closing here can cause issues if the port is needed for reconnection
    }
  },
)

/**
 * Factory function to create an NMEA state machine with a generic adapter pattern.
 *
 * @template TData - The type of computed/translated data stored in context.
 * @template TPackets - The type of stored packets (typically a record of sentence ID to packet).
 * @param config - Configuration for the machine including adapter function and initial values.
 * @returns An XState machine configured with the provided adapter and types.
 *
 * @example
 * ```typescript
 * const machine = createNmeaMachine({
 *   adapter: computeNavigationData,
 *   allowedSentenceIds: ['GGA', 'RMC', 'VTG'],
 *   initialData: { time: null, position: null },
 *   initialPackets: {},
 * });
 * ```
 */
export function createNmeaMachine<TData, TPackets extends Record<string, unknown>>(
  config: NmeaMachineConfig<TData, TPackets>,
) {
  const { adapter, allowedSentenceIds, initialData, initialPackets } = config

  return setup({
    types: {} as {
      context: NmeaContext<TData, TPackets>
      events: NmeaEvent
    },
    actors: {
      connectToSerial: connectToSerialLogic,
      readNmeaStream: readNmeaStreamLogic,
      closePort: closePortLogic,
    },
    actions: {
      /**
       * Sets the serial port in context and clears any error.
       */
      setPort: assign((_, params: { port: SerialPort }) => ({
        port: params.port,
        error: null,
      })),
      /**
       * Sets an error message in context from a connection error.
       */
      setError: assign((_, params: { error: unknown }) => {
        const err = params.error
        let errorMessage: string
        if (typeof err === 'string') {
          errorMessage = err
        } else if (err instanceof Error) {
          errorMessage = err.message || 'Failed to connect.'
        } else {
          errorMessage = String(err) || 'Failed to connect.'
        }
        return { error: errorMessage }
      }),
      /**
       * Logs parsed NMEA packet data to the console.
       * Only logs packets with allowed sentence IDs if logging is enabled.
       */
      logParsedData: ({ context }, params: { packet: Packet }) => {
        if (!context.enableLogging) {
          return
        }
        const packet = params.packet
        const sentenceId = packet.sentenceId
        if (isAllowedSentenceId(sentenceId, allowedSentenceIds)) {
          console.log(`${sentenceId} Packet:`, params.packet)
        }
      },
      /**
       * Stores a parsed NMEA packet in context and recomputes data via the adapter.
       * Only stores packets with allowed sentence IDs (if filtering is configured).
       */
      storePacket: assign(({ context }, params: { packet: Packet }) => {
        const packet = params.packet
        const sentenceId = packet.sentenceId

        if (sentenceId && isAllowedSentenceId(sentenceId, allowedSentenceIds)) {
          const newPackets = {
            ...context.packets,
            [sentenceId]: params.packet,
          }

          return {
            packets: newPackets,
            data: adapter(newPackets),
            error: null,
          }
        }

        // Even if packet is filtered out, recompute data in case adapter needs to handle removals
        return {
          packets: context.packets,
          data: adapter(context.packets),
          error: null,
        }
      }),
      /**
       * Sets a serial error message in context.
       */
      clearError: assign((_, params: { error: string }) => ({
        error: params.error,
      })),
      /**
       * Sets a fatal error message in context.
       */
      setFatalError: assign((_, params: { error: string }) => ({
        error: params.error,
      })),
      /**
       * Resets the machine context to disconnected state.
       */
      disconnect: assign({
        port: null,
        error: null,
        packets: initialPackets,
        data: initialData,
      }),
      /**
       * Sets the logging enabled state.
       */
      setLogging: assign((_, params: { enabled: boolean }) => ({
        enableLogging: params.enabled,
      })),
      /**
       * Sets the baud rate for serial communication.
       */
      setBaudRate: assign((_, params: { baudRate: number }) => ({
        baudRate: params.baudRate,
      })),
    },
  }).createMachine({
    id: 'nmea',
    initial: 'disconnected',
    context: {
      port: null,
      error: null,
      packets: initialPackets,
      data: initialData,
      enableLogging: false,
      baudRate: 4800,
    },
    on: {
      SET_LOGGING: {
        actions: {
          type: 'setLogging',
          params: ({ event }) => ({ enabled: event.enabled }),
        },
      },
    },
    states: {
      disconnected: {
        on: {
          CONNECT: 'connecting',
          SET_BAUD_RATE: {
            actions: {
              type: 'setBaudRate',
              params: ({ event }) => ({ baudRate: event.baudRate }),
            },
          },
        },
      },
      connecting: {
        invoke: {
          id: 'connectToSerial',
          src: 'connectToSerial',
          input: ({ context }) => ({ baudRate: context.baudRate }),
          onDone: {
            target: 'connected',
            actions: {
              type: 'setPort',
              params: ({ event }) => ({ port: event.output }),
            },
          },
          onError: {
            target: 'error',
            actions: {
              type: 'setError',
              params: ({ event }) => ({ error: event.error }),
            },
          },
        },
      },
      connected: {
        on: {
          'SERIAL.DATA': {
            actions: [
              {
                type: 'logParsedData',
                params: ({ event }) => ({ packet: event.data }),
              },
              {
                type: 'storePacket',
                params: ({ event }) => ({ packet: event.data }),
              },
            ],
          },
          'SERIAL.ERROR': {
            actions: {
              type: 'clearError',
              params: ({ event }) => ({ error: event.error }),
            },
          },
          'FATAL_ERROR': {
            target: 'error',
            actions: {
              type: 'setFatalError',
              params: ({ event }) => ({ error: event.error }),
            },
          },
          'SERIAL.DISCONNECTED': {
            target: 'disconnecting',
          },
          'DISCONNECT': {
            actions: sendTo('streamReader', { type: 'STOP' }),
          },
        },
        invoke: {
          id: 'streamReader',
          src: 'readNmeaStream',
          input: ({ context }) => ({ port: context.port! }),
        },
      },
      disconnecting: {
        invoke: {
          id: 'closePort',
          src: 'closePort',
          input: ({ context }) => ({ port: context.port }),
          onDone: {
            target: 'disconnected',
            actions: 'disconnect',
          },
          onError: {
            target: 'disconnected',
            actions: 'disconnect',
          },
        },
      },
      error: {
        on: {
          CONNECT: 'connecting',
        },
      },
    },
  })
}

/**
 * Type helper to extract the machine type from the factory function.
 * @template TData - The type of computed/translated data.
 * @template TPackets - The type of stored packets.
 */
export type NmeaMachineActor<TData, TPackets extends Record<string, unknown>> = ActorRefFrom<
  ReturnType<typeof createNmeaMachine<TData, TPackets>>
>
