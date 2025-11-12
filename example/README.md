# NMEA Web Serial - Vanilla HTML Example

This is a vanilla HTML example demonstrating how to use the NMEA Web Serial library.

## Setup

From the root directory:

```bash
npm install
```

This will set up the workspace and link the `nmea-web-serial` package to the example.

Or from the example directory:

```bash
npm install
```

This will work the same way since the root package.json defines workspaces.

## Development

```bash
npm run dev
```

This will start a Vite dev server on port 5174 (or the next available port) and open the example in your browser.

**How it works in development:**
- The example imports from `'nmea-web-serial'` in the code
- Vite's alias configuration redirects this to the parent library's source (`../src/index.ts`)
- This enables hot module reloading - changes to the parent library source will automatically reload in the example
- No need to rebuild the parent library during development

## Production Build

From the root directory (recommended):

```bash
npm run build:all
```

This uses Turbo to build both the library and example in the correct order.

Or build individually:

```bash
# Build the library first
npm run build

# Then build the example
cd example
npm run build
```

**How it works in production:**
- Turbo ensures dependencies are built first (`nmea-web-serial` before `example`)
- The Vite alias is disabled during build
- The example uses the built package from `node_modules` (via the workspace dependency)
- The built example is self-contained and can be deployed independently
- Turbo caches builds for faster subsequent builds

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
