// Distance helper functions built with help from Google Gemini
/**
 * Calculates the distance between two lat/long points in kilometers.
 *
 * @param {number} lat1 - Latitude of the first point in degrees.
 * @param {number} lon1 - Longitude of the first point in degrees.
 * @param {number} lat2 - Latitude of the second point in degrees.
 * @param {number} lon2 - Longitude of the second point in degrees.
 * @returns {number} The distance in kilometers.
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Radius of the Earth in kilometers
  const R = 6371;

  // Convert degrees to radians
  const lat1Rad = deg2rad(lat1);
  const lat2Rad = deg2rad(lat2);
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate the distance
  const distance = R * c * 0.621371;
  return distance;
}

/**
 * Helper function to convert degrees to radians.
 * @param {number} deg - The value in degrees.
 * @returns {number} The value in radians.
 */
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export { getDistance };
