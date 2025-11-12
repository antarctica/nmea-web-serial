# Testing XState Machines

This directory contains comprehensive tests for the NMEA state machine implementation, demonstrating XState testing patterns.

## Testing Patterns

### 1. Pure State Transitions

Test state transitions without side effects using `createActor` and `getSnapshot()`:

```typescript
const machine = createNmeaMachine(config)
const actor = createActor(machine)
actor.start()

actor.send({ type: 'CONNECT' })
const snapshot = actor.getSnapshot()
expect(snapshot.value).toBe('connecting')
```

### 2. Mocking Actors

Use `machine.provide()` to replace actors with mocks for testing:

```typescript
const mockMachine = machine.provide({
  actors: {
    connectToSerial: fromPromise(async ({ input }) => {
      await mockPort.open({ baudRate: input.baudRate })
      return mockPort as any
    }),
    readNmeaStream: fromCallback(() => () => {}),
    closePort: fromPromise(async () => {}),
  },
})
```

### 3. Testing Async Behavior

Wait for state transitions using subscriptions:

```typescript
await new Promise<void>((resolve) => {
  const subscription = actor.subscribe((state) => {
    if (state.value === 'connected') {
      subscription.unsubscribe()
      resolve()
    }
  })
})
```

### 4. Testing Context Updates

Verify that context updates correctly when events are received:

```typescript
actor.send({ type: 'SERIAL.DATA', data: mockPacket })
const snapshot = actor.getSnapshot()
expect(snapshot.context.packets.GGA).toBeDefined()
expect(snapshot.context.data.count).toBe(1)
```

### 5. Testing State Subscriptions

Verify that subscribers are notified of state changes:

```typescript
const stateHistory: string[] = []
const subscription = actor.subscribe((state) => {
  stateHistory.push(state.value as string)
})

actor.start()
actor.send({ type: 'CONNECT' })

expect(stateHistory).toContain('disconnected')
expect(stateHistory).toContain('connecting')
```

## Key Concepts

### Mock SerialPort

Since the Web Serial API is not available in Node.js test environments, we use a `MockSerialPort` class that implements the `SerialPort` interface.

### Actor Lifecycle

1. Create machine with `createNmeaMachine()`
2. Create actor with `createActor(machine)`
3. Start actor with `actor.start()`
4. Send events with `actor.send(event)`
5. Subscribe to state changes with `actor.subscribe()`
6. Get current state with `actor.getSnapshot()`
7. Stop actor with `actor.stop()` or `client.dispose()`

### State-Aware Testing

Remember that certain events (like `SERIAL.DATA`) are only handled in specific states (e.g., `connected`). Always ensure the machine is in the correct state before sending events.

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## References

- [XState Testing Guide](https://stately.ai/docs/testing)
- [XState Actors Documentation](https://stately.ai/docs/actors)
- [Vitest Documentation](https://vitest.dev/)
