// src/utils/osm.js

/**
 * Geocode an address using Nominatim (OSM)
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    return {
      address: data.display_name,
      details: data.address
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Search for places around a location
 */
export const searchNearbyPlaces = async (lat, lng, amenity, radius = 5000) => {
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="${amenity}"](around:${radius},${lat},${lng});
      way["amenity"="${amenity}"](around:${radius},${lat},${lng});
      relation["amenity"="${amenity}"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    
    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('OSM search error:', error);
    return [];
  }
};

/**
 * Calculate route using OSRM
 */
export const calculateRoute = async (startLat, startLng, endLat, endLng, profile = 'driving') => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
};