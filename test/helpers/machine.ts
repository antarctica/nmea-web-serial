/**
 * Test helpers for creating and configuring NMEA machines.
 */

import type { Packet } from 'nmea-simple'
import type { NmeaMachineConfig } from '../../src/core/types'
import { parseNmeaSentence } from '../../src/parser'

/**
 * Creates a Packet object by parsing an NMEA sentence string.
 *
 * @param sentence - The NMEA sentence string to parse
 * @returns A parsed Packet object (may include custom packets like DPT, DBS, DBK)
 *
 * @example
 * ```typescript
 * const packet = createPacket(getNmeaSentence('GGA'))
 * ```
 */
export function createPacket(sentence: string): Packet {
  // parseNmeaSentence returns ExtendedNmeaPacket which includes custom packets
  // but is compatible with Packet for our test purposes
  return parseNmeaSentence(sentence) as Packet
}

/**
 * Creates a simple test machine configuration.
 *
 * The adapter simply counts the number of stored packets.
 *
 * @param options - Optional configuration overrides
 * @param options.allowedSentenceIds - Optional list of allowed sentence IDs
 * @returns A test machine configuration
 */
export function createTestConfig(
  options?: {
    allowedSentenceIds?: readonly string[]
  },
): NmeaMachineConfig<{ count: number }, Record<string, Packet>> {
  return {
    adapter: (packets) => ({ count: Object.keys(packets).length }),
    allowedSentenceIds: options?.allowedSentenceIds ?? ['GGA', 'RMC'],
    initialData: { count: 0 },
    initialPackets: {},
  }
}

/**
 * Creates a test machine configuration with a custom adapter.
 *
 * @param adapter - The adapter function to use
 * @param options - Optional configuration overrides
 * @param options.allowedSentenceIds - Optional list of allowed sentence IDs
 * @param options.initialData - Optional initial data value
 * @param options.initialPackets - Optional initial packets value
 * @returns A test machine configuration
 */
export function createCustomTestConfig<TData>(
  adapter: (packets: Record<string, Packet>) => TData,
  options?: {
    allowedSentenceIds?: readonly string[]
    initialData?: TData
    initialPackets?: Record<string, Packet>
  },
): NmeaMachineConfig<TData, Record<string, Packet>> {
  return {
    adapter,
    allowedSentenceIds: options?.allowedSentenceIds,
    initialData: options?.initialData ?? (adapter({}) as TData),
    initialPackets: options?.initialPackets ?? {},
  }
}
