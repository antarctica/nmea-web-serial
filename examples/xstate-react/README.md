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

## What the example demonstrates

- Connecting to a serial port via the Web Serial API
- Parsing NMEA sentences in real-time
- Displaying navigation data (time, position, speed, heading, depth)
- Managing connection state with XState and React hooks

## How it works

The example uses:
- `createNavigationNmeaMachine()` to create an XState machine configured for navigation data
- `useMachine()` hook from `@xstate/react` to automatically start and manage the machine lifecycle
- React components to render the UI reactively based on state
- TypeScript for type safety

This demonstrates the same functionality as the vanilla example but uses React for the UI layer, making it easier to build more complex interfaces. The `useMachine()` hook automatically handles starting and stopping the machine, making it simpler than manually managing actors.
