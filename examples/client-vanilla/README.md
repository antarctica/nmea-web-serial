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

This will start a Vite dev server on port 5176 (or the next available port) and open the example in your browser.

**How it works in development:**
- The example imports from `'nmea-web-serial'` in the code
- Vite's alias configuration redirects this to the parent library's source (`../../src/index.ts`)
- This enables hot module reloading - changes to the parent library source will automatically reload in the example
- No need to rebuild the parent library during development

## Production Build

From the example directory:

```bash
cd examples/client-vanilla
npm run build
```

**How it works in production:**
- The Vite alias is disabled during build (production mode)
- The example uses the built workspace package from `node_modules`
- Make sure to build the parent library first: `npm run build` (from root)
- The built example is self-contained and can be deployed independently

## What the example demonstrates

- Connecting to a serial port via the Web Serial API
- Parsing NMEA sentences in real-time
- Displaying navigation data (time, position, speed, heading, depth)
- Using the Client API for a simpler, more intuitive interface

## How it works

The example uses:
- `createNavigationNmeaClient()` to create a client instance with callbacks
- `client.connect()` and `client.disconnect()` methods for connection management
- `client.setBaudRate()` to configure the baud rate
- `client.isConnected`, `client.isConnecting`, `client.data`, and `client.error` properties
- Callback functions (`onData`, `onStateChange`, `onError`) to react to state changes
- TypeScript for type safety
- Vanilla JavaScript (no framework required)

This demonstrates the Client API which provides a simpler, more intuitive interface compared to working directly with XState machines. The Client API abstracts away the XState details while still providing full functionality.

