# NMEA 0183 sentence parser for the Web Serial API

This library provides a state machine-based solution for parsing NMEA 0183 sentences from serial ports using the Web Serial API. It builds on top of [nmea-simple](https://www.npmjs.com/package/nmea-simple) and extends it with custom depth sentence codecs (DPT, DBS, DBK) and a navigation data adapter that computes position, time, speed, heading, and depth from multiple NMEA sentences.

The library uses [XState](https://xstate.js.org/) to manage serial port connection state and provides a convenient navigation adapter that automatically computes navigation data from various NMEA sentence types.

The official NMEA 0183 standard can be found [here](http://www.nmea.org/content/nmea_standards/nmea_0183_v_410.asp) and is described in clear terms [here](https://gpsd.gitlab.io/gpsd/NMEA.html).

## Installation

```bash
npm install nmea-web-serial
```

## Quick Start

The simplest way to use the library is with the client API, which provides a clean abstraction over the state machine:

```typescript
import { createNavigationNmeaClient } from 'nmea-web-serial'

// Create a client for navigation data
const client = createNavigationNmeaClient({
  baudRate: 4800,
  enableLogging: false,
  onData: (navigationData) => {
    if (navigationData.position) {
      console.log('Position:', navigationData.position.latitude, navigationData.position.longitude)
    }
    if (navigationData.speed) {
      console.log('Speed:', navigationData.speed.knots, 'knots')
    }
    if (navigationData.heading) {
      console.log('Heading:', navigationData.heading.degreesTrue, '°')
    }
  },
  onStateChange: (isConnected) => {
    console.log('Connection state:', isConnected ? 'connected' : 'disconnected')
  },
  onError: (error) => {
    console.error('Error:', error)
  },
})

// Connect to a serial port
client.connect()

// Access current data
const currentData = client.data
const isConnected = client.isConnected

// Disconnect when done
client.disconnect()

// Clean up resources
client.dispose()
```

## Client API

The client API provides a simple, framework-agnostic interface for managing NMEA connections without needing to work directly with XState machines.

### Navigation Client

For navigation-focused use cases, use `createNavigationNmeaClient`:

```typescript
import { createNavigationNmeaClient } from 'nmea-web-serial'

const client = createNavigationNmeaClient({
  // Optional: baud rate (default: 4800)
  baudRate: 4800,

  // Optional: enable logging of parsed packets
  enableLogging: true,

  // Optional: callback when navigation data updates
  onData: (navigationData) => {
    // navigationData contains position, time, speed, heading, depth
  },

  // Optional: callback when connection state changes
  onStateChange: (isConnected) => {
    // isConnected is true when connected, false otherwise
  },

  // Optional: callback when errors occur
  onError: (error) => {
    // error is a string message
  },
})
```

### Generic Client

For custom data adapters, use the generic `NmeaClient`:

```typescript
import { createNmeaMachine, NmeaClient } from 'nmea-web-serial'

// Create a custom machine with your adapter
const machine = createNmeaMachine({
  adapter: myAdapter,
  allowedSentenceIds: ['GGA', 'RMC'],
  initialData: { customField: null },
  initialPackets: {},
})

// Create a client from the machine
const client = new NmeaClient(machine, {
  baudRate: 4800,
  enableLogging: false,
  onData: (data) => {
    // Your custom data type
  },
  onStateChange: (isConnected) => {
    // Connection state changes
  },
  onError: (error) => {
    // Error handling
  },
})
```

### Client Methods and Properties

- `client.connect()` - Connects to a serial port (triggers browser port selection dialog)
- `client.disconnect()` - Disconnects from the serial port
- `client.data` - Get the current data (read-only property)
- `client.isConnected` - Check if currently connected (read-only property)
- `client.isConnecting` - Check if connection is in progress (read-only property)
- `client.error` - Get the current error message, if any (read-only property)
- `client.setLogging(enabled)` - Enable or disable logging of parsed packets
- `client.setBaudRate(baudRate)` - Set the baud rate (requires reconnection to take effect)
- `client.machine` - Access the underlying XState actor (for advanced use)
- `client.dispose()` - Clean up resources and stop the machine

## Machine API

For advanced use cases or when you need direct access to the XState machine, you can work with the machine API directly:

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

## The Adapter Pattern

The library uses an **adapter pattern** to transform raw NMEA packets into your application's data format. Here's how it works:

1. **Raw Packets Storage**: As NMEA sentences are parsed, they're stored in a `packets` object keyed by sentence ID (e.g., `{ GGA: {...}, RMC: {...} }`).

2. **Adapter Function**: An adapter is a function that takes the current `packets` object and transforms it into your desired data structure. This function is called automatically whenever a new packet arrives.

3. **Computed Data**: The result of the adapter function is stored as `data` in the machine context, which you can access via the client API or machine state.

**Example Flow:**
```
Raw NMEA Sentence → Parsed Packet → Stored in packets → Adapter Function → Computed Data
```

For example, the navigation adapter takes packets like `GGA`, `RMC`, `VTG`, etc., and computes a unified `NavigationData` object with `position`, `time`, `speed`, `heading`, and `depth` fields. It handles priority logic (e.g., prefer GGA over RMC for position) and data merging automatically.

You can create your own adapters to transform packets into any data structure that fits your application's needs.

## Navigation Data Adapter

The navigation adapter automatically computes navigation data from multiple NMEA sentences using priority-based fallback:

- **Position**: GGA (with fix) → RMC (valid) → GLL (valid)
- **Time**: ZDA → GGA → RMC → GLL (ZDA includes timezone for local time)
- **Speed**: VTG → RMC
- **Heading**: HDT → HDG → COG (from RMC/VTG)
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

## Packet Types Supported

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
- `DPT` - Depth
- `DBT` - Depth Below Transducer
- `DBS` - Depth Below Surface
- `DBK` - Depth Below Keel
- `ZDA` - Time & Date

## TypeScript

This project is written in [TypeScript](http://www.typescriptlang.org/). The library can be used by plain JavaScript as shown above, and the typing information is included with the library so that anyone wishing to use TypeScript will gain the benefits of the type information.

## Browser Support

The Web Serial API is supported in:
- Chrome 89+
- Edge 89+
- Opera 75+

Firefox and Safari do not currently support the Web Serial API.

## Acknowledgements

This module is built on top of [nmea-simple](https://www.npmjs.com/package/nmea-simple) and uses [XState](https://xstate.js.org/) for state management. The documentation was expanded based on the excellent [analysis and descriptions](http://catb.org/gpsd/NMEA.html) by Eric S. Raymond.
