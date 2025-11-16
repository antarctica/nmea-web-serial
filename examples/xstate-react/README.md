# NMEA Web Serial - XState React Example

This is a React example using XState to demonstrate how to use the NMEA Web Serial library.

## Setup

From the root directory:

```bash
npm install
```

This will install dependencies for the workspace, including the example. The example uses the local `nmea-web-serial` package via workspace linking.

Or from the example directory:

```bash
cd examples/xstate-react
npm install
```

This will install the example's dependencies, linking to the local `nmea-web-serial` package.

## Development

```bash
npm run dev
```

This will start a Vite dev server on port 5175 (or the next available port) and open the example in your browser.

**How it works in development:**
- The example imports from `'nmea-web-serial'` in the code
- Vite's alias configuration redirects this to the parent library's source (`../../src/index.ts`)
- This enables hot module reloading - changes to the parent library source will automatically reload in the example
- No need to rebuild the parent library during development

## Production Build

From the example directory:

```bash
cd examples/xstate-react
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
- Managing connection state with XState and React hooks

## How it works

The example uses:
- `createNavigationNmeaMachine()` to create an XState machine configured for navigation data
- `createActor()` from XState to create an actor instance
- `useActor()` hook from `@xstate/react` to subscribe to state changes in React
- React components to render the UI reactively based on state
- TypeScript for type safety

This demonstrates the same functionality as the vanilla example but uses React for the UI layer, making it easier to build more complex interfaces.

