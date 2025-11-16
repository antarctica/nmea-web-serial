/**
 * Navigation adapter for NMEA machines.
 * Provides convenience functions and types for navigation-focused use cases.
 */

export {
  createNavigationAdapter,
  createNavigationNmeaConfig,
  createNavigationNmeaMachine,
  initialNavigationData,
  initialNavigationPackets,
  NAVIGATION_SENTENCE_IDS,
} from './adapter'

export { createNavigationNmeaClient } from './client'

export { computeNavigationData } from './computation'
export type { NavigationData, StoredPackets } from './types'
