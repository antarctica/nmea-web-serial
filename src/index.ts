/**
 * NMEA Stream Processing Module
 *
 * This module provides functionality for parsing NMEA sentences from serial ports,
 * computing navigation data, and managing the state machine for serial port connections.
 */

// Navigation adapter (convenience for navigation-focused use cases)
export {
  computeNavigationData,
  createNavigationAdapter,
  createNavigationNmeaConfig,
  createNavigationNmeaMachine,
  initialNavigationData,
  initialNavigationPackets,
  NAVIGATION_SENTENCE_IDS,
  type NavigationData,
  type StoredPackets,
} from './adapters/navigation'

// Core machine functionality
export {
  createNmeaMachine,
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

// Utils (encoding/decoding utilities)
export * from './utils'
