/*
 * === DBS - Depth Below Surface ===
 *
 * ------------------------------------------------------------------------------
 *        1   2 3   4 5   6 7
 *        |   | |   | |   | |
 * $--DBK,x.x,f,x.x,M,x.x,F*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 *  1. Depth below keel, feet
 *  2. Feet unit ('f')
 *  3. Depth below keel, meters
 *  4. Meters unit ('M')
 *  5. Depth below keel, fathoms
 *  6. Fathoms unit ('F')
 *  7. Checksum
 */

import type { PacketStub } from 'nmea-simple/dist/codecs/PacketStub'
import { initStubFields } from 'nmea-simple/dist/codecs/PacketStub'
import { parseFloatSafe } from '../../utils'

export const sentenceId = 'DBK' as const
export const sentenceName = 'Depth Below Keel' as const

export interface DBKPacket extends PacketStub<typeof sentenceId> {
  depthFeet: number
  depthMeters: number
  depthFathoms: number
}

export function decodeSentence(stub: PacketStub, fields: string[]): DBKPacket {
  return {
    ...initStubFields(stub, sentenceId, sentenceName),
    depthFeet: parseFloatSafe(fields[1]),
    depthMeters: parseFloatSafe(fields[3]),
    depthFathoms: parseFloatSafe(fields[5]),
  }
}
