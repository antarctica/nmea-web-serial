# NMEA Web Serial - XState Vanilla Example

This is a vanilla HTML example using XState to demonstrate how to use the NMEA Web Serial library.

## Setup

From the root directory:

```bash
npm install
```

This will install dependencies for the workspace, including the example. The example uses the local `nmea-web-serial` package via workspace linking.

Or from the example directory:

```bash
cd examples/xstate-vanilla
npm install
```

This will install the example's dependencies, linking to the local `nmea-web-serial` package.

## Development

```bash
npm run dev
```

## What the example demonstrates

- Connecting to a serial port via the Web Serial API
- Parsing NMEA sentences in real-time
- Displaying navigation data (time, position, speed, heading, depth)
- Managing connection state with XState

## How it works

The example uses:
- `createNavigationNmeaMachine()` to create an XState machine configured for navigation data
- `createActor()` from XState to manage the machine state
- State subscriptions to update the UI when data changes
- TypeScript for type safety
- Vanilla JavaScript (no framework required)

This matches the functionality of the React example but uses plain TypeScript/JavaScript instead of React hooks.
