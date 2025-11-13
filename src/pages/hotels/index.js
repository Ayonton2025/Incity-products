import React, { useEffect, useState, useCallback } from 'react';
import { FaSearch } from 'react-icons/fa'; // Import search icon
import { GoogleGenerativeAI } from '@google/generative-ai'; // Ensure this is correctly imported
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API;

const useGoogleMapsApi = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  return isLoaded;
};

function Hotels() {
  const { data: session, status } = useSession();
  const isGoogleMapsLoaded = useGoogleMapsApi();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [searchType, setSearchType] = useState('restaurant'); // Default place type
  const [inputValue, setInputValue] = useState('');
  const [map, setMap] = useState(null);

  const searchParams = useSearchParams(); // Get the query parameters
  const queryParam = searchParams.get('query'); // Get the specific 'query' parameter

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

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
  }

  const initMap = useCallback(() => {
    if (!isGoogleMapsLoaded || !currentLocation) return;

    const { Map, AdvancedMarkerElement } = google.maps;

    const center = new google.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );

    const mapInstance = new Map(document.getElementById("map"), {
      center: center,
      zoom: 11,
      mapId: "DEMO_MAP_ID",
    });

    setMap(mapInstance);

    nearbySearch(mapInstance, searchType);
  }, [isGoogleMapsLoaded, currentLocation, searchType]);

  const nearbySearch = async (mapInstance, type) => {
    const { Place, SearchNearbyRankPreference } = google.maps;
    const { LatLngBounds } = google.maps;

    const center = new google.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );
    const request = {
      fields: ['name', 'geometry', 'vicinity'],
      location: center,
      radius: 50000,
      type: [type],
    };

    const service = new google.maps.places.PlacesService(mapInstance);

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        setPlaces(results);

        const bounds = new LatLngBounds();
        results.forEach((place) => {
          new google.maps.Marker({
            map: mapInstance,
            position: place.geometry.location,
            title: place.name,
          });
          bounds.extend(place.geometry.location);
        });
        mapInstance.fitBounds(bounds);
      } else {
        console.error('Error fetching places:', status);
      }
    });
  };

  const processSearchType = async (query) => {
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Stringify the typeref object for use in the prompt
    const typerefString = JSON.stringify(typeref);

    const prompt = `Here are the categories and keys, with reference to the input received give back the closest key to the input. Just return the key and nothing else. For example, if I input "books", return "book_store" which is a key.:\n${typerefString}\nAnd the input text is "${query}".`;

    try {
      const result = await model.generateContent(prompt);
      const geminiResponseText = await result.response.text();
      const closestKey = geminiResponseText.trim(); // Trim any unnecessary whitespace
      setSearchType(closestKey);
    } catch (error) {
      console.error('Error processing Gemini AI response:', error);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setInputValue(queryParam); // Set input value from query
      processSearchType(queryParam); // Process search type based on query
    }
  }, [queryParam]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  const handleSearch = async (event) => {
    event.preventDefault();
    processSearchType(inputValue); // Process search type based on manual input
  };

  return (
    <div className="p-4">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Logout
      </button>

      <h1 className="text-2xl font-bold mb-4">Current Location</h1>
      {currentLocation ? (
        <div className="mb-4">
          <p className="text-lg"><strong>Latitude:</strong> {currentLocation.lat}</p>
          <p className="text-lg"><strong>Longitude:</strong> {currentLocation.lng}</p>
        </div>
      ) : (
        <p>Fetching location...</p>
      )}

      <form onSubmit={handleSearch} className="text-black flex items-center mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search for places"
          className="p-2 border border-gray-300 rounded-l-md flex-1"
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-r-md"
        >
          <FaSearch />
        </button>
      </form>

      <div id="map" className="w-full h-80 mb-4"></div>

      <h2 className="text-xl font-semibold text-black mb-2">Nearby Places</h2>
      {places.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {places.map((place) => (
            <div key={place.place_id} className="card p-4 bg-white border border-gray-200 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-black">{place.name}</h2>
              <p className="text-black">{place.vicinity}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No nearby places found.</p>
      )}
    </div>
  );
}

export default Hotels;