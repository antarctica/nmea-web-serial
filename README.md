# NMEA 0183 sentence parser for the Web Serial API

This library provides a state machine-based solution for parsing NMEA 0183 sentences from serial ports using the Web Serial API. It builds on top of [nmea-simple](https://www.npmjs.com/package/nmea-simple) and extends it with custom depth sentence codecs (DPT, DBS, DBK) and a navigation data adapter that computes position, time, speed, heading, and depth from multiple NMEA sentences.

The library uses [XState](https://xstate.js.org/) to manage serial port connection state and provides a convenient navigation adapter that automatically computes navigation data from various NMEA sentence types.

The official NMEA 0183 standard can be found [here](http://www.nmea.org/content/nmea_standards/nmea_0183_v_410.asp) and is described in clear terms [here](https://gpsd.gitlab.io/gpsd/NMEA.html).

## Example

Typically, you will get NMEA sentences via the Web Serial API from a GPS module or other NMEA device. The library provides a state machine that handles connection, reading, parsing, and data computation.

```typescript
import { createNavigationNmeaMachine } from 'nmea-web-serial'
import { createActor } from 'xstate'

// Create the machine
const machine = createNavigationNmeaMachine()

// Create the actor
const actor = createActor(machine)
actor.start()

// Subscribe to state changes
actor.subscribe((state) => {
  if (state.value === 'connected') {
    const navigationData = state.context.data

    if (navigationData.position) {
      console.log('Position:', navigationData.position.latitude, navigationData.position.longitude)
    }

    if (navigationData.speed) {
      console.log('Speed:', navigationData.speed.knots, 'knots')
    }

    if (navigationData.heading) {
      console.log('Heading:', navigationData.heading.degreesTrue, '°')
    }
  }
})

// Connect to a serial port
actor.send({ type: 'CONNECT' })

// Disconnect when done
actor.send({ type: 'DISCONNECT' })
```

## TypeScript

This project is written in [TypeScript](http://www.typescriptlang.org/). The library can be used by plain JavaScript as shown above, and the typing information is included with the library so that anyone wishing to use TypeScript will gain the benefits of the type information.

## Packet types supported

The library supports all packet types from [nmea-simple](https://www.npmjs.com/package/nmea-simple), plus the following custom depth sentences:

- `DPT` - Depth
- `DBS` - Depth Below Surface
- `DBK` - Depth Below Keel

The navigation adapter uses the following sentence types to compute navigation data:

- `GGA` - GPS Fix Data
- `RMC` - Recommended Minimum Specific GNSS Data
- `GLL` - Geographic Position: Latitude/Longitude
- `VTG` - Course Over Ground and Ground Speed
- `HDT` - Heading, True
- `HDG` - Heading, Deviation & Variation
- `HDM` - Heading, Magnetic
- `DPT` - Depth
- `DBT` - Depth Below Transducer
- `DBS` - Depth Below Surface
- `DBK` - Depth Below Keel
- `ZDA` - Time & Date

## Navigation Data Adapter

The navigation adapter automatically computes navigation data from multiple NMEA sentences using priority-based fallback:

- **Position**: GGA (with fix) → RMC (valid) → GLL (valid)
- **Time**: ZDA → GGA → RMC → GLL (ZDA includes timezone for local time)
- **Speed**: VTG → RMC
- **Heading**: HDT → HDG → HDM (with external variation) → COG (from RMC/VTG)
- **Depth**: DPT → DBT → DBS → DBK

## Custom Machines

You can create custom machines with your own adapter functions:

```typescript
import { createNmeaMachine } from 'nmea-web-serial'

interface MyData {
  customField: string | null
}

interface MyPackets extends Record<string, unknown> {
  GGA?: GGAPacket
  // ... other packet types
}

function myAdapter(packets: MyPackets): MyData {
  return {
    customField: packets.GGA ? 'has position' : null
  }
}

const machine = createNmeaMachine({
  adapter: myAdapter,
  allowedSentenceIds: ['GGA', 'RMC'],
  initialData: { customField: null },
  initialPackets: {},
})
```

## Browser Support

The Web Serial API is supported in:
- Chrome 89+
- Edge 89+
- Opera 75+

Firefox and Safari do not currently support the Web Serial API.

## Acknowledgements

This module is built on top of [nmea-simple](https://www.npmjs.com/package/nmea-simple) and uses [XState](https://xstate.js.org/) for state management. The documentation was expanded based on the excellent [analysis and descriptions](http://catb.org/gpsd/NMEA.html) by Eric S. Raymond.
