import type { NavigationData } from 'nmea-web-serial'
import L from 'leaflet'
import { createNavigationNmeaClient } from 'nmea-web-serial'
import 'leaflet/dist/leaflet.css'
import './index.css'

// Get DOM elements
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement | null
const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement | null
const baudRateInput = document.getElementById('baudRateInput') as HTMLInputElement | null
const stateValueEl = document.getElementById('stateValue')
const errorDisplay = document.getElementById('errorDisplay')

// Initialize map
let map: L.Map | null = null
let marker: L.Marker | null = null

function initializeMap() {
  const mapEl = document.getElementById('map')
  if (!mapEl || map) {
    return
  }

  map = L.map(mapEl).setView([0, 0], 2)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  // Create a default marker icon (fix for webpack/vite)
  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  L.Marker.prototype.options.icon = defaultIcon
}

function updateMapPosition(lat: number, lon: number) {
  if (!map) {
    initializeMap()
  }

  if (!map) {
    return
  }

  if (!marker) {
    marker = L.marker([lat, lon]).addTo(map)
  } else {
    marker.setLatLng([lat, lon])
  }

  map.setView([lat, lon], map.getZoom() > 10 ? map.getZoom() : 10)
}

// Create the client with callbacks
const client = createNavigationNmeaClient({
  onData: (data: NavigationData) => {
    updateNavigationData(data)
  },
  onStateChange: (isConnected: boolean) => {
    updateConnectionState(isConnected)
  },
  onError: (error: string) => {
    updateError(error)
  },
  baudRate: 4800,
})

// Update connection state UI
function updateConnectionState(isConnected: boolean) {
  if (!stateValueEl) {
    return
  }

  const isConnecting = client.isConnecting
  const stateValue = isConnecting ? 'connecting' : (isConnected ? 'connected' : 'disconnected')
  stateValueEl.textContent = stateValue

  // Update button states
  if (connectBtn && disconnectBtn) {
    connectBtn.disabled = isConnecting || isConnected
    connectBtn.textContent = isConnecting ? 'Connecting...' : 'Connect'
    disconnectBtn.disabled = !isConnected
  }

  // Update baud rate input
  if (baudRateInput) {
    baudRateInput.disabled = isConnecting || isConnected
  }
}

// Update error display
function updateError(error: string | null) {
  if (!errorDisplay) {
    return
  }

  if (error) {
    errorDisplay.textContent = `Error: ${error}`
    errorDisplay.style.display = 'block'
  } else {
    errorDisplay.style.display = 'none'
  }
}

// Update navigation data display
function updateNavigationData(data: NavigationData) {
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

      // Update map position
      updateMapPosition(data.position.latitude, data.position.longitude)
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

// Attach event listeners
if (connectBtn) {
  connectBtn.addEventListener('click', () => {
    client.connect()
  })
}

if (disconnectBtn) {
  disconnectBtn.addEventListener('click', () => {
    client.disconnect()
  })
}

if (baudRateInput) {
  baudRateInput.addEventListener('change', () => {
    const baudRate = Number.parseInt(baudRateInput.value, 10)
    if (!Number.isNaN(baudRate) && baudRate > 0) {
      client.setBaudRate(baudRate)
    }
  })
}

// Initialize map on load
initializeMap()

// Initial UI update
updateConnectionState(client.isConnected)
updateError(client.error)
updateNavigationData(client.data)
