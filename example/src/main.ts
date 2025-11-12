import type { NavigationData, NmeaMachineActor, StoredPackets } from 'nmea-web-serial'
import { createNavigationNmeaMachine } from 'nmea-web-serial'
import { createActor } from 'xstate'

// Create the machine
const machine = createNavigationNmeaMachine()

// Create the actor
const actor = createActor(machine) as NmeaMachineActor<NavigationData, StoredPackets>

// Start the actor
actor.start()

// Subscribe to state changes
actor.subscribe((state) => {
  updateUI(state)
})

// Make functions available globally
declare global {
  interface Window {
    handleConnect: () => void
    handleDisconnect: () => void
    handleBaudRateChange: () => void
  }
}

window.handleConnect = () => {
  actor.send({ type: 'CONNECT' })
}

window.handleDisconnect = () => {
  actor.send({ type: 'DISCONNECT' })
}

window.handleBaudRateChange = () => {
  const baudRateInput = document.getElementById('baudRateInput') as HTMLInputElement | null
  if (!baudRateInput) {
    return
  }
  const baudRate = Number.parseInt(baudRateInput.value, 10)
  if (!Number.isNaN(baudRate) && baudRate > 0) {
    actor.send({ type: 'SET_BAUD_RATE', baudRate })
  }
}

function updateUI(state: ReturnType<typeof actor.getSnapshot>) {
  const stateValue = String(state.value)
  const stateValueEl = document.getElementById('stateValue')
  if (!stateValueEl) {
    return
  }
  stateValueEl.textContent = stateValue

  // Update button states
  const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement | null
  const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement | null

  if (!connectBtn || !disconnectBtn) {
    return
  }

  const isConnecting = stateValue === 'connecting'
  const isConnected = stateValue === 'connected'

  connectBtn.disabled = isConnecting || isConnected
  connectBtn.textContent = isConnecting ? 'Connecting...' : 'Connect'
  disconnectBtn.disabled = !isConnected

  // Update baud rate input
  const baudRateInput = document.getElementById('baudRateInput') as HTMLInputElement | null
  if (baudRateInput) {
    baudRateInput.disabled = isConnecting || isConnected
    baudRateInput.value = String(state.context.baudRate)
  }

  // Update error display
  const errorDisplay = document.getElementById('errorDisplay')
  if (errorDisplay) {
    if (state.context.error) {
      errorDisplay.textContent = `Error: ${state.context.error}`
      errorDisplay.style.display = 'block'
    } else {
      errorDisplay.style.display = 'none'
    }
  }

  // Update navigation data
  const data = state.context.data

  // Time
  const timeEl = document.getElementById('timeData')
  if (timeEl) {
    if (data.time) {
      let html = `<div>UTC: ${data.time.utc.toISOString()}</div>`
      if (data.time.local) {
        html += `<div>Local: ${data.time.local.toISOString()}</div>`
      } else {
        html += `<div class="meta">Local time not available</div>`
      }
      html += `<div class="meta">Source: ${data.time.source}</div>`
      timeEl.innerHTML = html
      timeEl.className = ''
    } else {
      timeEl.textContent = 'No time data'
      timeEl.className = 'no-data'
    }
  }

  // Position
  const positionEl = document.getElementById('positionData')
  if (positionEl) {
    if (data.position) {
      let html = `<div>Lat: ${data.position.latitude.toFixed(6)}°</div>`
      html += `<div>Lon: ${data.position.longitude.toFixed(6)}°</div>`
      if (data.position.altitudeMeters !== undefined) {
        html += `<div>Altitude: ${data.position.altitudeMeters.toFixed(2)} m</div>`
      }
      if (data.position.fixType) {
        html += `<div class="meta">Fix: ${data.position.fixType}</div>`
      }
      if (data.position.status) {
        html += `<div class="meta">Status: ${data.position.status}</div>`
      }
      if (data.position.satellitesInView !== undefined) {
        html += `<div class="meta">Satellites: ${data.position.satellitesInView}</div>`
      }
      if (data.position.horizontalDilution !== undefined) {
        html += `<div class="meta">HDOP: ${data.position.horizontalDilution.toFixed(2)}</div>`
      }
      html += `<div class="meta">Source: ${data.position.source}</div>`
      positionEl.innerHTML = html
      positionEl.className = ''
    } else {
      positionEl.textContent = 'No position data'
      positionEl.className = 'no-data'
    }
  }

  // Speed
  const speedEl = document.getElementById('speedData')
  if (speedEl) {
    if (data.speed) {
      let html = `<div>${data.speed.knots.toFixed(2)} knots</div>`
      html += `<div class="meta">Source: ${data.speed.source}</div>`
      speedEl.innerHTML = html
      speedEl.className = ''
    } else {
      speedEl.textContent = 'No speed data'
      speedEl.className = 'no-data'
    }
  }

  // Heading
  const headingEl = document.getElementById('headingData')
  if (headingEl) {
    if (data.heading) {
      let html = `<div>${data.heading.degreesTrue.toFixed(1)}°</div>`
      html += `<div class="meta">Source: ${data.heading.source}`
      if (data.heading.isDerived) {
        html += ` <span class="derived">(COG-derived)</span>`
      }
      html += `</div>`
      headingEl.innerHTML = html
      headingEl.className = ''
    } else {
      headingEl.textContent = 'No heading data'
      headingEl.className = 'no-data'
    }
  }

  // Depth
  const depthEl = document.getElementById('depthData')
  if (depthEl) {
    if (data.depth) {
      let html = `<div>${data.depth.meters.toFixed(2)} m</div>`
      html += `<div class="meta">Source: ${data.depth.source}</div>`
      depthEl.innerHTML = html
      depthEl.className = ''
    } else {
      depthEl.textContent = 'No depth data'
      depthEl.className = 'no-data'
    }
  }
}

// Initial UI update
updateUI(actor.getSnapshot())
