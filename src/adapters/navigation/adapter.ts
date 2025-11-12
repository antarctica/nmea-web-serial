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
  'HDM',
  'DPT',
  'DBT',
  'DBS',
  'DBK',
  'ZDA',
] as const

/**
 * Creates a navigation adapter function with the specified magnetic variation.
 * The adapter is a closure that captures the variation value.
 *
 * @param externalVariation - Optional magnetic variation for heading calculations.
 * @returns An adapter function that transforms packets into navigation data.
 */
export function createNavigationAdapter(externalVariation?: number) {
  return (packets: StoredPackets): NavigationData => {
    return computeNavigationData(packets, externalVariation)
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
export function createNavigationNmeaConfig(
  options?: {
    allowedSentenceIds?: readonly string[]
    externalVariation?: number
  },
): NmeaMachineConfig<NavigationData, StoredPackets> {
  return {
    adapter: createNavigationAdapter(options?.externalVariation),
    allowedSentenceIds: options?.allowedSentenceIds ?? NAVIGATION_SENTENCE_IDS,
    initialData: initialNavigationData,
    initialPackets: initialNavigationPackets,
  }
}

/**
 * Convenience function to create a navigation-focused NMEA machine.
 * This is a pre-configured machine that computes navigation data from NMEA packets.
 *
 * @param options - Optional configuration for the navigation machine.
 * @param options.allowedSentenceIds - Optional array of allowed sentence IDs.
 * @param options.externalVariation - Optional magnetic variation for heading calculations.
 * @returns An NMEA machine configured for navigation data computation.
 *
 * @example
 * ```typescript
 * const machine = createNavigationNmeaMachine({
 *   externalVariation: 5.5,
 * });
 * ```
 */
export function createNavigationNmeaMachine(
  options?: {
    allowedSentenceIds?: readonly string[]
    externalVariation?: number
  },
) {
  return createNmeaMachine(createNavigationNmeaConfig(options))
}
