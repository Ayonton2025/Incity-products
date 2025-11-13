import { textGenerator1 } from "@/helpers/gemini";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { weatherData, longitude, latitude } = req.body;

      // ✅ Validate input data
      if (!weatherData || longitude === undefined || latitude === undefined) {
        console.error("HealthCard API: Missing required parameters");
        return res.status(400).json({ 
          message: getFallbackHealthRecommendations(weatherData),
          error: "Missing required data: weatherData, longitude, or latitude"
        });
      }

      console.log("HealthCard API received data:", {
        hasWeatherData: !!weatherData,
        longitude, 
        latitude,
        temperature: weatherData.current?.temperature2m
      });

      try {
        const message = await textGenerator1(
          JSON.stringify({ weatherData, longitude, latitude })
        );

        console.log("HealthCard Gemini raw response received");

        // ✅ Handle JSON parsing with error recovery
        let parsedMessage;
        try {
          // Clean the response - remove markdown code blocks if present
          const cleanResponse = message.replace(/```json\n?|\n?```/g, '').trim();
          parsedMessage = JSON.parse(cleanResponse);
          console.log("HealthCard response parsed successfully");
        } catch (parseError) {
          console.error("HealthCard JSON parsing failed:", parseError);
          console.log("Raw response that failed to parse:", message.substring(0, 200) + "...");
          
          // ✅ Fallback health recommendations
          parsedMessage = getFallbackHealthRecommendations(weatherData);
          console.log("Using fallback health recommendations");
        }

        // ✅ Validate the response structure
        if (!parsedMessage.HealthPrecautions || !parsedMessage.MedicineList) {
          console.warn("HealthCard API: Response missing required fields, using fallback");
          parsedMessage = getFallbackHealthRecommendations(weatherData);
        }

        return res.status(200).json({ 
          message: parsedMessage,
          success: true
        });

      } catch (geminiError) {
        console.error("HealthCard Gemini API error:", geminiError.message);
        
        // ✅ Fallback to basic health recommendations when AI fails
        const fallbackResponse = getFallbackHealthRecommendations(weatherData);
        
        return res.status(200).json({ 
          message: fallbackResponse,
          note: "Using fallback health recommendations due to AI service issue",
          success: true
        });
      }

    } else {
      return res.status(405).json({ 
        message: "Method Not Allowed",
        error: "Only POST requests are supported"
      });
    }
  } catch (error) {
    console.error("HealthCard API Error:", error);
    
    // ✅ Final fallback in case of complete failure
    const fallbackResponse = getFallbackHealthRecommendations(null);
    
    return res.status(500).json({ 
      message: fallbackResponse,
      error: "Internal Server Error",
      details: error.message,
      note: "Using emergency fallback health recommendations",
      success: false
    });
  }
}

