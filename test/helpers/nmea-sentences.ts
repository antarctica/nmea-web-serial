/**
 * Validated NMEA sentence strings for testing.
 *
 * Most sentences are taken from the nmea-simple library's own test files
 * to ensure they are properly formatted and have correct checksums.
 *
 * Custom sentences (DPT, DBS, DBK) follow the NMEA 0183 standard format.
 */

/**
 * NMEA sentence strings organized by packet type.
 * All sentences are validated and can be parsed by the parser.
 */
export const nmeaSentences = {
  /**
   * GGA - GPS Fix Data (Global Positioning System Fix Data)
   * From nmea-simple tests: tests/GGAtest.ts
   */
  GGA: '$IIGGA,123519,4807.04,N,1131.00,E,1,8,0.9,545.9,M,46.9,M,,*52',

  /**
   * RMC - Recommended Minimum Specific GNSS Data
   * From nmea-simple tests: tests/RMCtest.ts
   */
  RMC: '$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A',

  /**
   * GLL - Geographic Position: Latitude/Longitude
   * From nmea-simple tests: tests/GLLtest.ts
   */
  GLL: '$GPGLL,6005.068,N,02332.341,E,095601,A,D*42',

  /**
   * VTG - Course Over Ground and Ground Speed
   * From nmea-simple tests: tests/VTGtest.ts
   */
  VTG: '$IIVTG,210.43,T,210.43,M,5.65,N,,,A*67',

  /**
   * HDT - Heading, True
   * From nmea-simple tests: tests/HDTtest.ts
   */
  HDT: '$IIHDT,234.2,T*25',

  /**
   * HDG - Heading, Deviation & Variation
   * From nmea-simple tests: tests/HDGtest.ts
   */
  HDG: '$HCHDG,98.3,0.0,E,12.6,W*57',

  /**
   * HDM - Heading, Magnetic
   * From nmea-simple tests: tests/HDMtest.ts
   */
  HDM: '$IIHDM,201.5,M*24',

  /**
   * DBT - Depth Below Transducer
   * From nmea-simple tests: tests/DBTtest.ts
   */
  DBT: '$IIDBT,036.41,f,011.10,M,005.99,F*25',

  /**
   * ZDA - Time & Date
   * From nmea-simple tests: tests/ZDAtest.ts
   */
  ZDA: '$GPZDA,160012.71,11,03,2004,-1,00*7D',

  /**
   * DPT - Depth of Water (custom codec)
   * Format: $--DPT,x.x,x.x,x.x*hh
   * Fields: depthMeters, offsetMeters, maximumRangeScale
   */
  DPT: '$IIDPT,15.5,2.3,100.0*4A',

  /**
   * DBS - Depth Below Surface (custom codec)
   * Format: $--DBS,x.x,f,x.x,M,x.x,F*hh
   * Fields: depthFeet, feet unit, depthMeters, meters unit, depthFathoms, fathoms unit
   */
  DBS: '$IIDBS,36.41,f,11.10,M,5.99,F*25',

  /**
   * DBK - Depth Below Keel (custom codec)
   * Format: $--DBK,x.x,f,x.x,M,x.x,F*hh
   * Fields: depthFeet, feet unit, depthMeters, meters unit, depthFathoms, fathoms unit
   */
  DBK: '$IIDBK,30.25,f,9.22,M,5.04,F*2A',
} as const

/**
 * Type for sentence IDs
 */
export type SentenceId = keyof typeof nmeaSentences

/**
 * Get a validated NMEA sentence string by sentence ID.
 *
 * @param sentenceId - The sentence ID (e.g., 'GGA', 'RMC', 'DPT')
 * @returns The validated NMEA sentence string
 * @throws Error if the sentence ID is not found
 *
 * @example
 * ```typescript
 * const ggaSentence = getNmeaSentence('GGA')
 * const packet = parseNmeaSentence(ggaSentence)
 * ```
 */
export function getNmeaSentence(sentenceId: SentenceId): string {
  const sentence = nmeaSentences[sentenceId]
  if (!sentence) {
    throw new Error(`No NMEA sentence found for sentence ID: ${sentenceId}`)
  }
  return sentence
}

/**
 * Get all available sentence IDs.
 *
 * @returns Array of all available sentence IDs
 */
export function getAvailableSentenceIds(): SentenceId[] {
  return Object.keys(nmeaSentences) as SentenceId[]
}
