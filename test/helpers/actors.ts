/**
 * Test helpers for creating mocked XState actors.
 */

import type { NmeaEvent } from '../../src/core/types'
import type { MockSerialPort } from './serial-port'
import { fromCallback, fromPromise } from 'xstate'

/**
 * Creates a mocked connectToSerial actor that uses the provided mock port.
 *
 * @param mockPort - The MockSerialPort instance to use
 * @returns A fromPromise actor for connecting to serial
 */
export function createMockConnectToSerialActor(mockPort: MockSerialPort) {
  return fromPromise<SerialPort, { baudRate: number }>(async ({ input }) => {
    await mockPort.open({ baudRate: input.baudRate })
    return mockPort as any
  })
}

/**
 * Creates a mocked connectToSerial actor that throws an error.
 *
 * @param errorMessage - The error message to throw
 * @returns A fromPromise actor that fails to connect
 */
export function createMockConnectToSerialErrorActor(errorMessage: string = 'Connection failed') {
  return fromPromise<SerialPort, { baudRate: number }>(async () => {
    throw new Error(errorMessage)
  })
}

/**
 * Creates a mocked readNmeaStream actor that does nothing.
 * Useful for tests that don't need to simulate stream reading.
 *
 * @returns A fromCallback actor that does nothing
 */
export function createMockReadNmeaStreamActor() {
  return fromCallback<NmeaEvent, { port: SerialPort }>(() => () => {})
}

/**
 * Creates a mocked readNmeaStream actor that responds to STOP events.
 *
 * @param onStop - Optional callback when STOP is received
 * @returns A fromCallback actor that handles STOP events
 */
export function createMockReadNmeaStreamWithStopActor(
  onStop?: () => void,
) {
  return fromCallback<NmeaEvent, { port: SerialPort }>(({ sendBack, receive }) => {
    receive((event) => {
      if (event.type === 'STOP') {
        onStop?.()
        sendBack({ type: 'SERIAL.DISCONNECTED' })
      }
    })
    return () => {}
  })
}

/**
 * Creates a mocked closePort actor.
 *
 * @returns A fromPromise actor that closes the port
 */
export function createMockClosePortActor() {
  return fromPromise<void, { port: SerialPort | null }>(async () => {
    // Mock implementation - port closing is handled by MockSerialPort
  })
}

/**
 * Configuration for creating mocked machine actors.
 */
export interface MockActorsConfig {
  connectToSerial?: ReturnType<typeof createMockConnectToSerialActor>
  readNmeaStream?: ReturnType<typeof createMockReadNmeaStreamActor>
  closePort?: ReturnType<typeof createMockClosePortActor>
}

/**
 * Creates a complete set of mocked actors for testing.
 *
 * @param mockPort - The MockSerialPort instance to use
 * @param options - Optional actor overrides
 * @param options.connectToSerial - Optional custom connectToSerial actor
 * @param options.readNmeaStream - Optional custom readNmeaStream actor
 * @param options.closePort - Optional custom closePort actor
 * @returns A configuration object with all mocked actors
 */
export function createMockActors(
  mockPort: MockSerialPort,
  options?: {
    connectToSerial?: ReturnType<typeof createMockConnectToSerialActor>
    readNmeaStream?: ReturnType<typeof createMockReadNmeaStreamActor>
    closePort?: ReturnType<typeof createMockClosePortActor>
  },
): MockActorsConfig {
  return {
    connectToSerial: options?.connectToSerial ?? createMockConnectToSerialActor(mockPort),
    readNmeaStream: options?.readNmeaStream ?? createMockReadNmeaStreamActor(),
    closePort: options?.closePort ?? createMockClosePortActor(),
  }
}
