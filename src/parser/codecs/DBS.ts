/*
 * === DBS - Depth Below Surface ===
 *
 * ------------------------------------------------------------------------------
 *        1   2 3   4 5   6 7
 *        |   | |   | |   | |
 * $--DBS,x.x,f,x.x,M,x.x,F*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 *  1. Depth below surface, feet
 *  2. Feet unit ('f')
 *  3. Depth below surface, meters
 *  4. Meters unit ('M')
 *  5. Depth below surface, fathoms
 *  6. Fathoms unit ('F')
 *  7. Checksum
 */

import type { PacketStub } from 'nmea-simple/dist/codecs/PacketStub'
import { initStubFields } from 'nmea-simple/dist/codecs/PacketStub'
import { parseFloatSafe } from '../../utils'

export const sentenceId = 'DBS' as const
export const sentenceName = 'Depth Below Surface' as const

export interface DBSPacket extends PacketStub<typeof sentenceId> {
  depthFeet: number
  depthMeters: number
  depthFathoms: number
}

export function decodeSentence(stub: PacketStub, fields: string[]): DBSPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    depthFeet: parseFloatSafe(fields[1]),
    depthMeters: parseFloatSafe(fields[3]),
    depthFathoms: parseFloatSafe(fields[5]),
  }
}
