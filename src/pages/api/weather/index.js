// src/pages/api/weather/index.js
import { textGenerator } from "@/helpers/gemini";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { weatherData, longitude, latitude } = req.body;

      // ✅ Validate input data
      if (!weatherData || longitude === undefined || latitude === undefined) {
        console.error("Weather API: Missing required parameters");
        return res.status(400).json({ 
          message: getFallbackOutfitRecommendations(weatherData),
          error: "Missing required data: weatherData, longitude, or latitude"
        });
      }

      console.log("Weather API received data:", {
        hasWeatherData: !!weatherData,
        longitude, 
        latitude,
        temperature: weatherData.current?.temperature2m,
        precipitation: weatherData.current?.precipitation
      });

      try {
        const message = await textGenerator(
          JSON.stringify({ weatherData, longitude, latitude })
        );

        console.log("Weather Gemini raw response received");

        // ✅ Handle JSON parsing with error recovery
        let parsedMessage;
        try {
          // Clean the response - remove markdown code blocks if present
          const cleanResponse = message.replace(/```json\n?|\n?```/g, '').trim();
          parsedMessage = JSON.parse(cleanResponse);
          console.log("Weather response parsed successfully, items:", parsedMessage?.length);
        } catch (parseError) {
          console.error("Weather JSON parsing failed:", parseError);
          console.log("Raw response that failed to parse:", message.substring(0, 200) + "...");
          
          // ✅ Fallback outfit recommendations
          parsedMessage = getFallbackOutfitRecommendations(weatherData);
          console.log("Using fallback outfit recommendations");
        }

        // ✅ Validate the response structure
        if (!Array.isArray(parsedMessage) || parsedMessage.length === 0) {
          console.warn("Weather API: Response is not a valid array, using fallback");
          parsedMessage = getFallbackOutfitRecommendations(weatherData);
        }

        // ✅ Ensure each item has required fields
        const validatedMessage = parsedMessage.map((item, index) => ({
          "Cloth Name": item["Cloth Name"] || `Outfit Item ${index + 1}`,
          "Category": item.Category || "General",
          "Why is it beneficial": item["Why is it beneficial"] || "Suitable for current weather conditions",
          "Price": item.Price || "₹500-₹2000",
          "Popularity": item.Popularity || "Medium"
        }));

        return res.status(200).json({ 
          message: validatedMessage,
          success: true
        });

      } catch (geminiError) {
        console.error("Weather Gemini API error:", geminiError.message);
        
        // ✅ Fallback to basic outfit recommendations when AI fails
        const fallbackResponse = getFallbackOutfitRecommendations(weatherData);
        
        return res.status(200).json({ 
          message: fallbackResponse,
          note: "Using fallback outfit recommendations due to AI service issue",
          success: true
        });
      }

    } else {
      return res.status(405).json({ 
        message: getFallbackOutfitRecommendations(null),
        error: "Only POST requests are supported"
      });
    }
  } catch (error) {
    console.error("Weather API Error:", error);
    
    // ✅ Final fallback in case of complete failure
    const fallbackResponse = getFallbackOutfitRecommendations(null);
    
    return res.status(500).json({ 
      message: fallbackResponse,
      error: "Internal Server Error",
      details: error.message,
      note: "Using emergency fallback outfit recommendations",
      success: false
    });
  }
}

// ✅ Fallback function when AI fails
function getFallbackOutfitRecommendations(weatherData) {
  const temp = weatherData?.current?.temperature2m || 25;
  const precipitation = weatherData?.current?.precipitation || 0;
  const humidity = weatherData?.current?.relativeHumidity2m || 50;
  const windSpeed = weatherData?.current?.windSpeed10m || 10;

  // Hot and sunny weather
  if (temp > 30 && precipitation === 0) {
    return [
      {
        "Cloth Name": "Cotton T-shirt",
        "Category": "Upperwear",
        "Why is it beneficial": "Lightweight and breathable fabric keeps you cool in hot weather",
        "Price": "₹300-₹800",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Linen Shorts",
        "Category": "Lowerwear",
        "Why is it beneficial": "Allows air circulation and provides comfort in high temperatures",
        "Price": "₹600-₹1500",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Sun Hat with Wide Brim",
        "Category": "Headwear",
        "Why is it beneficial": "Protects face and neck from direct sunlight and UV rays",
        "Price": "₹400-₹1200",
        "Popularity": "Medium"
      },
      {
        "Cloth Name": "Sports Sandals",
        "Category": "Footwear",
        "Why is it beneficial": "Ventilated design keeps feet cool and comfortable in heat",
        "Price": "₹800-₹2000",
        "Popularity": "High"
      }
    ];
  } 
  // Cold weather
  else if (temp < 15) {
    return [
      {
        "Cloth Name": "Thermal Winter Jacket",
        "Category": "Outerwear",
        "Why is it beneficial": "Insulated design provides warmth and protection from cold winds",
        "Price": "₹2000-₹5000",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Woolen Sweater",
        "Category": "Upperwear",
        "Why is it beneficial": "Natural wool fibers trap body heat effectively in cold conditions",
        "Price": "₹800-₹2500",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Fleece-lined Pants",
        "Category": "Lowerwear",
        "Why is it beneficial": "Soft inner lining provides extra warmth and comfort in low temperatures",
        "Price": "₹1200-₹3000",
        "Popularity": "Medium"
      },
      {
        "Cloth Name": "Thermal Gloves",
        "Category": "Accessories",
        "Why is it beneficial": "Protects hands from cold and maintains finger dexterity",
        "Price": "₹300-₹900",
        "Popularity": "Medium"
      }
    ];
  } 
  // Rainy weather
  else if (precipitation > 0) {
    return [
      {
        "Cloth Name": "Waterproof Rain Jacket",
        "Category": "Outerwear",
        "Why is it beneficial": "Keeps you dry during rainfall with sealed seams and water-resistant fabric",
        "Price": "₹1500-₹4000",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Quick-dry Pants",
        "Category": "Lowerwear",
        "Why is it beneficial": "Special fabric dries quickly if it gets wet in the rain",
        "Price": "₹1000-₹2500",
        "Popularity": "Medium"
      },
      {
        "Cloth Name": "Waterproof Boots",
        "Category": "Footwear",
        "Why is it beneficial": "Prevents water seepage and keeps feet dry in wet conditions",
        "Price": "₹1200-₹3500",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Compact Umbrella",
        "Category": "Accessories",
        "Why is it beneficial": "Essential protection from rain that can be carried easily",
        "Price": "₹200-₹600",
        "Popularity": "High"
      }
    ];
  }
  // Moderate/pleasant weather (default)
  else {
    return [
      {
        "Cloth Name": "Casual Cotton Shirt",
        "Category": "Upperwear",
        "Why is it beneficial": "Versatile and comfortable for moderate temperatures",
        "Price": "₹600-₹1500",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Comfortable Jeans",
        "Category": "Lowerwear",
        "Why is it beneficial": "Durable and suitable for various activities in pleasant weather",
        "Price": "₹800-₹2000",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Light Jacket",
        "Category": "Outerwear",
        "Why is it beneficial": "Perfect layer for temperature changes throughout the day",
        "Price": "₹1000-₹3000",
        "Popularity": "High"
      },
      {
        "Cloth Name": "Walking Shoes",
        "Category": "Footwear",
        "Why is it beneficial": "Comfortable for extended wear in pleasant weather conditions",
        "Price": "₹1200-₹3500",
        "Popularity": "High"
      }
    ];
  }
}