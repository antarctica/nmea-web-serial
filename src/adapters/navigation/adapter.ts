/**
 * Navigation adapter factory and configuration.
 */

import type { NmeaMachineConfig } from '../../core'
import type { NavigationData, StoredPackets } from './types'
import { createNmeaMachine } from '../../core'
import { computeNavigationData } from './computation'

/**
 * Default sentence IDs used for navigation data computation.
 * Includes standard NMEA sentences and custom depth sentences.
 */
export const NAVIGATION_SENTENCE_IDS = [
  'GGA',
  'RMC',
  'GLL',
  'VTG',
  'HDT',
  'HDG',
  'DPT',
  'DBT',
  'DBS',
  'DBK',
  'ZDA',
] as const

/**
 * Creates a navigation adapter function.
 * Transforms stored packets into navigation data.
 *
 * @returns An adapter function that transforms packets into navigation data.
 */
export function createNavigationAdapter() {
  return (packets: StoredPackets): NavigationData => {
    return computeNavigationData(packets)
  }
}

/**
 * Initial navigation data state.
 */
export const initialNavigationData: NavigationData = {
  time: null,
  position: null,
  speed: null,
  heading: null,
  depth: null,
}

/**
 * Initial stored packets state.
 */
export const initialNavigationPackets: StoredPackets = {}

/**
 * Configuration for creating a navigation-focused NMEA machine.
 * This is a convenience configuration that uses the navigation adapter.
 */
export function createNavigationNmeaConfig(): NmeaMachineConfig<NavigationData, StoredPackets> {
  return {
    adapter: createNavigationAdapter(),
    allowedSentenceIds: NAVIGATION_SENTENCE_IDS,
    initialData: initialNavigationData,
    initialPackets: initialNavigationPackets,
  }
}

/**
 * Convenience function to create a navigation-focused NMEA machine.
 * This is a pre-configured machine that computes navigation data from NMEA packets.
 *
 * @returns An NMEA machine configured for navigation data computation.
 *
 * @example
 * ```typescript
 * const machine = createNavigationNmeaMachine();
 * ```
 */
export function createNavigationNmeaMachine() {
  return createNmeaMachine(createNavigationNmeaConfig())
}
