/**
 * Simple client API for NMEA connections.
 * Provides an abstraction over XState for users who don't need direct machine access.
 * Framework-agnostic and works with any JavaScript environment.
 */

import type { createNmeaMachine, NmeaMachineActor } from './machine'
import { createActor } from 'xstate'

/**
 * Configuration for the NMEA client.
 */
export interface NmeaClientOptions<TData = unknown> {
  /** Whether to enable logging of parsed packets. */
  enableLogging?: boolean
  /** Baud rate for serial communication. Default is 4800. */
  baudRate?: number
  /** Callback function called when data is updated. */
  onData?: (data: TData) => void
  /** Callback function called when connection state changes. */
  onStateChange?: (isConnected: boolean) => void
  /** Callback function called when an error occurs. */
  onError?: (error: string) => void
}

/**
 * Simple client for managing NMEA connections.
 * Abstracts away XState details while still exposing the machine for advanced use.
 */
export class NmeaClient<TData, TPackets extends Record<string, unknown>> {
  private actor: NmeaMachineActor<TData, TPackets>
  private subscription: { unsubscribe: () => void } | null = null
  private options?: NmeaClientOptions<TData>

  /**
   * Creates a new NMEA client.
   *
   * @param machine - The NMEA machine instance (created with createNmeaMachine).
   * @param options - Optional configuration and callbacks.
   */
  constructor(
    machine: ReturnType<typeof createNmeaMachine<TData, TPackets>>,
    options?: NmeaClientOptions<TData>,
  ) {
    this.options = options
    this.actor = createActor(machine)
    this.setupSubscriptions()

    // Apply initial options
    if (options?.enableLogging !== undefined) {
      this.setLogging(options.enableLogging)
    }
    if (options?.baudRate !== undefined) {
      this.setBaudRate(options.baudRate)
    }

    this.actor.start()
  }

  private setupSubscriptions(): void {
    this.subscription = this.actor.subscribe((state) => {
      // Notify data updates
      if (this.options?.onData && state.context.data !== undefined) {
        this.options.onData(state.context.data)
      }

      // Notify connection state changes
      if (this.options?.onStateChange) {
        const isConnected = state.value === 'connected'
        this.options.onStateChange(isConnected)
      }

      // Notify errors
      if (this.options?.onError && state.context.error) {
        this.options.onError(state.context.error)
      }
    })
  }

  /**
   * Gets the current data.
   */
  get data(): TData {
    const snapshot = this.actor.getSnapshot()
    return snapshot.context.data
  }

  /**
   * Gets whether the connection is currently active.
   */
  get isConnected(): boolean {
    const snapshot = this.actor.getSnapshot()
    return snapshot.value === 'connected'
  }

  /**
   * Gets whether the connection is in progress.
   */
  get isConnecting(): boolean {
    const snapshot = this.actor.getSnapshot()
    return snapshot.value === 'connecting'
  }

  /**
   * Gets the current error message, if any.
   */
  get error(): string | null {
    const snapshot = this.actor.getSnapshot()
    return snapshot.context.error
  }

  /**
   * Connects to the serial port.
   */
  connect(): void {
    this.actor.send({ type: 'CONNECT' })
  }

  /**
   * Disconnects from the serial port.
   */
  disconnect(): void {
    this.actor.send({ type: 'DISCONNECT' })
  }

  /**
   * Sets logging enabled/disabled.
   */
  setLogging(enabled: boolean): void {
    this.actor.send({ type: 'SET_LOGGING', enabled })
  }

  /**
   * Sets the baud rate (requires reconnection to take effect).
   */
  setBaudRate(baudRate: number): void {
    this.actor.send({ type: 'SET_BAUD_RATE', baudRate })
  }

  /**
   * Gets the underlying XState actor (for advanced users).
   * Allows access to full XState functionality.
   */
  get machine(): NmeaMachineActor<TData, TPackets> {
    return this.actor
  }

  /**
   * Disposes of the client and cleans up resources.
   */
  dispose(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.actor.stop()
  }
}
