/**
 * Tests for the NMEA state machine using XState testing patterns.
 *
 * This file demonstrates:
 * 1. Testing pure state transitions (without side effects)
 * 2. Testing with mocked actors (connectToSerial, readNmeaStream, closePort)
 * 3. Testing state changes and context updates
 * 4. Testing async behavior
 */

import type { MockSerialPort } from './helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createActor } from 'xstate'
import { createNmeaMachine } from '../src/core/machine'
import {
  cleanupNavigatorSerialMock,
  createCustomTestConfig,
  createMockActors,
  createMockClosePortActor,
  createMockConnectToSerialErrorActor,
  createMockReadNmeaStreamWithStopActor,
  createPacket,
  createTestConfig,
  getNmeaSentence,

  setupNavigatorSerialMock,
} from './helpers'

describe('nMEA Machine - Pure State Transitions', () => {
  it('should start in disconnected state', () => {
    const machine = createNmeaMachine(createTestConfig())
    const actor = createActor(machine)

    actor.start()
    const snapshot = actor.getSnapshot()

    expect(snapshot.value).toBe('disconnected')
    expect(snapshot.context.port).toBeNull()
    expect(snapshot.context.error).toBeNull()
  })

  it('should transition to connecting when CONNECT event is sent', () => {
    const machine = createNmeaMachine(createTestConfig())
    const actor = createActor(machine)

    actor.start()
    actor.send({ type: 'CONNECT' })

    const snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('connecting')
  })

  it('should update baud rate in disconnected state', () => {
    const machine = createNmeaMachine(createTestConfig())
    const actor = createActor(machine)

    actor.start()
    actor.send({ type: 'SET_BAUD_RATE', baudRate: 9600 })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.baudRate).toBe(9600)
  })

  it('should update logging state', () => {
    const machine = createNmeaMachine(createTestConfig())
    const actor = createActor(machine)

    actor.start()
    actor.send({ type: 'SET_LOGGING', enabled: true })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.enableLogging).toBe(true)
  })
})

describe('nMEA Machine - With Mocked Actors', () => {
  let mockPort: MockSerialPort

  beforeEach(() => {
    mockPort = setupNavigatorSerialMock()
  })

  afterEach(() => {
    cleanupNavigatorSerialMock()
  })

  it('should transition to connected when port opens successfully', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    // Create a machine with mocked actors
    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()

    // Send CONNECT event
    actor.send({ type: 'CONNECT' })

    // Wait for the connection to complete
    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          expect(state.context.port).toBeTruthy()
          expect(state.context.error).toBeNull()
          subscription.unsubscribe()
          resolve()
        }
      })
    })
  })

  it('should transition to error state when connection fails', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockMachine = machine.provide({
      actors: {
        connectToSerial: createMockConnectToSerialErrorActor('Connection failed'),
      },
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'error') {
          expect(state.context.error).toBe('Connection failed')
          subscription.unsubscribe()
          resolve()
        }
      })
    })
  })

  it('should store packets and update data when SERIAL.DATA event is received', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    // Wait for connected state
    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Send a real NMEA packet (GGA - GPS Fix Data)
    const mockPacket = createPacket(getNmeaSentence('GGA'))

    actor.send({ type: 'SERIAL.DATA', data: mockPacket })

    // Check that packet was stored and data was updated
    const snapshot = actor.getSnapshot()
    expect(snapshot.context.packets.GGA).toBeDefined()
    expect(snapshot.context.data.count).toBe(1)
  })

  it('should filter packets based on allowedSentenceIds', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Send an allowed packet (GGA - GPS Fix Data)
    const allowedPacket = createPacket(getNmeaSentence('GGA'))

    // Send a disallowed packet (GLL - Geographic Position)
    const disallowedPacket = createPacket(getNmeaSentence('GLL'))

    actor.send({ type: 'SERIAL.DATA', data: allowedPacket })
    actor.send({ type: 'SERIAL.DATA', data: disallowedPacket })

    const snapshot = actor.getSnapshot()
    // GGA should be stored (it's in allowedSentenceIds)
    expect(snapshot.context.packets.GGA).toBeDefined()
    // GLL should not be stored (it's not in allowedSentenceIds)
    expect(snapshot.context.packets.GLL).toBeUndefined()
    expect(snapshot.context.data.count).toBe(1)
  })

  it('should handle SERIAL.ERROR events', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    actor.send({ type: 'SERIAL.ERROR', error: 'Parse error' })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.error).toBe('Parse error')
    expect(snapshot.value).toBe('connected') // Should stay connected
  })

  it('should transition to error state on FATAL_ERROR', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Send FATAL_ERROR event
    actor.send({ type: 'FATAL_ERROR', error: 'Port disconnected' })

    // Wait a bit for the state transition
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Check state directly
    const snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('error')
    expect(snapshot.context.error).toBe('Port disconnected')
  })

  it('should disconnect and reset context', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    let streamReaderStopped = false
    const mockActors = createMockActors(mockPort, {
      readNmeaStream: createMockReadNmeaStreamWithStopActor(() => {
        streamReaderStopped = true
      }),
      closePort: createMockClosePortActor(),
    })
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Store a packet first (GGA - GPS Fix Data)
    const mockPacket = createPacket(getNmeaSentence('GGA'))
    actor.send({ type: 'SERIAL.DATA', data: mockPacket })

    // Send disconnect - this sends STOP to streamReader
    actor.send({ type: 'DISCONNECT' })

    // Wait for disconnection
    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'disconnected') {
          expect(streamReaderStopped).toBe(true)
          expect(state.context.port).toBeNull()
          expect(state.context.error).toBeNull()
          expect(state.context.packets).toEqual({})
          expect(state.context.data.count).toBe(0)
          subscription.unsubscribe()
          resolve()
        }
      })
    })
  })
})

