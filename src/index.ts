/**
 * @packageDocumentation
 * @categoryDescription Core
 * NMEA Web Serial API -- This description is added with the `@categoryDescription` tag
 * on the entry point in src/index.ts
 *
 * @document documents/examples.md
 */

// Navigation adapter (convenience for navigation-focused use cases)
export {
  createNavigationNmeaClient,
  createNavigationNmeaMachine,
  type NavigationData,
  type StoredPackets,
} from './adapters/navigation'

// Core machine functionality
export {
  createNmeaMachine,
  NmeaClient,
  type NmeaClientOptions,
  type NmeaContext,
  type NmeaEvent,
  type NmeaMachineActor,
  type NmeaMachineConfig,
} from './core'

// Parser
export {
  parseNmeaSentence,
  parseUnsafeNmeaSentence,
  type UnsafeAndCustomPackets,
} from './parser'

// Codecs (custom NMEA sentence decoders)
export type { DBKPacket } from './parser/codecs/DBK'
export type { DBSPacket } from './parser/codecs/DBS'
export type { DPTPacket } from './parser/codecs/DPT'

// re-export all of the nmea-simple packets types
export type { Packet } from 'nmea-simple'
