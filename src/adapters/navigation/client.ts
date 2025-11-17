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
 * @example
 * ```typescript
 * const client = new NavigationNmeaClient({
 *   enableLogging: true,
 *   onData: (navigation) => {
 *     console.log('Position:', navigation.position);
 *   },
 * });
 *
 * client.connect();
 * ```
 */
export class NavigationNmeaClient extends NmeaClient<NavigationData, StoredPackets> {
  /**
   * Creates a new navigation NMEA client.
   *
   * @param options - Optional configuration and callbacks.
   */
  constructor(options?: NmeaClientOptions<NavigationData>) {
    const machine = createNavigationNmeaMachine()
    super(machine, {
      enableLogging: options?.enableLogging,
      baudRate: options?.baudRate,
      onData: options?.onData,
      onStateChange: options?.onStateChange,
      onError: options?.onError,
    })
  }
}
