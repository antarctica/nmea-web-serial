/**
 * Navigation data computation functions.
 */

import type {
  DBTPacket,
  GGAPacket,
  GLLPacket,
  HDGPacket,
  HDTPacket,
  RMCPacket,
  VTGPacket,
  ZDAPacket,
} from 'nmea-simple'
import type { NavigationData, StoredPackets } from './types'

/**
 * Computes position from available packets.
 * Priority: 1. GGA, 2. RMC, 3. GLL
 */
function computePosition(
  gga?: GGAPacket,
  rmc?: RMCPacket,
  gll?: GLLPacket,
): NavigationData['position'] {
  if (gga && gga.fixType !== 'none') {
    return {
      latitude: gga.latitude,
      longitude: gga.longitude,
      source: 'GGA',
      fixType: gga.fixType,
      altitudeMeters: gga.altitudeMeters,
      satellitesInView: gga.satellitesInView,
      horizontalDilution: gga.horizontalDilution,
    }
  }

  if (rmc && rmc.status === 'valid') {
    return {
      latitude: rmc.latitude,
      longitude: rmc.longitude,
      source: 'RMC',
      status: rmc.status,
    }
  }

  if (gll && gll.status === 'valid') {
    return {
      latitude: gll.latitude,
      longitude: gll.longitude,
      source: 'GLL',
      status: 'valid',
    }
  }

  return null
}

/**
 * Computes time from available packets.
 * Priority: 1. ZDA, 2. GGA, 3. RMC, 4. GLL
 * Local time is only calculated when ZDA is available (includes timezone offset).
 */
function computeTime(
  zda?: ZDAPacket,
  gga?: GGAPacket,
  rmc?: RMCPacket,
  gll?: GLLPacket,
): NavigationData['time'] {
  if (zda) {
    // Calculate local time from UTC + timezone offset
    const localTime = new Date(zda.datetime)
    const offsetMinutes = zda.localZoneHours * 60 + zda.localZoneMinutes
    localTime.setMinutes(localTime.getMinutes() + offsetMinutes)

    return {
      utc: zda.datetime,
      local: localTime,
      source: 'ZDA',
    }
  }

  if (gga && gga.fixType !== 'none') {
    return {
      utc: gga.time,
      local: null,
      source: 'GGA',
    }
  }

  if (rmc && rmc.status === 'valid') {
    return {
      utc: rmc.datetime,
      local: null,
      source: 'RMC',
    }
  }

  if (gll && gll.status === 'valid') {
    return {
      utc: gll.time,
      local: null,
      source: 'GLL',
    }
  }

  return null
}

/**
 * Computes speed from available packets.
 * Priority: 1. VTG, 2. RMC
 */
function computeSpeed(
  vtg?: VTGPacket,
  rmc?: RMCPacket,
): NavigationData['speed'] {
  if (vtg) {
    return { knots: vtg.speedKnots, source: 'VTG' }
  }

  if (rmc && rmc.status === 'valid') {
    return { knots: rmc.speedKnots, source: 'RMC' }
  }

  return null
}

/**
 * Calculates variation value from HDG packet.
 * Variation direction: E = positive, W = negative
 */
function calculateVariationValue(hdg: HDGPacket): number {
  if (hdg.variationDirection === 'W') {
    return -hdg.variation
  }
  if (hdg.variationDirection === 'E') {
    return hdg.variation
  }
  // Default to positive if direction is empty
  return hdg.variation
}

/**
 * Computes heading from available packets.
 * Priority: 1. HDT, 2. HDG, 3. COG (from RMC or VTG)
 */
function computeHeading(
  hdt?: HDTPacket,
  hdg?: HDGPacket,
  rmc?: RMCPacket,
  vtg?: VTGPacket,
): NavigationData['heading'] {
  if (hdt && hdt.heading !== undefined) {
    return { degreesTrue: hdt.heading, source: 'HDT', isDerived: false }
  }

  if (hdg && hdg.heading !== undefined) {
    // HDG heading is magnetic, need to add variation to get true heading
    const variationValue = calculateVariationValue(hdg)
    return {
      degreesTrue: hdg.heading + variationValue,
      source: 'HDG',
      isDerived: false,
    }
  }

  // Fallback to COG (Course Over Ground) from RMC or VTG
  const cog = rmc?.trackTrue ?? vtg?.trackTrue
  if (cog !== undefined) {
    return { degreesTrue: cog, source: 'COG', isDerived: true }
  }

  return null
}

/**
 * Computes depth from available packets.
 * Priority: 1. DPT, 2. DBT, 3. DBS, 4. DBK
 */
function computeDepth(
  dpt?: { depthMeters?: number },
  dbt?: DBTPacket,
  dbs?: { depthMeters?: number },
  dbk?: { depthMeters?: number },
): NavigationData['depth'] {
  if (dpt && dpt.depthMeters !== undefined) {
    return { meters: dpt.depthMeters, source: 'DPT' }
  }

  if (dbt) {
    return { meters: dbt.depthMeters, source: 'DBT' }
  }

  if (dbs && dbs.depthMeters !== undefined) {
    return { meters: dbs.depthMeters, source: 'DBS' }
  }

  if (dbk && dbk.depthMeters !== undefined) {
    return { meters: dbk.depthMeters, source: 'DBK' }
  }

  return null
}

/**
 * Computes navigation data from stored packets using a fallback strategy.
 * Each navigation property (time, position, speed, heading, depth) is computed
 * with priority-based fallback to the best available data source.
 */
export function computeNavigationData(packets: StoredPackets): NavigationData {
  const time = computeTime(packets.ZDA, packets.GGA, packets.RMC, packets.GLL)
  const position = computePosition(packets.GGA, packets.RMC, packets.GLL)
  const speed = computeSpeed(packets.VTG, packets.RMC)
  const heading = computeHeading(packets.HDT, packets.HDG, packets.RMC, packets.VTG)
  const depth = computeDepth(packets.DPT, packets.DBT, packets.DBS, packets.DBK)

  return { time, position, speed, heading, depth }
}
