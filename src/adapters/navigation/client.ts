/**
 * Simple client for navigation NMEA data.
 * Provides a convenient, type-safe API for navigation use cases.
 */

import type { NmeaClientOptions } from '../../core/client'
import type { NavigationData, StoredPackets } from './types'
import { NmeaClient } from '../../core/client'
import { createNavigationNmeaMachine } from './adapter'

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
  options?: NmeaClientOptions<NavigationData>,
): NmeaClient<NavigationData, StoredPackets> {
  const machine = createNavigationNmeaMachine()

  return new NmeaClient<NavigationData, StoredPackets>(machine, {
    enableLogging: options?.enableLogging,
    baudRate: options?.baudRate,
    onData: options?.onData,
    onStateChange: options?.onStateChange,
    onError: options?.onError,
  })
}
