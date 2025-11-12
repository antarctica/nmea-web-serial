/*
 * === DPT - Depth of Water ===
 *
 * ------------------------------------------------------------------------------
 *        1   2   3   4
 *        |   |   |   |
 * $--DPT,x.x,x.x,x.x*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 * 1. Water depth relative to transducer, meters
 * 2. Offset from transducer, meters (positive = distance from transducer to water line, negative = distance from transducer to keel)
 * 3. Maximum range scale in use (NMEA 3.0 and above)
 * 4. Checksum
 */

import type { PacketStub } from 'nmea-simple/dist/codecs/PacketStub'
import { initStubFields } from 'nmea-simple/dist/codecs/PacketStub'
import { parseFloatSafe } from '../../utils'

export const sentenceId = 'DPT' as const
export const sentenceName = 'Depth of Water' as const

export interface DPTPacket extends PacketStub<typeof sentenceId> {
  depthMeters: number
  offsetMeters: number
  maximumRangeScale: number
}

export function decodeSentence(stub: PacketStub, fields: string[]): DPTPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    depthMeters: parseFloatSafe(fields[1]),
    offsetMeters: parseFloatSafe(fields[2]),
    maximumRangeScale: parseFloatSafe(fields[3]),
  }
}
