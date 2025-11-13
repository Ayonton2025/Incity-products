// src/pages/commute/index.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiRefreshCw, FiMapPin, FiNavigation, FiUser, FiMessageSquare, FiDollarSign, FiCloud, FiAlertTriangle, FiMap } from 'react-icons/fi';
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

function Commute() {
  const { data: session, status } = useSession();
  const [chat, setChat] = useState([{ type: 'bot', text: 'Please enter your destination:' }]);
  const [input, setInput] = useState('');
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLng, setDestinationLng] = useState(null);
  const [transportMode, setTransportMode] = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // ✅ Auth guard
  if (status === "loading") return <div className="p-4 text-white">Loading...</div>;
  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const userId = session.user.id;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  useEffect(() => {
    getCurrentLocation();
    fetchUserContext(); // ✅ Fetch user context on load
  }, []);

  useEffect(() => {
    if (currentLocation && destination && transportMode) {
      getRouteInfo();
    }
  }, [currentLocation, destination, transportMode]);

  // ✅ Fetch user context from MCP
  const fetchUserContext = async () => {
    try {
      const response = await fetch(`/api/mcp/context?userId=${userId}`);
      if (response.ok) {
        const context = await response.json();
        setUserContext(context);
        
        // Add context info to chat if user has financial constraints
        if (context.finance?.totalBalance && context.finance.totalBalance < 5000) {
          setChat(prev => [...prev, { 
            type: 'bot', 
            text: `💰 **Budget Context**: Your current balance is ₹${context.finance.totalBalance}. I'll suggest affordable travel options.` 
          }]);
        }
        
        if (context.health?.activeIllness) {
          setChat(prev => [...prev, { 
            type: 'bot', 
            text: `🏥 **Health Context**: You're recovering from ${context.health.activeIllness}. I'll consider comfortable travel options.` 
          }]);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch user context:", error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setChat((prevChat) => [
            ...prevChat,
            { type: 'bot', text: `📍 Current Location: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` },
          ]);
        },
        (error) => {
          setChat((prevChat) => [...prevChat, { type: 'bot', text: 'Unable to retrieve your location' }]);
        }
      );
    } else {
      setChat((prevChat) => [...prevChat, { type: 'bot', text: 'Geolocation is not supported by this browser.' }]);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSend = async () => {
    if (isLoading) return;

    if (!destination) {
      setIsLoading(true);
      try {
        // Use OpenStreetMap Nominatim for geocoding
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=1`
        );
        
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.length) {
          setChat(prev => [...prev, { type: 'bot', text: 'Location not found. Please try again.' }]);
          setIsLoading(false);
          return;
        }

        const location = geocodeData[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);

        setDestination(input);
        setDestinationLat(lat);
        setDestinationLng(lng);

        // ✅ Check affordability before proceeding
        const estimatedCost = await calculateEstimatedCost(currentLocation, { lat, lng });
        const isAffordable = await checkTripAffordability(estimatedCost);

        setChat((prevChat) => [
          ...prevChat,
          { type: 'user', text: input },
          { type: 'bot', text: `🎯 Destination: ${input}` },
          { type: 'bot', text: `📍 Destination Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})` },
          { 
            type: 'bot', 
            text: isAffordable ? 
              `💰 Estimated cost: ₹${estimatedCost} - This fits your budget!` :
              `⚠️ Estimated cost: ₹${estimatedCost} - This exceeds your recommended travel budget` 
          },
          { 
            type: 'bot', 
            text: 'Choose your mode of transport:', 
            buttons: ['🚌 Public Transport', '🚗 Personal Vehicle', '🚕 Taxi/RideShare', '🚶 Walking', '🚴 Cycling'] 
          },
        ]);
      } catch (error) {
        console.error("Geocoding error:", error);
        setChat((prevChat) => [...prevChat, { type: 'bot', text: 'Error fetching destination coordinates' }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setChat((prevChat) => [...prevChat, { type: 'user', text: input }]);
      setInput('');
    }
  };

  // ✅ Calculate estimated travel cost
  const calculateEstimatedCost = async (origin, destination) => {
    try {
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.lat, destination.lng
      );
      
      // Cost per km estimates for different modes
      const costPerKm = {
        '🚌 Public Transport': 2,
        '🚗 Personal Vehicle': 8,
        '🚕 Taxi/RideShare': 15,
        '🚶 Walking': 0,
        '🚴 Cycling': 0
      };
      
      const defaultMode = '🚌 Public Transport';
      return Math.round(distance * costPerKm[defaultMode]);
    } catch (error) {
      console.warn("Cost calculation failed, using default:", error);
      return 500; // Default fallback
    }
  };

  // ✅ Check if user can afford the trip
  const checkTripAffordability = async (estimatedCost) => {
    if (!userContext?.finance?.totalBalance) return true;
    
    const balance = userContext.finance.totalBalance;
    const maxRecommended = balance * 0.3;
    
    return estimatedCost <= maxRecommended;
  };

  // ✅ Calculate distance between coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const handleButtonClick = async (mode) => {
    if (currentLocation && destinationLat && destinationLng) {
      setIsLoading(true);
      
      try {
        // ✅ Enhanced affordability check with actual cost calculation
        const estimatedCost = await calculateEstimatedCostForMode(currentLocation, { lat: destinationLat, lng: destinationLng }, mode);
        const isAffordable = await checkTripAffordability(estimatedCost);
        
        if (!isAffordable && userContext?.finance?.totalBalance) {
          const balance = userContext.finance.totalBalance;
          setChat(prev => [...prev, {
            type: 'bot',
            text: `🚫 **Budget Alert**: This trip (₹${estimatedCost}) would use ${((estimatedCost / balance) * 100).toFixed(1)}% of your balance (₹${balance}).\n\n💡 Consider:\n• Asking **Finance Bot** to review your budget\n• Looking for closer destinations\n• Using cheaper transport options`
          }]);
          setIsLoading(false);
          return;
        }

        // ✅ Get weather information for destination
        const weatherInfo = await getDestinationWeather(destinationLat, destinationLng);
        
        setChat((prevChat) => [
          ...prevChat,
          { type: 'bot', text: `🚗 Selected: ${mode}` },
          { type: 'bot', text: `💰 Estimated Cost: ₹${estimatedCost}` },
          weatherInfo ? { type: 'bot', text: weatherInfo } : null,
          { type: 'bot', text: `📍 Using coordinates:\nCurrent: (${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)})\nDestination: (${destinationLat.toFixed(4)}, ${destinationLng.toFixed(4)})` },
        ].filter(Boolean));
        
        setTransportMode(mode);
        setShowMap(true);
        
        // ✅ Record travel expense in MCP if trip is confirmed and has cost
        if (isAffordable && estimatedCost > 0) {
          await recordTravelExpense(estimatedCost, mode, destination);
        }

      } catch (error) {
        console.error("Error in handleButtonClick:", error);
        setChat(prev => [...prev, { type: 'bot', text: 'Error processing your request. Please try again.' }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setChat((prevChat) => [...prevChat, { type: 'bot', text: 'Please get your current location and set a valid destination first.' }]);
    }
  };

  // ✅ Calculate cost for specific transport mode
  const calculateEstimatedCostForMode = async (origin, destination, mode) => {
    try {
      const distance = calculateDistance(
        origin.latitude, origin.longitude,
        destination.lat, destination.lng
      );
      
      const costPerKm = {
        '🚌 Public Transport': 2,
        '🚗 Personal Vehicle': 8,
        '🚕 Taxi/RideShare': 15,
        '🚶 Walking': 0,
        '🚴 Cycling': 0
      };
      
      return Math.round(distance * (costPerKm[mode] || costPerKm['🚌 Public Transport']));
    } catch (error) {
      console.warn("Cost calculation failed:", error);
      return 500;
    }
  };

  // ✅ Get weather information for destination
  const getDestinationWeather = async (lat, lng) => {
    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          longitude: lng,
          latitude: lat,
          destination: destination
        })
      });
      
      if (response.ok) {
        const weatherData = await response.json();
        if (weatherData.response) {
          return `🌤️ **Weather at Destination**: ${weatherData.response}`;
        }
      }
    } catch (error) {
      console.warn("Weather fetch failed:", error);
    }
    return null;
  };

  // ✅ Record travel expense in MCP
  const recordTravelExpense = async (amount, mode, destination) => {
    try {
      await fetch('/api/mcp/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          finance: {
            totalBalance: (userContext?.finance?.totalBalance || 0) - amount,
            recentTransactions: [
              {
                type: "travel_expense",
                amount: amount,
                category: "transportation",
                description: `${mode} to ${destination}`,
                date: new Date().toISOString()
              },
              ...(userContext?.finance?.recentTransactions || []).slice(0, 9)
            ]
          }
        })
      });
    } catch (error) {
      console.warn("Failed to record travel expense:", error);
    }
  };

  // ✅ Get route information using OSRM
  const getRouteInfo = async () => {
    if (!currentLocation || !destinationLat || !destinationLng) return;
    
    setIsLoading(true);
    try {
      // Determine OSRM profile based on transport mode
      const profileMap = {
        '🚌 Public Transport': 'driving', // OSRM doesn't have public transport, use driving as base
        '🚗 Personal Vehicle': 'driving',
        '🚕 Taxi/RideShare': 'driving',
        '🚶 Walking': 'walking',
        '🚴 Cycling': 'cycling'
      };

      const profile = profileMap[transportMode] || 'driving';
      
      // Use OSRM for route calculation
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${currentLocation.longitude},${currentLocation.latitude};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (!data.routes?.length) {
        setChat(prev => [...prev, { type: 'bot', text: `No ${profile} routes found between these locations.` }]);
        setIsLoading(false);
        return;
      }

      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMinutes = Math.round(route.duration / 60);

      // Calculate estimated cost for the selected mode
      const estimatedCost = await calculateEstimatedCostForMode(currentLocation, { lat: destinationLat, lng: destinationLng }, transportMode);
      
      let routeInfo = `🗺️ **Route Found (${transportMode})**:
• 📏 Distance: ${distanceKm} km
• ⏱️ Duration: ${durationMinutes} minutes
• 💰 Estimated Cost: ₹${estimatedCost}

📍 **Route Details**:
Start: Your current location
End: ${destination}`;

      // Add mode-specific tips
      const modeTips = {
        '🚌 Public Transport': `\n\n💡 **Public Transport Tips**:
• Check local transit schedules
• Consider off-peak hours for cheaper fares
• Use the **Places Bot** to find transit stops`,

        '🚗 Personal Vehicle': `\n\n💡 **Driving Tips**:
• Check traffic conditions before leaving
• Ensure you have enough fuel
• Consider parking availability at destination`,

        '🚕 Taxi/RideShare': `\n\n💡 **RideShare Tips**:
• Compare prices across different apps
• Consider ride-pooling for cheaper fares
• Check surge pricing times`,

        '🚶 Walking': `\n\n💡 **Walking Tips**:
• Wear comfortable shoes
• Check weather conditions
• Stay on well-lit paths`,

        '🚴 Cycling': `\n\n💡 **Cycling Tips**:
• Wear safety gear
• Check bike lane availability
• Consider weather conditions`
      };

      routeInfo += modeTips[transportMode] || '';

      // Add health considerations
      if (userContext?.health?.activeIllness && transportMode !== '🚶 Walking') {
        routeInfo += `\n\n🏥 **Health Note**: Since you're recovering from ${userContext.health.activeIllness}, consider taking breaks during your journey.`;
      }

      // Add cross-bot recommendations
      routeInfo += `\n\n🤖 **Cross-Bot Coordination**:
• Use **Places Bot** to find stops along your route
• Check **Finance Bot** for budget planning
• Ask **Weather Bot** for detailed forecasts`;

      setChat((prevChat) => [
        ...prevChat,
        { type: 'bot', text: routeInfo },
        { 
          type: 'bot', 
          text: (
            <>
              🗺️ **OpenStreetMap Directions**: <a 
                href={`https://www.openstreetmap.org/directions?engine=graphhopper_${profile}&route=${currentLocation.latitude}%2C${currentLocation.longitude}%3B${destinationLat}%2C${destinationLng}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Interactive Map
              </a>
            </>
          ),
        },
      ]);

    } catch (error) {
      console.error('OSRM routing error:', error);
      setChat((prevChat) => [...prevChat, { 
        type: 'bot', 
        text: 'Error calculating route. Please check your locations and try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartChat = () => {
    setChat([{ type: 'bot', text: 'Please enter your destination:' }]);
    setInput('');
    setDestination('');
    setCurrentLocation(null);
    setDestinationLat(null);
    setDestinationLng(null);
    setTransportMode(null);
    setShowMap(false);
    fetchUserContext(); // Refresh context
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Logout Button - Minimal addition */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6 space-x-2 text-blue-600">
            <FiNavigation className="text-2xl" />
            <h1 className="text-xl font-bold">Commute Assistant</h1>
            {userContext?.finance?.totalBalance && (
              <div className="ml-auto flex items-center space-x-2 text-sm bg-white px-3 py-1 rounded-full border border-blue-200">
                <FiDollarSign className="text-green-500" />
                <span>Balance: ₹{userContext.finance.totalBalance}</span>
              </div>
            )}
          </div>
          
          {chat.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'bot' ? 'justify-start' : 'justify-end'} mb-4`}>
              <div className={`flex items-start max-w-md ${message.type === 'bot' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'bot' ? 'bg-green-500 text-white mr-3' : 'bg-blue-500 text-white ml-3'}`}>
                  {message.type === 'bot' ? <FiMessageSquare /> : <FiUser />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${message.type === 'bot' ? 'bg-white text-gray-800' : 'bg-blue-500 text-white'}`}>
                  {typeof message.text === 'string' ? (
                    <ReactMarkdown className="prose-sm">{message.text}</ReactMarkdown>
                  ) : message.text}
                  {message.buttons && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.buttons.map((button, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleButtonClick(button)}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm font-medium transition-colors"
                          disabled={isLoading}
                        >
                          {button}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start max-w-md">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white mr-3">
                  <FiMessageSquare />
                </div>
                <div className="p-4 rounded-2xl shadow-sm bg-white text-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Finding best routes...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentLocation && destinationLat && destinationLng && (
            <div className="mt-6 p-4 bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-blue-500" />
                  <span className="font-medium">Coordinates</span>
                </div>
                <button
                  onClick={toggleMap}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <FiMap className="text-sm" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>
              
              {showMap && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-300">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(currentLocation.longitude, destinationLng)-0.01}%2C${Math.min(currentLocation.latitude, destinationLat)-0.01}%2C${Math.max(currentLocation.longitude, destinationLng)+0.01}%2C${Math.max(currentLocation.latitude, destinationLat)+0.01}&layer=mapnik&marker=${currentLocation.latitude}%2C${currentLocation.longitude}&marker=${destinationLat}%2C${destinationLng}`}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-medium">Current Location</div>
                  <div className="text-gray-600">({currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)})</div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-medium">Destination</div>
                  <div className="text-gray-600">({destinationLat.toFixed(4)}, {destinationLng.toFixed(4)})</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-blue-100 bg-white p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your destination..."
            className="flex-1 p-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading || !input.trim()}
          >
            <FiSend className="text-lg" />
          </button>
          <button
            onClick={handleRestartChat}
            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
            disabled={isLoading}
          >
            <FiRefreshCw className="text-lg" />
          </button>
        </div>
        {isLoading && (
          <div className="text-center text-sm text-blue-500 mt-2">
            Processing your request...
          </div>
        )}
      </div>
    </div>
  );
}

export default Commute;