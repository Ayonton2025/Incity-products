// src/pages/places/index.js
import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FaSearch, FaMapMarkerAlt, FaHotel, FaUtensils, FaClinicMedical, FaShoppingCart } from 'react-icons/fa';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';
import { useSession, signOut } from 'next-auth/react';

// Dynamically import the map components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Create a complete map component with controller included
const MapWithController = dynamic(
  () => {
    return import('react-leaflet').then((mod) => {
      const { MapContainer, TileLayer, Marker, Popup, useMap } = mod;
      
      // Define MapController inside the dynamic import where useMap is available
      const MapController = ({ center }) => {
        const map = useMap();
        useEffect(() => {
          if (map && center) {
            map.setView(center, map.getZoom());
          }
        }, [center, map]);
        return null;
      };
      
      // Return the actual map component
      return function MapWithControllerComponent({ 
        center, 
        places, 
        currentLocation, 
        getIconForType 
      }) {
        return (
          <MapContainer 
            center={center} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={center} />
            
            {/* Current Location Marker */}
            <Marker position={center} icon={getIconForType('default')}>
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                  <br />
                  {center[0].toFixed(4)}, {center[1].toFixed(4)}
                </div>
              </Popup>
            </Marker>

            {/* Place Markers */}
            {places.map((place) => (
              <Marker 
                key={place.id} 
                position={[place.lat, place.lon]} 
                icon={getIconForType(place.type)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-lg mb-1">{place.name}</h3>
                    <p className="text-sm text-gray-600 capitalize mb-2">{place.type}</p>
                    {place.cuisine && (
                      <p className="text-xs text-gray-500 mb-1">Cuisine: {place.cuisine}</p>
                    )}
                    {place.address && (
                      <p className="text-xs text-gray-500 mb-2">{place.address}</p>
                    )}
                    <a
                      href={`https://www.openstreetmap.org/directions?engine=graphhopper_foot&route=${center[0]}%2C${center[1]}%3B${place.lat}%2C${place.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      Get Directions
                      <svg 
                        className="w-4 h-4" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        );
      };
    });
  },
  { ssr: false }
);

function Places() {
  const { data: session, status } = useSession();
  const [currentLocation, setCurrentLocation] = useState([13.0827, 80.2707]); // Default: Chennai
  const [places, setPlaces] = useState([]);
  const [searchType, setSearchType] = useState('restaurant');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('query');

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  // Your existing typeref object (preserved)
  const typeref = {
    "categories": {
      "Automotive": [
        "car_dealer",
        "car_rental",
        "car_repair",
        "car_wash",
        "electric_vehicle_charging_station",
        "gas_station",
        "parking",
        "rest_stop"
      ],
      "Business": [
        "farm"
      ],
      "Culture": [
        "art_gallery",
        "museum",
        "performing_arts_theater"
      ],
      "Education": [
        "library",
        "preschool",
        "primary_school",
        "secondary_school",
        "university"
      ],
      "Entertainment and Recreation": [
        "amusement_center",
        "amusement_park",
        "aquarium",
        "banquet_hall",
        "bowling_alley",
        "casino",
        "community_center",
        "convention_center",
        "cultural_center",
        "dog_park",
        "event_venue",
        "hiking_area",
        "historical_landmark",
        "marina",
        "movie_rental",
        "movie_theater",
        "national_park",
        "night_club",
        "park",
        "tourist_attraction",
        "visitor_center",
        "wedding_venue",
        "zoo"
      ],
      "Finance": [
        "accounting",
        "atm",
        "bank"
      ],
      "Food and Drink": [
        "american_restaurant",
        "bakery",
        "bar",
        "barbecue_restaurant",
        "brazilian_restaurant",
        "breakfast_restaurant",
        "brunch_restaurant",
        "cafe",
        "chinese_restaurant",
        "coffee_shop",
        "fast_food_restaurant",
        "french_restaurant",
        "greek_restaurant",
        "hamburger_restaurant",
        "ice_cream_shop",
        "indian_restaurant",
        "indonesian_restaurant",
        "italian_restaurant",
        "japanese_restaurant",
        "korean_restaurant",
        "lebanese_restaurant",
        "meal_delivery",
        "meal_takeaway",
        "mediterranean_restaurant",
        "mexican_restaurant",
        "middle_eastern_restaurant",
        "pizza_restaurant",
        "ramen_restaurant",
        "restaurant",
        "sandwich_shop",
        "seafood_restaurant",
        "spanish_restaurant",
        "steak_house",
        "sushi_restaurant",
        "thai_restaurant",
        "turkish_restaurant",
        "vegan_restaurant",
        "vegetarian_restaurant",
        "vietnamese_restaurant"
      ],
      "Geographical Areas": [
        "administrative_area_level_1",
        "administrative_area_level_2",
        "country",
        "locality",
        "postal_code",
        "school_district"
      ],
      "Government": [
        "city_hall",
        "courthouse",
        "embassy",
        "fire_station",
        "local_government_office",
        "police",
        "post_office"
      ],
      "Health and Wellness": [
        "dental_clinic",
        "dentist",
        "doctor",
        "drugstore",
        "hospital",
        "medical_lab",
        "pharmacy",
        "physiotherapist",
        "spa"
      ],
      "Lodging": [
        "bed_and_breakfast",
        "campground",
        "camping_cabin",
        "cottage",
        "extended_stay_hotel",
        "farmstay",
        "guest_house",
        "hostel",
        "hotel",
        "lodging",
        "motel",
        "private_guest_room",
        "resort_hotel",
        "rv_park"
      ],
      "Places of Worship": [
        "church",
        "hindu_temple",
        "mosque",
        "synagogue"
      ],
      "Services": [
        "barber_shop",
        "beauty_salon",
        "cemetery",
        "child_care_agency",
        "consultant",
        "courier_service",
        "electrician",
        "florist",
        "funeral_home",
        "hair_care",
        "hair_salon",
        "insurance_agency",
        "laundry",
        "lawyer",
        "locksmith",
        "moving_company",
        "painter",
        "plumber",
        "real_estate_agency",
        "roofing_contractor",
        "storage",
        "tailor",
        "telecommunications_service_provider",
        "travel_agency",
        "veterinary_care"
      ],
      "Shopping": [
        "auto_parts_store",
        "bicycle_store",
        "book_store",
        "cell_phone_store",
        "clothing_store",
        "convenience_store",
        "department_store",
        "discount_store",
        "electronics_store",
        "furniture_store",
        "gift_shop",
        "grocery_store",
        "hardware_store",
        "home_goods_store",
        "home_improvement_store",
        "jewelry_store",
        "liquor_store",
        "market",
        "pet_store",
        "shoe_store",
        "shopping_mall",
        "sporting_goods_store",
        "store",
        "supermarket",
        "wholesaler"
      ],
      "Sports": [
        "athletic_field",
        "fitness_center",
        "golf_course",
        "gym",
        "playground",
        "ski_resort",
        "sports_club",
        "sports_complex",
        "stadium",
        "swimming_pool"
      ],
      "Transportation": [
        "airport",
        "bus_station",
        "bus_stop",
        "ferry_terminal",
        "heliport",
        "light_rail_station",
        "park_and_ride",
        "subway_station",
        "taxi_stand",
        "train_station",
        "transit_depot",
        "transit_station",
        "truck_stop"
      ],
      "Table B": {
        "Additional Place type values": [
          "administrative_area_level_3",
          "administrative_area_level_4",
          "administrative_area_level_5",
          "administrative_area_level_6",
          "administrative_area_level_7",
          "archipelago",
          "colloquial_area",
          "continent",
          "establishment",
          "finance",
          "floor",
          "food",
          "general_contractor",
          "geocode",
          "health",
          "intersection",
          "landmark",
          "natural_feature",
          "neighborhood",
          "place_of_worship",
          "plus_code",
          "point_of_interest",
          "political",
          "post_box",
          "postal_code_prefix",
          "postal_code_suffix",
          "postal_town",
          "premise",
          "room",
          "route",
          "street_address",
          "street_number",
          "sublocality",
          "sublocality_level_1",
          "sublocality_level_2",
          "sublocality_level_3",
          "sublocality_level_4",
          "sublocality_level_5",
          "subpremise",
          "town_square"
        ]
      }
    }
  };

  // Quick search buttons for common place types
  const quickSearches = [
    { type: 'restaurant', label: 'Restaurants', icon: FaUtensils },
    { type: 'hotel', label: 'Hotels', icon: FaHotel },
    { type: 'hospital', label: 'Hospitals', icon: FaClinicMedical },
    { type: 'supermarket', label: 'Supermarkets', icon: FaShoppingCart },
  ];

  // Get user location - only on client side
  useEffect(() => {
    if (isClient && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default Chennai location
        },
        { enableHighAccuracy: true }
      );
    }
  }, [isClient]);

  // Process search type using Gemini AI (your existing logic preserved)
  const processSearchType = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Stringify the typeref object for use in the prompt
      const typerefString = JSON.stringify(typeref);

      const prompt = `Here are the categories and keys, with reference to the input received give back the closest key to the input. Just return the key and nothing else. For example, if I input "books", return "book_store" which is a key.:\n${typerefString}\nAnd the input text is "${query}".`;

      const result = await model.generateContent(prompt);
      const geminiResponseText = await result.response.text();
      const closestKey = geminiResponseText.trim();
      
      setSearchType(closestKey);
      await searchOSMPlaces(closestKey);
    } catch (error) {
      console.error('Error processing Gemini AI response:', error);
      // Fallback search
      await searchOSMPlaces('restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  // Search OSM via Overpass API
  const searchOSMPlaces = async (osmTag) => {
    if (!currentLocation) return;
    
    const [lat, lng] = currentLocation;
    const radius = 5000; // 5km radius
    
    // Convert Google Places types to OSM amenity tags
    const tagMapping = {
      'restaurant': 'restaurant',
      'hotel': 'hotel',
      'hospital': 'hospital',
      'supermarket': 'supermarket',
      'pharmacy': 'pharmacy',
      'cafe': 'cafe',
      'bank': 'bank',
      'school': 'school',
      'university': 'university',
      // Add more mappings as needed
    };
    
    const osmTagToUse = tagMapping[osmTag] || osmTag;

    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="${osmTagToUse}"](around:${radius},${lat},${lng});
        way["amenity"="${osmTagToUse}"](around:${radius},${lat},${lng});
        relation["amenity"="${osmTagToUse}"](around:${radius},${lat},${lng});
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
      const processedPlaces = processOSMData(data.elements || []);
      setPlaces(processedPlaces);
    } catch (err) {
      console.error("Overpass API error:", err);
      setPlaces([]);
    }
  };

  // Process OSM data to extract useful information
  const processOSMData = (elements) => {
    return elements
      .filter(element => element.tags && element.tags.name)
      .map(element => {
        let lat, lon;
        
        if (element.type === 'node') {
          lat = element.lat;
          lon = element.lon;
        } else if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        } else {
          return null;
        }

        return {
          id: element.id,
          name: element.tags.name,
          type: element.tags.amenity,
          lat: lat,
          lon: lon,
          address: element.tags['addr:street'] || '',
          phone: element.tags.phone || '',
          website: element.tags.website || '',
          cuisine: element.tags.cuisine || '',
          place_id: element.id.toString() // For compatibility with your existing code
        };
      })
      .filter(Boolean)
      .slice(0, 20); // Limit to 20 results
  };

  // Custom icons for different place types - only create on client side
  const getIconForType = (type) => {
    if (!isClient) return null;

    const L = require('leaflet');
    
    // Fix for default markers in react-leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const iconColors = {
      restaurant: 'red',
      cafe: 'orange',
      hotel: 'blue',
      hospital: 'green',
      pharmacy: 'lightgreen',
      supermarket: 'yellow',
      default: 'gray'
    };
    
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColors[type] || iconColors.default}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  useEffect(() => {
    if (queryParam) {
      setInputValue(queryParam);
      processSearchType(queryParam);
    }
  }, [queryParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    processSearchType(inputValue);
  };

  const handleQuickSearch = (type) => {
    setSearchType(type);
    searchOSMPlaces(type);
  };

  // Don't render map until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Logout
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <FaHotel className="text-blue-600" />
            Places
          </h1>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Location and Search Section */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <FaMapMarkerAlt className="text-blue-500" />
                Current Location
              </h2>
              {currentLocation ? (
                <div className="space-y-1">
                  <p className="text-gray-600">
                    <span className="font-medium">Latitude:</span> {currentLocation[0].toFixed(6)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Longitude:</span> {currentLocation[1].toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              )}
            </div>

            {/* Search Form */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Search hotels, restaurants, attractions..."
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader className="w-5 h-5" /> : <FaSearch className="text-lg" />}
                    </button>
                  </div>
                </div>
                
                {/* Quick Search Buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleQuickSearch(type)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Icon className="text-blue-500" />
                      {label}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          </section>

          {/* Map Section */}
          <section className="mb-8">
            <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-white shadow-md">
              <MapWithController 
                center={currentLocation}
                places={places}
                currentLocation={currentLocation}
                getIconForType={getIconForType}
              />
            </div>
          </section>

          {/* Results Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              Nearby {searchType.replace(/_/g, ' ')}
              {isLoading && <Loader className="w-5 h-5" />}
            </h2>

            {places.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {places.map((place) => (
                  <div 
                    key={place.id} 
                    className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {place.name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize mb-2">
                        {place.type}
                      </p>
                      {place.cuisine && (
                        <p className="text-xs text-gray-500 mb-2">
                          Cuisine: {place.cuisine}
                        </p>
                      )}
                      {place.address && (
                        <p className="text-xs text-gray-500 mb-3">
                          {place.address}
                        </p>
                      )}
                      <a
                        href={`https://www.openstreetmap.org/directions?engine=graphhopper_foot&route=${currentLocation[0]}%2C${currentLocation[1]}%3B${place.lat}%2C${place.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        Get Directions
                        <svg 
                          className="w-4 h-4" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? 'Searching for places...' : 
                 currentLocation ? 'No results found in this area' : 'Getting your location...'}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Places;