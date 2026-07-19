// Kaaba (Masjid al-Haram), Mecca — WGS84.
export const KAABA = { latitude: 21.4225, longitude: 39.8262 };

/** Degrees within which the phone is considered facing the Qibla. */
export const ALIGNMENT_TOLERANCE_DEG = 4;

/** iOS heading accuracy (degrees); higher = worse. Above this → show calibration tip. */
export const LOW_ACCURACY_THRESHOLD_DEG = 25;

/** |z| / magnitude must exceed this for the phone to count as “flat enough”. */
export const FLATNESS_RATIO = 0.85;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}

/** Normalize any angle to 0–360. */
export function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

/** Great-circle initial bearing from user to the Kaaba, 0–360° clockwise from north. */
export function calculateQiblaBearing(userLat, userLng) {
  const φ1 = toRadians(userLat);
  const φ2 = toRadians(KAABA.latitude);
  const Δλ = toRadians(KAABA.longitude - userLng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeAngle(toDegrees(Math.atan2(y, x)));
}

/** @deprecated Use calculateQiblaBearing — kept for any lingering imports. */
export const qiblaBearingDegrees = calculateQiblaBearing;

/**
 * Shortest signed offset from device heading to Qibla bearing (−180…180).
 * Used for alignment checks; the on-screen readout still shows absolute bearing.
 */
export function getOffset(qiblaBearing, deviceHeading) {
  return shortestAngleDelta(deviceHeading, qiblaBearing);
}

/**
 * Device heading from magnetometer (phone flat, portrait).
 * Expo Magnetometer: +x right, +y top of device, +z out of screen.
 */
export function magnetometerToHeading(x, y) {
  return normalizeAngle(toDegrees(Math.atan2(-x, y)));
}

/** How far to rotate the Qibla needle so “up” on screen is the Qibla. */
export function qiblaNeedleRotation(qiblaBearing, deviceHeading) {
  return normalizeAngle(qiblaBearing - deviceHeading);
}

/** Shortest angular distance between two headings (−180…180). */
export function shortestAngleDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

export function isAligned(qiblaBearing, deviceHeading, tolerance = ALIGNMENT_TOLERANCE_DEG) {
  return Math.abs(getOffset(qiblaBearing, deviceHeading)) <= tolerance;
}

/** True when the device is held roughly flat (screen facing up or down). */
export function isPhoneFlat(ax, ay, az, ratio = FLATNESS_RATIO) {
  const mag = Math.sqrt(ax * ax + ay * ay + az * az);
  if (mag < 1e-6) return false;
  return Math.abs(az) / mag >= ratio;
}
