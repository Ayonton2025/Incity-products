import React, { useEffect, useState } from "react";
import { fetchWeatherApi } from "openmeteo";
import RootLayout from "../layout";
import axios from "axios";
import Outfit from "@/components/Outfit";
import HealthCard from "@/components/HealthCard";
import { useSession, signOut } from "next-auth/react";

export default function Weather() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [res, setRes] = useState(null);
  const [res1, setRes1] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(latitude, longitude);
        setLocation({ latitude, longitude });
      },
      (error) => {
        console.error("Error getting location", error);
        // Set default location if geolocation fails
        setLocation({ latitude: 52.52, longitude: 13.41 }); // Default to Berlin
        setError("Failed to get your location. Using default location.");
      }
    );
  }, []);

  useEffect(() => {
    async function fetchWeatherData() {
      if (location.latitude && location.longitude) {
        setLoading(true);
        setError(null);

        try {
          const params = {
            latitude: location.latitude,
            longitude: location.longitude,
            current: [
              "temperature_2m",
              "relative_humidity_2m",
              "precipitation",
              "rain",
              "wind_speed_10m",
            ],
            daily: ["temperature_2m_max", "temperature_2m_min"],
          };

          const url = "https://api.open-meteo.com/v1/forecast";
          const responses = await fetchWeatherApi(url, params);

          const range = (start, stop, step) =>
            Array.from(
              { length: (stop - start) / step },
              (_, i) => start + i * step
            );

          const response = responses[0];
          const utcOffsetSeconds = response.utcOffsetSeconds();
          const timezone = response.timezone();
          const timezoneAbbreviation = response.timezoneAbbreviation();
          const latitude = response.latitude();
          const longitude = response.longitude();

          const current = response.current();
          const daily = response.daily();

          const weatherData = {
            current: {
              time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
              temperature2m: current.variables(0).value(),
              relativeHumidity2m: current.variables(1).value(),
              precipitation: current.variables(2).value(),
              rain: current.variables(3).value(),
              windSpeed10m: current.variables(4).value(),
            },
            daily: {
              time: range(
                Number(daily.time()),
                Number(daily.timeEnd()),
                daily.interval()
              ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
              temperature2mMax: daily.variables(0).valuesArray(),
              temperature2mMin: daily.variables(1).valuesArray(),
            },
          };

          setData(weatherData);

          // ✅ Fix: Use try-catch for API calls and await properly
          try {
            const outfitResponse = await axios.post("/api/weather", {
              weatherData,
              longitude: location.longitude,
              latitude: location.latitude,
            });
            setRes(outfitResponse.data);
          } catch (apiError) {
            console.error("Outfit API error:", apiError);
            setError("Failed to load outfit recommendations.");
          }

          try {
            const healthResponse = await axios.post("/api/healthCard", {
              weatherData,
              longitude: location.longitude,
              latitude: location.latitude,
            });
            setRes1(healthResponse.data);
          } catch (apiError) {
            console.error("Health API error:", apiError);
            setError("Failed to load health recommendations.");
          }

        } catch (error) {
          console.error("Weather data fetch error:", error);
          setError("Failed to load weather data.");
        } finally {
          setLoading(false);
        }
      }
    }

    fetchWeatherData();
  }, [location.latitude, location.longitude]);

  // ✅ Fix: Add loading and error states
  if (loading) {
    return (
      <RootLayout>
        <div className="h-[100vh] w-full flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading weather data...</div>
        </div>
      </RootLayout>
    );
  }

  if (error) {
    return (
      <RootLayout>
        <div className="h-[100vh] w-full flex items-center justify-center bg-gray-900">
          <div className="text-red-400 text-xl">{error}</div>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <div className="h-[100vh] w-full overflow-y-scroll bg-gray-900 flex flex-col items-center p-4">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>

        {data && (
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mb-5">
            <div className="font-bold text-xl text-gray-800">Your Location</div>
            <div className="text-sm text-gray-500">
              {data.current.time.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              {data.current.time.toLocaleTimeString("en-US")}
            </div>

            <div className="mt-6 text-6xl flex flex-col items-center justify-center mx-auto rounded-lg text-indigo-400 h-24 w-24">
              <svg
                className="w-32 h-32"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                ></path>
              </svg>
            </div>

            <div className="flex flex-row items-center justify-center mt-6">
              <div className="font-medium text-6xl">
                {data.current.temperature2m.toFixed(2)}°
              </div>
              <div className="flex flex-col items-center ml-6">
                <div>Cloudy</div>
                <div className="mt-1">
                  <span className="text-sm">
                    <i className="far fa-long-arrow-up"></i>
                  </span>
                  <span className="text-sm font-light text-gray-500">
                    {Math.max(...data.daily.temperature2mMax).toFixed(2)}°C
                  </span>
                </div>
                <div>
                  <span className="text-sm">
                    <i className="far fa-long-arrow-down"></i>
                  </span>
                  <span className="text-sm font-light text-gray-500">
                    {Math.min(...data.daily.temperature2mMin).toFixed(2)}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row justify-between mt-6">
              <div className="flex flex-col items-center">
                <div className="font-medium text-sm">Wind</div>
                <div className="text-sm text-gray-500">
                  {data.current.windSpeed10m.toFixed(2)} k/h
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-medium text-sm">Humidity</div>
                <div className="text-sm text-gray-500">
                  {data.current.relativeHumidity2m.toFixed(2)}%
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-medium text-sm">Precipitation</div>
                <div className="text-sm text-gray-500">
                  {data.current.precipitation.toFixed(2)} mm
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {res && res.message && (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full">
              <h1 className="text-4xl font-extrabold text-cyan-300 mb-4">
                Recommended Outfits
              </h1>
              {/* ✅ Fix: Ensure res.message is an array before mapping */}
              {Array.isArray(res.message) ? (
                <Outfit outfits={res.message} />
              ) : (
                <div className="text-gray-600">
                  No outfit recommendations available.
                </div>
              )}
            </div>
          )}

          {res1 && res1.message && (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between h-full">
              <h1 className="text-4xl font-extrabold text-cyan-300 mb-4">
                Wellness Measures
              </h1>
              {/* ✅ Fix: Ensure res1.message has the expected structure */}
              {res1.message.HealthPrecautions && res1.message.MedicineList ? (
                <HealthCard
                  HealthPrecautions={res1.message.HealthPrecautions}
                  MedicineList={res1.message.MedicineList}
                />
              ) : (
                <div className="text-gray-600">
                  No health recommendations available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ✅ Fix: Show message when no data is available */}
        {(!res || !res1) && !loading && (
          <div className="text-white text-center mt-8">
            <p>No recommendations available for your location.</p>
          </div>
        )}
      </div>
    </RootLayout>
  );
}