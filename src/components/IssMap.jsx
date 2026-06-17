import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Full-bleed Leaflet world map with OpenStreetMap tiles.
 * Markers / ground track are layered on in later chunks.
 */
export default function IssMap() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    // Guard against React StrictMode's double-invoke in dev.
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      worldCopyJump: true,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="iss-map"
      role="application"
      aria-label="World map showing the ISS position"
    />
  )
}
