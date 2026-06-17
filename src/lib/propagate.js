// Orbit propagation: TLE -> satrec -> sub-satellite lat/lon/altitude.
// Pure functions only (no DOM, no fetch) so they stay testable and reusable.
// satellite.js works in radians; we convert to degrees at the boundary.

import {
  twoline2satrec,
  propagate as sgp4Propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js'

/**
 * Build an SGP4 satellite record from a parsed TLE. Reuse this across many
 * propagations — it's the expensive-to-create object.
 * @param {{ line1: string, line2: string }} tle
 */
export function getSatrec({ line1, line2 }) {
  const satrec = twoline2satrec(line1, line2)
  if (satrec.error) {
    throw new Error(`Invalid TLE — satrec error code ${satrec.error}`)
  }
  return satrec
}

/**
 * Propagate to a given time and return the ground point below the satellite.
 * @param {object} satrec - from getSatrec()
 * @param {Date} [date] - defaults to now
 * @returns {{ latDeg: number, lonDeg: number, altKm: number, speedKmS: number | null }}
 */
export function propagate(satrec, date = new Date()) {
  const { position, velocity } = sgp4Propagate(satrec, date)
  if (!position) {
    throw new Error('Propagation failed — satrec may have decayed or the TLE is invalid.')
  }

  const gmst = gstime(date)
  const geo = eciToGeodetic(position, gmst) // radians + km

  return {
    latDeg: degreesLat(geo.latitude),
    lonDeg: degreesLong(geo.longitude),
    altKm: geo.height,
    speedKmS: velocity ? Math.hypot(velocity.x, velocity.y, velocity.z) : null,
  }
}
