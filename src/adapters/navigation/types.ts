/**
 * Types for navigation data adapter.
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
import type { PacketStub } from 'nmea-simple/dist/codecs/PacketStub'
import type { DBKPacket } from '../../parser/codecs/DBK'
import type { DBSPacket } from '../../parser/codecs/DBS'
import type { DPTPacket } from '../../parser/codecs/DPT'

/**
 * Types for navigation data.
 */
export interface NavigationData {
  time: {
    utc: Date
    local: Date | null
    source: 'ZDA' | 'GGA' | 'RMC' | 'GLL' | null
  } | null
  position: {
    latitude: number
    longitude: number
    source: 'GGA' | 'RMC' | 'GLL' | null
    fixType?: 'none' | 'fix' | 'delta' | 'pps' | 'rtk' | 'frtk' | 'estimated' | 'manual' | 'simulation'
    status?: 'valid' | 'warning' | 'invalid'
    altitudeMeters?: number
    satellitesInView?: number
    horizontalDilution?: number
  } | null
  speed: {
    knots: number
    source: 'VTG' | 'RMC' | null
  } | null
  heading: {
    degreesTrue: number
    source: 'HDT' | 'HDG' | 'COG' | null
    isDerived: boolean
  } | null
  depth: {
    meters: number
    source: 'DPT' | 'DBT' | 'DBS' | 'DBK' | null
  } | null
}

/**
 * Types for stored packets by sentence type.
 */
export interface StoredPackets extends Record<string, PacketStub | undefined> {
  // GGA — GPS Fix Data (Global Positioning System Fix Data)
  GGA?: GGAPacket
  // RMC — Recommended Minimum Specific GNSS Data
  RMC?: RMCPacket
  // GLL — Geographic Position: Latitude/Longitude
  GLL?: GLLPacket
  // VTG — Course Over Ground and Ground Speed
  VTG?: VTGPacket
  // HDT — Heading, True
  HDT?: HDTPacket
  // HDG — Heading, Deviation & Variation
  HDG?: HDGPacket
  // DPT — Depth
  DPT?: DPTPacket
  // DBT — Depth Below Transducer
  DBT?: DBTPacket
  // DBS — Depth Below Surface
  DBS?: DBSPacket
  // DBK — Depth Below Keel
  DBK?: DBKPacket
  // ZDA — Time & Date
  ZDA?: ZDAPacket
}