describe('nMEA Machine - State Subscription', () => {
  it('should notify subscribers of state changes', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)
    const actor = createActor(machine)

    const stateHistory: string[] = []

    // Subscribe before starting to catch initial state
    const subscription = actor.subscribe((state) => {
      stateHistory.push(state.value as string)
    })

    actor.start()

    // Initial state should be disconnected
    expect(actor.getSnapshot().value).toBe('disconnected')
    expect(stateHistory.length).toBeGreaterThan(0)
    expect(stateHistory[0]).toBe('disconnected')

    actor.send({ type: 'CONNECT' })

    // Give it a moment to process
    await new Promise((resolve) => setTimeout(resolve, 10))

    subscription.unsubscribe()

    expect(stateHistory.length).toBeGreaterThan(1)
    expect(stateHistory).toContain('disconnected')
    expect(stateHistory).toContain('connecting')
  })
})

describe('nMEA Machine - Context Updates', () => {
  let mockPort: MockSerialPort

  beforeEach(() => {
    mockPort = setupNavigatorSerialMock()
  })

  afterEach(() => {
    cleanupNavigatorSerialMock()
  })

  it('should update context when packets are stored', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    // Wait for connected state (SERIAL.DATA events only work in connected state)
    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Create a real GGA packet
    const ggaPacket = createPacket(getNmeaSentence('GGA'))

    // Manually send data event (normally this comes from the stream reader)
    actor.send({ type: 'SERIAL.DATA', data: ggaPacket })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.packets.GGA).toBeDefined()
    expect(snapshot.context.data.count).toBe(1)
  })

  it('should recompute data when adapter is called', async () => {
    const config = createCustomTestConfig(
      (packets) => ({ total: Object.keys(packets).length * 10 }),
      {
        allowedSentenceIds: ['GGA', 'RMC'],
        initialData: { total: 0 },
      },
    )

    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const actor = createActor(mockMachine)
    actor.start()
    actor.send({ type: 'CONNECT' })

    // Wait for connected state
    await new Promise<void>((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Create real packets (GGA and RMC)
    const packet1 = createPacket(getNmeaSentence('GGA'))
    const packet2 = createPacket(getNmeaSentence('RMC'))

    actor.send({ type: 'SERIAL.DATA', data: packet1 })
    expect(actor.getSnapshot().context.data.total).toBe(10)

    actor.send({ type: 'SERIAL.DATA', data: packet2 })
    expect(actor.getSnapshot().context.data.total).toBe(20)
  })
})
