import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

interface ParkingSpot {
  lat: number
  lng: number
  savedAt: string
}

interface CurrentLocation {
  lat: number
  lng: number
}

interface Route {
  coordinates: Array<[number, number]>
  distance: number
  duration: number
  instructions: Array<{
    text: string
    distance: number
    duration: number
  }>
}

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

const STORAGE_KEY = 'parkingSpot'

function App() {
  const [parkingSpot, setParkingSpot] = useState<ParkingSpot | null>(null)
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setParkingSpot(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc: CurrentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setCurrentLocation(loc)
        setAccuracy(Math.round(position.coords.accuracy))
        setError(null)

        if (parkingSpot) {
          const dist = calculateDistance(loc.lat, loc.lng, parkingSpot.lat, parkingSpot.lng)
          setDistance(dist)
        }
      },
      (err) => {
        setError(`Location access denied: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [parkingSpot])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleSaveSpot = () => {
    if (!currentLocation) {
      setError('Please wait for location access...')
      return
    }

    const spot: ParkingSpot = {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      savedAt: new Date().toLocaleString()
    }

    setParkingSpot(spot)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spot))
    setError(null)
  }

  const handleClearSpot = () => {
    setParkingSpot(null)
    setDistance(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleNavigateToSpot = () => {
    if (!parkingSpot || !currentLocation) return

    fetchRoute(currentLocation.lat, currentLocation.lng, parkingSpot.lat, parkingSpot.lng)
    setShowDirections(true)
  }

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?steps=true&geometries=geojson&overview=full&annotations=duration,distance`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])

        const instructions: Route['instructions'] = []
        routeData.legs.forEach((leg: any) => {
          leg.steps.forEach((step: any) => {
            if (step.maneuver.instruction) {
              instructions.push({
                text: step.maneuver.instruction,
                distance: Math.round(step.distance),
                duration: Math.round(step.duration)
              })
            }
          })
        })

        setRoute({
          coordinates,
          distance: Math.round(routeData.distance),
          duration: Math.round(routeData.duration),
          instructions
        })
      }
    } catch (err) {
      setError('Failed to fetch route. Try again.')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <div className="header">
        <h1>🚗 Where Did I Park?</h1>
      </div>

      <div className="controls">
        {!parkingSpot ? (
          <button className="btn btn-save" onClick={handleSaveSpot} disabled={!currentLocation}>
            Save My Spot
          </button>
        ) : (
          <div className="spot-info">
            <div className="saved-info">
              <p><strong>Spot Saved!</strong></p>
              <p>Saved at: {parkingSpot.savedAt}</p>
            </div>
            {distance !== null && (
              <div className="distance-info">
                <p className="distance-value">
                  {distance < 0.1 ? '< 0.1 km' : `${distance.toFixed(2)} km`}
                </p>
                <p className="distance-label">away from your spot</p>
              </div>
            )}
            <div className="button-group">
              <button className="btn btn-navigate" onClick={handleNavigateToSpot}>
                🗺️ Get Directions
              </button>
              <button className="btn btn-clear" onClick={handleClearSpot}>
                Clear Spot
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {accuracy !== null && (
        <div className="accuracy-info">
          📍 Accuracy: ±{accuracy}m
        </div>
      )}

      {currentLocation ? (
        <div className="map-container">
          <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={18}
            scrollWheelZoom={true}
            className="map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>📍 Your current location</Popup>
            </Marker>

            {parkingSpot && (
              <>
                <Marker position={[parkingSpot.lat, parkingSpot.lng]}>
                  <Popup>🚗 Parking spot</Popup>
                </Marker>
                <Circle
                  center={[parkingSpot.lat, parkingSpot.lng]}
                  radius={50}
                  color="blue"
                  fill
                  fillColor="blue"
                  fillOpacity={0.2}
                />
              </>
            )}

            {route && showDirections && (
              <Polyline
                positions={route.coordinates}
                color="blue"
                weight={4}
                opacity={0.8}
                dashArray="5, 5"
              />
            )}
          </MapContainer>
        </div>
      ) : (
        <div className="loading">Waiting for location access...</div>
      )}

      {showDirections && route && (
        <div className="directions-panel">
          <div className="directions-header">
            <h3>📍 Route to Your Car</h3>
            <button className="close-btn" onClick={() => setShowDirections(false)}>✕</button>
          </div>
          <div className="route-summary">
            <div className="route-stat">
              <span className="label">Distance</span>
              <span className="value">{(route.distance / 1000).toFixed(1)} km</span>
            </div>
            <div className="route-stat">
              <span className="label">Time</span>
              <span className="value">{Math.round(route.duration / 60)} min</span>
            </div>
          </div>
          <div className="directions-list">
            <h4>Turn-by-Turn:</h4>
            {route.instructions.slice(0, 10).map((instruction, idx) => (
              <div key={idx} className="direction-step">
                <span className="step-number">{idx + 1}</span>
                <span className="step-text">{instruction.text}</span>
                <span className="step-distance">{(instruction.distance / 1000).toFixed(2)} km</span>
              </div>
            ))}
            {route.instructions.length > 10 && (
              <p className="more-steps">+{route.instructions.length - 10} more steps</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
