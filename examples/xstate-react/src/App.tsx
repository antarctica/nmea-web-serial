import type { ChangeEvent } from 'react'
import { useMachine } from '@xstate/react'
import L from 'leaflet'
import { createNavigationNmeaMachine } from 'nmea-web-serial'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
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

// Component to update map view when position changes
function MapUpdater({ lat, lon }: { lat: number, lon: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lon], map.getZoom() > 10 ? map.getZoom() : 10)
  }, [lat, lon, map])

  return null
}

function App() {
  // Create the machine once using useMemo
  const machine = useMemo(() => createNavigationNmeaMachine(), [])
  // useMachine automatically starts and manages the machine lifecycle
  const [snapshot, send] = useMachine(machine)

  const stateValue = snapshot.value
  const isConnecting = stateValue === 'connecting'
  const isConnected = stateValue === 'connected'
  const data = snapshot.context.data

  const handleConnect = () => {
    send({ type: 'CONNECT' })
  }

  const handleDisconnect = () => {
    send({ type: 'DISCONNECT' })
  }

  const handleBaudRateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const baudRate = Number.parseInt(event.target.value, 10)
    if (!Number.isNaN(baudRate) && baudRate > 0) {
      send({ type: 'SET_BAUD_RATE', baudRate })
    }
  }

  return (
    <div className="container">
      <h1>NMEA Serial Port Test</h1>

      <div className="button-group">
        <div className="baud-rate-group">
          <label htmlFor="baudRateInput">Baud Rate:</label>
          <input
            type="number"
            id="baudRateInput"
            value={snapshot.context.baudRate}
            min={300}
            max={115200}
            step={300}
            onChange={handleBaudRateChange}
            disabled={isConnecting || isConnected}
          />
        </div>

        <button id="connectBtn" onClick={handleConnect} disabled={isConnecting || isConnected}>
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>

        <button id="disconnectBtn" onClick={handleDisconnect} disabled={!isConnected}>
          Disconnect
        </button>
      </div>

      <div className="status-panel">
        <h2>Status</h2>
        <p>
          <strong>State:</strong>
          {' '}
          <span id="stateValue">{stateValue}</span>
        </p>
        {snapshot.context.error && (
          <p id="errorDisplay" className="error">
            Error:
            {' '}
            {snapshot.context.error}
          </p>
        )}

        <div className="navigation-section">
          <h3>Navigation Data</h3>
          <div className="data-grid">
            <div className="data-item">
              <strong>Time</strong>
              {data.time
                ? (
                    <div>
                      <div>
                        UTC:
                        {data.time.utc.toISOString()}
                      </div>
                      {data.time.local
                        ? (
                            <div>
                              Local:
                              {data.time.local.toISOString()}
                            </div>
                          )
                        : (
                            <div className="meta">Local time not available</div>
                          )}
                      <div className="meta">
                        Source:
                        {data.time.source}
                      </div>
                    </div>
                  )
                : (
                    <div className="no-data">No time data</div>
                  )}
            </div>

            <div className="data-item">
              <strong>Position</strong>
              {data.position
                ? (
                    <div>
                      <div>
                        Lat:
                        {data.position.latitude.toFixed(6)}
                        °
                      </div>
                      <div>
                        Lon:
                        {data.position.longitude.toFixed(6)}
                        °
                      </div>
                      {data.position.altitudeMeters !== undefined && (
                        <div>
                          Altitude:
                          {data.position.altitudeMeters.toFixed(2)}
                          {' '}
                          m
                        </div>
                      )}
                      {data.position.fixType && (
                        <div className="meta">
                          Fix:
                          {data.position.fixType}
                        </div>
                      )}
                      {data.position.status && (
                        <div className="meta">
                          Status:
                          {data.position.status}
                        </div>
                      )}
                      {data.position.satellitesInView !== undefined && (
                        <div className="meta">
                          Satellites:
                          {data.position.satellitesInView}
                        </div>
                      )}
                      {data.position.horizontalDilution !== undefined && (
                        <div className="meta">
                          HDOP:
                          {data.position.horizontalDilution.toFixed(2)}
                        </div>
                      )}
                      <div className="meta">
                        Source:
                        {data.position.source}
                      </div>
                    </div>
                  )
                : (
                    <div className="no-data">No position data</div>
                  )}
            </div>

            <div className="data-item">
              <strong>Speed</strong>
              {data.speed
                ? (
                    <div>
                      <div>
                        {data.speed.knots.toFixed(2)}
                        {' '}
                        knots
                      </div>
                      <div className="meta">
                        Source:
                        {data.speed.source}
                      </div>
                    </div>
                  )
                : (
                    <div className="no-data">No speed data</div>
                  )}
            </div>

            <div className="data-item">
              <strong>Heading</strong>
              {data.heading
                ? (
                    <div>
                      <div>
                        {data.heading.degreesTrue.toFixed(1)}
                        °
                      </div>
                      <div className="meta">
                        Source:
                        {' '}
                        {data.heading.source}
                        {data.heading.isDerived && <span className="derived"> (COG-derived)</span>}
                      </div>
                    </div>
                  )
                : (
                    <div className="no-data">No heading data</div>
                  )}
            </div>

            <div className="data-item">
              <strong>Depth</strong>
              {data.depth
                ? (
                    <div>
                      <div>
                        {data.depth.meters.toFixed(2)}
                        {' '}
                        m
                      </div>
                      <div className="meta">
                        Source:
                        {data.depth.source}
                      </div>
                    </div>
                  )
                : (
                    <div className="no-data">No depth data</div>
                  )}
            </div>
          </div>

          <h3 className="map-section">Map</h3>
          <div className="map-container">
            {data.position
              ? (
                  <MapContainer
                    center={[data.position.latitude, data.position.longitude]}
                    zoom={10}
                    className="map-container-inner"
                  >
                    <TileLayer
                      attribution="© OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[data.position.latitude, data.position.longitude]} />
                    <MapUpdater lat={data.position.latitude} lon={data.position.longitude} />
                  </MapContainer>
                )
              : (
                  <div className="map-no-data">
                    No position data available
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
