/**
 * Core NMEA machine functionality.
 */

export { NmeaClient } from './client'
export type { NmeaClientOptions } from './client'
export { createNmeaMachine, type NmeaMachineActor } from './machine'
export type { NmeaContext, NmeaEvent, NmeaMachineConfig } from './types'
