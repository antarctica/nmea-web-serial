/**
 * Simple client for navigation NMEA data.
 * Provides a convenient, type-safe API for navigation use cases.
 */

import type { NmeaClientOptions } from '../../core/client'
import type { NavigationData, StoredPackets } from './types'
import { NmeaClient } from '../../core/client'
import { createNavigationNmeaMachine } from './adapter'

/**
 * Options for the navigation NMEA client.
 */
export interface NavigationNmeaClientOptions extends Omit<NmeaClientOptions<NavigationData>, 'onData'> {
  /** Optional magnetic variation for heading calculations. */
  externalVariation?: number
  /** Optional list of sentence IDs to filter. */
  allowedSentenceIds?: readonly string[]
  /** Callback function called when navigation data is updated. */
  onData?: (navigation: NavigationData) => void
}

/**
 * Simple client for navigation NMEA data.
 * Creates a machine and manages connection state automatically.
 *
 * @param options - Configuration options.
 * @returns A client instance for managing the NMEA connection.
 *
 * @example
 * ```typescript
 * const client = createNavigationNmeaClient({
 *   externalVariation: 5.5,
 *   enableLogging: true,
 *   onData: (navigation) => {
 *     console.log('Position:', navigation.position);
 *   },
 * });
 *
 * client.connect();
 * ```
 */
export function createNavigationNmeaClient(
  options?: NavigationNmeaClientOptions,
): NmeaClient<NavigationData, StoredPackets> {
  const machine = createNavigationNmeaMachine({
    externalVariation: options?.externalVariation,
    allowedSentenceIds: options?.allowedSentenceIds,
  })

  return new NmeaClient<NavigationData, StoredPackets>(machine, {
    enableLogging: options?.enableLogging,
    baudRate: options?.baudRate,
    onData: options?.onData,
    onStateChange: options?.onStateChange,
    onError: options?.onError,
  })
}
