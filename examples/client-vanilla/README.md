# NMEA Web Serial - Client API Vanilla Example

This is a vanilla HTML example using the Client API to demonstrate how to use the NMEA Web Serial library without directly working with XState.

## Setup

From the root directory:

```bash
npm install
```

This will install dependencies for the workspace, including the example. The example uses the local `nmea-web-serial` package via workspace linking.

Or from the example directory:

```bash
cd examples/client-vanilla
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
- Using the Client API for a simpler, more intuitive interface

## How it works

The example uses:
- `NavigationNmeaClient` class to create a client instance with callbacks
- `client.connect()` and `client.disconnect()` methods for connection management
- `client.setBaudRate()` to configure the baud rate
- `client.isConnected`, `client.isConnecting`, `client.data`, and `client.error` properties
- Callback functions (`onData`, `onStateChange`, `onError`) to react to state changes
- TypeScript for type safety
- Vanilla JavaScript (no framework required)

This demonstrates the Client API which provides a simpler, more intuitive interface compared to working directly with XState machines. The Client API abstracts away the XState details while still providing full functionality.
