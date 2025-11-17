/**
 * Core types for the NMEA state machine.
 */

import type { Packet } from 'nmea-simple'
import type { PacketStub } from 'nmea-simple/dist/codecs/PacketStub'

/**
 * Configuration for creating an NMEA machine.
 * @template TData - The type of computed/translated data stored in context.
 * @template TPackets - The type of stored packets (typically a record of sentence ID to packet).
 */
export interface NmeaMachineConfig<TData, TPackets extends Record<string, PacketStub | undefined>> {
  /** Function that transforms stored packets into the computed data type. */
  adapter: (packets: TPackets) => TData
  /** Optional list of sentence IDs to filter and store. If not provided, all parsed sentences are stored. */
  allowedSentenceIds?: readonly string[]
  /** Initial computed data value. */
  initialData: TData
  /** Initial stored packets value. */
  initialPackets: TPackets
}

/**
 * Generic context for the NMEA state machine.
 * @template TData - The type of computed/translated data.
 * @template TPackets - The type of stored packets.
 */
export interface NmeaContext<TData, TPackets extends Record<string, PacketStub | undefined>> {
  /** The active Web Serial port connection, or null if disconnected. */
  port: SerialPort | null
  /** Current error message, or null if no error. */
  error: string | null
  /** Map of stored NMEA packets by sentence ID. */
  packets: TPackets
  /** Computed/translated data derived from stored packets via the adapter. */
  data: TData
  /** Whether to log parsed NMEA packets to the console. */
  enableLogging: boolean
  /** Baud rate for serial port communication. Default is 4800 (standard NMEA rate). */
  baudRate: number
}

/**
 * Events that the NMEA state machine can handle.
 */
export type NmeaEvent
  = | { type: 'CONNECT' }
    | { type: 'DISCONNECT' }
    | { type: 'SERIAL.DATA', data: Packet }
    | { type: 'SERIAL.ERROR', error: string }
    | { type: 'FATAL_ERROR', error: string }
    | { type: 'SERIAL.DISCONNECTED' }
    | { type: 'STOP' }
    | { type: 'SET_LOGGING', enabled: boolean }
    | { type: 'SET_BAUD_RATE', baudRate: number }
