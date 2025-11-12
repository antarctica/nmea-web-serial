/**
 * Mock implementation of the Web Serial API SerialPort interface.
 *
 * Provides a controllable mock for testing serial port interactions
 * without requiring actual hardware or browser APIs.
 */

import { vi } from 'vitest'

/**
 * Mock implementation of SerialPort for testing.
 *
 * Provides controllable readable and writable streams that can be
 * manipulated in tests to simulate serial port behavior.
 */
export class MockSerialPort {
  readable: ReadableStream<Uint8Array> | null = null
  writable: WritableStream<Uint8Array> | null = null
  private _closed = false
  private _baudRate: number | null = null
  private _readableController: ReadableStreamDefaultController<Uint8Array> | null = null

  /**
   * Opens the mock serial port with the specified options.
   *
   * @param options - Port configuration options
   * @param options.baudRate - The baud rate for communication
   * @throws {Error} If the port is already closed
   */
  async open(options: { baudRate: number }): Promise<void> {
    if (this._closed) {
      throw new Error('Port is closed')
    }

    this._baudRate = options.baudRate

    // Create a controllable readable stream
    this.readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this._readableController = controller
      },
    })

    // Create a writable stream that can be monitored
    this.writable = new WritableStream({
      write: (_chunk) => {
        // Stream can be monitored in tests if needed
        vi.fn()
      },
    })
  }

  /**
   * Closes the mock serial port and cleans up streams.
   */
  async close(): Promise<void> {
    this._closed = true

    // Close the readable stream if it exists
    if (this._readableController) {
      try {
        this._readableController.close()
      } catch {
        // Ignore errors if already closed
      }
      this._readableController = null
    }

    this.readable = null
    this.writable = null
    this._baudRate = null
  }

  /**
   * Gets the current baud rate.
   */
  get baudRate(): number | null {
    return this._baudRate
  }

  /**
   * Checks if the port is closed.
   */
  get isClosed(): boolean {
    return this._closed
  }

  /**
   * Enqueues data into the readable stream for testing.
   * Useful for simulating incoming serial data.
   *
   * @param data - The data to enqueue
   */
  enqueueData(data: Uint8Array): void {
    if (this._readableController && !this._closed) {
      this._readableController.enqueue(data)
    }
  }

  /**
   * Closes the readable stream (simulates disconnection).
   */
  closeReadable(): void {
    if (this._readableController) {
      this._readableController.close()
      this._readableController = null
    }
  }
}

/**
 * Creates a mock navigator.serial object for testing.
 *
 * @param mockPort - Optional MockSerialPort instance to return from requestPort
 * @returns A mock navigator.serial object
 */
export function createMockNavigatorSerial(mockPort?: MockSerialPort) {
  const port = mockPort ?? new MockSerialPort()

  return {
    requestPort: vi.fn().mockResolvedValue(port),
    getPorts: vi.fn().mockResolvedValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
}

/**
 * Sets up the global navigator.serial mock.
 *
 * @param mockPort - Optional MockSerialPort instance to use
 * @returns The mock port instance
 */
export function setupNavigatorSerialMock(mockPort?: MockSerialPort): MockSerialPort {
  const port = mockPort ?? new MockSerialPort()

  globalThis.navigator = {
    ...globalThis.navigator,
    serial: createMockNavigatorSerial(port),
  } as unknown as Navigator

  return port
}

/**
 * Cleans up the navigator.serial mock.
 */
export function cleanupNavigatorSerialMock(): void {
  if (globalThis.navigator && 'serial' in globalThis.navigator) {
    delete (globalThis.navigator as any).serial
  }
}
