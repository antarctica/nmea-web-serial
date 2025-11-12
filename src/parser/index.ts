/**
 * NMEA sentence parser with support for custom codecs.
 */

import type { Packet } from 'nmea-simple'
import type { PacketStub } from 'nmea-simple/dist/codecs/PacketStub'
import type { UnknownPacket } from 'nmea-simple/dist/codecs/UnknownPacket'
import type { DBKPacket } from './codecs/DBK'
import type { DBSPacket } from './codecs/DBS'
import type { DPTPacket } from './codecs/DPT'
import {
  DefaultPacketFactory,

  parseGenericPacket,
} from 'nmea-simple'
import { decodeSentence as decodeUnknown } from 'nmea-simple/dist/codecs/UnknownPacket'
import { decodeSentence as decodeDBK } from './codecs/DBK'
import { decodeSentence as decodeDBS } from './codecs/DBS'
import { decodeSentence as decodeDPT } from './codecs/DPT'

type CustomPackets = DBSPacket | DBKPacket | DPTPacket
type ExtendedNmeaPacket = Packet | CustomPackets

function assembleExtendedNmeaPacket(
  stub: PacketStub,
  fields: string[],
): CustomPackets | null {
  switch (stub.talkerId) {
    case 'DBS':
      return decodeDBS(stub, fields)
    case 'DBK':
      return decodeDBK(stub, fields)
    case 'DPT':
      return decodeDPT(stub, fields)
    default:
      return null
  }
}

class CustomPacketFactory extends DefaultPacketFactory<CustomPackets> {
  assembleCustomPacket(
    stub: PacketStub,
    fields: string[],
  ): CustomPackets | null {
    return assembleExtendedNmeaPacket(stub, fields)
  }
}

const SAFE_NMEA_PACKET_FACTORY = new CustomPacketFactory()

export function parseNmeaSentence(sentence: string): ExtendedNmeaPacket {
  return parseGenericPacket(sentence, SAFE_NMEA_PACKET_FACTORY)
}

export type UnsafeAndCustomPackets = CustomPackets | UnknownPacket

export class UnsafePacketFactory extends DefaultPacketFactory<UnsafeAndCustomPackets> {
  constructor() {
    super(true)
  }

  assembleCustomPacket(stub: PacketStub, fields: string[]): UnsafeAndCustomPackets | null {
    const assembledPacket = assembleExtendedNmeaPacket(stub, fields)
    if (!assembledPacket) {
      return decodeUnknown(stub, fields)
    }
    return assembledPacket
  }
}

const UNSAFE_NMEA_PACKET_FACTORY = new UnsafePacketFactory()

export function parseUnsafeNmeaSentence(sentence: string): ExtendedNmeaPacket | UnknownPacket {
  return parseGenericPacket(sentence, UNSAFE_NMEA_PACKET_FACTORY)
}
