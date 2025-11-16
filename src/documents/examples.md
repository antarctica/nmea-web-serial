---
title: Examples
group: Documentation
---

# Example Implementations

This library includes several example implementations demonstrating different ways to use the NMEA Web Serial library. Each example is available in the [GitHub repository](https://github.com/antarctica/nmea-web-serial).

## Client API - Vanilla JavaScript

**Live Demo:** [View Example](https://antarctica.github.io/nmea-web-serial/examples/client-vanilla/)  
**Source Code:** [`examples/client-vanilla`](https://github.com/antarctica/nmea-web-serial/tree/main/examples/client-vanilla)

A vanilla HTML/TypeScript example using the Client API. This demonstrates the simplest way to use the library without directly working with XState machines.

**Key features:**
- Uses `createNavigationNmeaClient()` to create a client instance with callbacks
- Simple callback-based API (`onData`, `onStateChange`, `onError`)
- No framework required - pure TypeScript/JavaScript

## XState - React

**Live Demo:** [View Example](https://antarctica.github.io/nmea-web-serial/examples/xstate-react/)  
**Source Code:** [`examples/xstate-react`](https://github.com/antarctica/nmea-web-serial/tree/main/examples/xstate-react)

A React example using XState to demonstrate how to use the NMEA Web Serial library with React hooks.

**Key features:**
- Uses `createNavigationNmeaMachine()` to create an XState machine
- Uses `useMachine` hook from `@xstate/react` for reactive state management when using XState with React.

## XState - Vanilla JavaScript

**Live Demo:** [View Example](https://antarctica.github.io/nmea-web-serial/examples/xstate-vanilla/)  
**Source Code:** [`examples/xstate-vanilla`](https://github.com/antarctica/nmea-web-serial/tree/main/examples/xstate-vanilla)

A vanilla HTML/TypeScript example using XState to demonstrate how to use the NMEA Web Serial library without React.

**Key features:**
- Uses `createNavigationNmeaMachine()` to create an XState machine
- Uses `createActor` from XState to create an actor instance from the machine.

