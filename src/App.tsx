import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet'
import L from 'leaflet'
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
        timeout: 5000,
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
            <button className="btn btn-clear" onClick={handleClearSpot}>
              Clear Spot
            </button>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

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
          </MapContainer>
        </div>
      ) : (
        <div className="loading">Waiting for location access...</div>
      )}
    </div>
  )
}

export default App