// ✅ Fallback function when AI fails
function getFallbackHealthRecommendations(weatherData) {
  const temp = weatherData?.current?.temperature2m || 25;
  const humidity = weatherData?.current?.relativeHumidity2m || 50;
  const precipitation = weatherData?.current?.precipitation || 0;
  const windSpeed = weatherData?.current?.windSpeed10m || 10;

  // Hot weather recommendations
  if (temp > 30) {
    return {
      "HealthPrecautions": [
        {
          "Precaution": "Stay hydrated and drink plenty of water",
          "Why is it important": "High temperatures can cause dehydration, heat exhaustion, and heat stroke. Proper hydration helps regulate body temperature."
        },
        {
          "Precaution": "Avoid direct sunlight during 10 AM to 4 PM",
          "Why is it important": "UV rays are strongest during these hours, increasing risk of sunburn and heat-related illnesses."
        },
        {
          "Precaution": "Wear light-colored, loose-fitting cotton clothes",
          "Why is it important": "Light colors reflect heat and loose clothing allows better air circulation to keep you cool."
        },
        {
          "Precaution": "Use sunscreen with SPF 30+",
          "Why is it important": "Protects skin from harmful UV rays that can cause sunburn and increase skin cancer risk."
        }
      ],
      "MedicineList": [
        {
          "Medicine Name": "Oral Rehydration Salts (ORS)",
          "Purpose": "Prevents and treats dehydration from heat exposure",
          "Dosage": "One packet dissolved in 1 liter of water, drink as needed"
        },
        {
          "Medicine Name": "Paracetamol",
          "Purpose": "Reduces fever and relieves body aches from heat exposure",
          "Dosage": "500 mg every 4-6 hours as needed, maximum 4 times daily"
        },
        {
          "Medicine Name": "Electrolyte powder",
          "Purpose": "Replenishes minerals lost through sweating",
          "Dosage": "As per package instructions when sweating excessively"
        }
      ]
    };
  } 
  // Cold weather recommendations
  else if (temp < 15) {
    return {
      "HealthPrecautions": [
        {
          "Precaution": "Wear layered clothing for better insulation",
          "Why is it important": "Layers trap body heat more effectively than single heavy garments and can be adjusted as needed."
        },
        {
          "Precaution": "Cover ears, hands, and feet properly",
          "Why is it important": "Extremities lose heat fastest and are most vulnerable to frostbite in cold conditions."
        },
        {
          "Precaution": "Keep skin moisturized regularly",
          "Why is it important": "Cold air lacks humidity and can cause dry skin, cracking, and irritation."
        },
        {
          "Precaution": "Ensure proper indoor ventilation when using heaters",
          "Why is it important": "Prevents carbon monoxide buildup and maintains air quality while warming indoor spaces."
        }
      ],
      "MedicineList": [
        {
          "Medicine Name": "Vitamin C supplements",
          "Purpose": "Boosts immune system during cold and flu season",
          "Dosage": "500-1000 mg daily with meals"
        },
        {
          "Medicine Name": "Cough syrup (Dextromethorphan)",
          "Purpose": "Relieves dry cough common in cold weather",
          "Dosage": "10-20 ml every 4-6 hours as needed"
        },
        {
          "Medicine Name": "Nasal saline spray",
          "Purpose": "Moisturizes dry nasal passages from cold air",
          "Dosage": "2-3 sprays in each nostril as needed"
        }
      ]
    };
  } 
  // Rainy/humid weather recommendations
  else if (precipitation > 0 || humidity > 70) {
    return {
      "HealthPrecautions": [
        {
          "Precaution": "Always carry rain protection (umbrella/raincoat)",
          "Why is it important": "Getting wet in rain can lower body temperature and increase susceptibility to colds and infections."
        },
        {
          "Precaution": "Avoid walking through stagnant water",
          "Why is it important": "Stagnant water breeds mosquitoes and bacteria that can cause dengue, malaria, and skin infections."
        },
        {
          "Precaution": "Keep feet dry and change wet socks immediately",
          "Why is it important": "Wet feet in closed shoes create ideal conditions for fungal infections like athlete's foot."
        },
        {
          "Precaution": "Use mosquito repellent regularly",
          "Why is it important": "Humid and rainy conditions increase mosquito breeding, raising risk of vector-borne diseases."
        }
      ],
      "MedicineList": [
        {
          "Medicine Name": "Antihistamine (Cetirizine)",
          "Purpose": "Controls allergy symptoms that often worsen in humid weather",
          "Dosage": "10 mg once daily in evening"
        },
        {
          "Medicine Name": "Antifungal powder (Clotrimazole)",
          "Purpose": "Prevents and treats fungal infections in moist conditions",
          "Dosage": "Apply to affected areas twice daily"
        },
        {
          "Medicine Name": "Antidiarrheal (Loperamide)",
          "Purpose": "Treats waterborne digestive issues common in rainy season",
          "Dosage": "4 mg initially, then 2 mg after each loose stool, maximum 16 mg daily"
        }
      ]
    };
  } 
  // Moderate weather recommendations (default)
  else {
    return {
      "HealthPrecautions": [
        {
          "Precaution": "Maintain regular outdoor exercise routine",
          "Why is it important": "Pleasant weather provides ideal conditions for physical activity that boosts cardiovascular health and immunity."
        },
        {
          "Precaution": "Stay consistently hydrated throughout day",
          "Why is it important": "Even in moderate temperatures, proper hydration is essential for organ function and overall wellness."
        },
        {
          "Precaution": "Apply sunscreen when spending time outdoors",
          "Why is it important": "UV protection is necessary year-round to prevent skin damage and reduce skin cancer risk."
        },
        {
          "Precaution": "Eat seasonal fruits and vegetables",
          "Why is it important": "Fresh produce provides essential vitamins and antioxidants that support immune function in current conditions."
        }
      ],
      "MedicineList": [
        {
          "Medicine Name": "Multivitamin tablet",
          "Purpose": "General health maintenance and nutritional support",
          "Dosage": "Once daily with morning meal"
        },
        {
          "Medicine Name": "Pain reliever (Ibuprofen)",
          "Purpose": "Manages general body aches, pains, and inflammation",
          "Dosage": "200-400 mg every 6-8 hours as needed with food"
        },
        {
          "Medicine Name": "Probiotic supplements",
          "Purpose": "Supports digestive health and immune function",
          "Dosage": "As per package instructions, typically once daily"
        }
      ]
    };
  }
}