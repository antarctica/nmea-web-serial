/**
 * Tests for the NMEA client wrapper.
 * Tests the high-level API that abstracts XState details.
 */

import type { MockSerialPort } from './helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fromPromise } from 'xstate'
import { NmeaClient } from '../src/core/client'
import { createNmeaMachine } from '../src/core/machine'
import {
  cleanupNavigatorSerialMock,
  createMockActors,
  createMockClosePortActor,
  createMockReadNmeaStreamWithStopActor,
  createPacket,
  createTestConfig,
  getNmeaSentence,

  setupNavigatorSerialMock,
} from './helpers'

describe('nmeaClient', () => {
  let mockPort: MockSerialPort

  beforeEach(() => {
    mockPort = setupNavigatorSerialMock()
  })

  afterEach(() => {
    cleanupNavigatorSerialMock()
  })

  it('should initialize with default values', () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)
    const client = new NmeaClient(machine)

    expect(client.isConnected).toBe(false)
    expect(client.isConnecting).toBe(false)
    expect(client.error).toBeNull()
    expect(client.data.count).toBe(0)

    client.dispose()
  })

  it('should apply initial options', () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)
    const client = new NmeaClient(machine, {
      enableLogging: true,
      baudRate: 9600,
    })

    const snapshot = client.machine.getSnapshot()
    expect(snapshot.context.enableLogging).toBe(true)
    expect(snapshot.context.baudRate).toBe(9600)

    client.dispose()
  })

  it('should call onData callback when data updates', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const dataUpdates: Array<{ count: number }> = []
    const client = new NmeaClient(mockMachine, {
      onData: (data) => {
        dataUpdates.push(data)
      },
    })

    client.connect()

    // Wait for connection
    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Send data event
    const mockPacket = createPacket(getNmeaSentence('GGA'))

    client.machine.send({ type: 'SERIAL.DATA', data: mockPacket })

    // Wait a bit for the callback
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(dataUpdates.length).toBeGreaterThan(0)
    expect(dataUpdates[dataUpdates.length - 1].count).toBe(1)

    client.dispose()
  })

  it('should call onStateChange callback when connection state changes', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort, {
      readNmeaStream: createMockReadNmeaStreamWithStopActor(),
      closePort: createMockClosePortActor(),
    })
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const stateChanges: boolean[] = []
    const client = new NmeaClient(mockMachine, {
      onStateChange: (isConnected) => {
        stateChanges.push(isConnected)
      },
    })

    client.connect()

    // Wait for connection
    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Wait a bit for callbacks
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(stateChanges.length).toBeGreaterThan(0)
    expect(stateChanges[stateChanges.length - 1]).toBe(true)

    client.disconnect()

    // Wait for disconnection
    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'disconnected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(stateChanges[stateChanges.length - 1]).toBe(false)

    client.dispose()
  })

  it('should call onError callback when error occurs', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const errors: string[] = []
    const client = new NmeaClient(mockMachine, {
      onError: (error) => {
        errors.push(error)
      },
    })

    client.connect()

    // Wait for connection
    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    // Send error event
    client.machine.send({ type: 'SERIAL.ERROR', error: 'Test error' })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(errors.length).toBeGreaterThan(0)
    expect(errors[errors.length - 1]).toBe('Test error')

    client.dispose()
  })

  it('should update isConnected property correctly', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort, {
      readNmeaStream: createMockReadNmeaStreamWithStopActor(),
      closePort: createMockClosePortActor(),
    })
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const client = new NmeaClient(mockMachine)

    expect(client.isConnected).toBe(false)

    client.connect()

    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'connected') {
          expect(client.isConnected).toBe(true)
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    client.disconnect()

    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'disconnected') {
          expect(client.isConnected).toBe(false)
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    client.dispose()
  })

  it('should update isConnecting property correctly', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    // Use a delayed connection to test the connecting state
    const delayedConnectActor = fromPromise<SerialPort, { baudRate: number }>(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      await mockPort.open({ baudRate: input.baudRate })
      return mockPort as any
    })

    const mockActors = createMockActors(mockPort, {
      connectToSerial: delayedConnectActor,
    })
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const client = new NmeaClient(mockMachine)

    expect(client.isConnecting).toBe(false)

    client.connect()

    // Should be connecting immediately after sending CONNECT
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(client.isConnecting).toBe(true)

    // Wait for connection
    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'connected') {
          expect(client.isConnecting).toBe(false)
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    client.dispose()
  })

  it('should update data property when packets are received', async () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)

    const mockActors = createMockActors(mockPort)
    const mockMachine = machine.provide({
      actors: mockActors,
    })

    const client = new NmeaClient(mockMachine)

    client.connect()

    await new Promise<void>((resolve) => {
      const subscription = client.machine.subscribe((state) => {
        if (state.value === 'connected') {
          subscription.unsubscribe()
          resolve()
        }
      })
    })

    expect(client.data.count).toBe(0)

    const mockPacket = createPacket(getNmeaSentence('GGA'))

    client.machine.send({ type: 'SERIAL.DATA', data: mockPacket })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(client.data.count).toBe(1)

    client.dispose()
  })

  it('should set logging via setLogging method', () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)
    const client = new NmeaClient(machine)

    client.setLogging(true)
    expect(client.machine.getSnapshot().context.enableLogging).toBe(true)

    client.setLogging(false)
    expect(client.machine.getSnapshot().context.enableLogging).toBe(false)

    client.dispose()
  })

  it('should set baud rate via setBaudRate method', () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)
    const client = new NmeaClient(machine)

    client.setBaudRate(9600)
    expect(client.machine.getSnapshot().context.baudRate).toBe(9600)

    client.setBaudRate(4800)
    expect(client.machine.getSnapshot().context.baudRate).toBe(4800)

    client.dispose()
  })

  it('should clean up resources on dispose', () => {
    const config = createTestConfig()
    const machine = createNmeaMachine(config)
    const client = new NmeaClient(machine)

    const actor = client.machine
    expect(actor.getSnapshot().status).toBe('active')

    client.dispose()

    // After dispose, the actor should be stopped
    expect(actor.getSnapshot().status).toBe('stopped')
  })
})
