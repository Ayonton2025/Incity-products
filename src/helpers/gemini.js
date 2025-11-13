import { GoogleGenerativeAI } from "@google/generative-ai";

let conversation = null;

export function initializeChat(message) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const model = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({
    model: "gemini-pro",
  });

  const initHistory = [
    {
      role: "user",
      parts: [message],
    },
    {
      role: "model",
      parts: "Hi, I am Incity. How can I help you.",
    },
  ];

  conversation = model.startChat({
    history: initHistory,
    generationConfig: {
      maxOutputTokens: 350,
    },
  });

  conversation._apiKey = null;
  return conversation;
}

export async function sendMessage(message) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  console.log(geminiApiKey);
  
  const response = {
    text: "Something went wrong",
    conversation: null,
  };

  if (!conversation) {
    console.log("Conversation Error");
    return response;
  }

  try {
    conversation._apiKey = geminiApiKey;
    const result = await conversation.sendMessage(message);
    console.log(result);
    response.text = await result.response.text();
    console.log(response.text);
    response.conversation = conversation;
    return response;
  } catch (error) {
    console.log(error);
    response.conversation = conversation;
    return response;
  }
}

export const textGenerator1 = async (message) => {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  
  // ✅ Use working models with fallback
  let model;
  try {
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
  } catch (error) {
    console.warn("gemini-2.0-flash not available, using gemini-2.0-pro");
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
  }

  const result = await model.generateContent(`
    Objective: Provide users with health precautionary measures and a list of essential medicines based on the current weather and location data.

    Instructions:
    1. Analyze the provided weather data and geographical coordinates (longitude, latitude) to determine the specific location.
    2. Identify the city from the given coordinates.
    3. Generate health precautions:
     - Suggest specific health precautions based on weather conditions and location.
     - Include a brief explanation for each precaution on why it is necessary.
     - Format the precautions in a JSON array with each object containing:
       - 'Precaution': The specific health measure.
       - 'Why is it important': Explanation of its relevance to the weather and location.
    4. Generate a list of essential medicines:
     - Provide a list of medicines suitable for common weather-related health issues.
     - Include the purpose and recommended dosage for each medicine.
     - Format the medicine list in a JSON array with each object containing:
       - 'Medicine Name': The name of the medicine.
       - 'Purpose': What the medicine is used for.
       - 'Dosage': Recommended dosage, if applicable.
    5. **Strictly return only JSON-parseable output**:
     - Provide the output in JSON format with two main sections: "HealthPrecautions" and "MedicineList."
     - Each section should be an array of JSON objects with the fields described above.
     - Avoid any additional text, markdown, or explanations.

    Weather and Location Data: ${message}

    Example Output:
    {
      "HealthPrecautions": [
        {
          "Precaution": "Wear a face mask",
          "Why is it important": "High air pollution levels detected in the city."
        }
      ],
      "MedicineList": [
        {
          "Medicine Name": "Paracetamol",
          "Purpose": "To reduce fever.",
          "Dosage": "500 mg every 4-6 hours as needed."
        }
      ]
    }
  `);

  return result.response.text();
};

export const textGenerator = async (message) => {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  
  // ✅ Use working models with fallback
  let model;
  try {
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
  } catch (error) {
    console.warn("gemini-2.0-flash not available, using gemini-2.0-pro");
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
  }

  const result = await model.generateContent(`
    Objective: Provide users with specific outfit recommendations based on the current weather and location data.

    Instructions:
    1. Analyze the provided weather data and geographical coordinates (longitude, latitude).
    2. Based on the weather conditions (e.g., temperature, humidity, precipitation) and location (coordinates), suggest at least 4 local outfits suitable for the day.
    3. For each recommended outfit, return an array of JSON objects with the following fields:
       - 'Cloth Name': The name of the specific product from a particular company or store that is famous in the locality according to the coordinates.
       - 'Category': The type of clothing (e.g., jacket, hat, shoes).
       - 'Why is it beneficial': An explanation of why this clothing item is suitable given the weather and location.
       - 'Price': The approximate price of the item in rupees.
       - 'Popularity': The popularity of the item, possibly based on trends or local preferences.
    4. **Strictly return a JSON-parseable array**. Do not include any additional text, markdown, or explanations. The output must be in a plain JSON format.

    Weather and Location Data: ${message}

    Example Output:
    [
      {
        "Cloth Name": "Rain Defender Jacket",
        "Category": "Outerwear",
        "Why is it beneficial": "Perfect for staying dry during heavy rain, common in this region.",
        "Price": "Rs 95",
        "Popularity": "Very High"
      }
    ]
  `);

  return result.response.text();
};

export async function keyword(message) {
  console.log(message);
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  
  // ✅ Use working models with fallback
  let model;
  try {
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 100,
      },
    });
  } catch (error) {
    console.warn("gemini-2.0-flash not available, using gemini-2.0-pro");
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-pro",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 100,
      },
    });
  }

  const result = await model.generateContent(`
    Objective: Generate keywords for search queries to be used with the Google Maps API based on the provided message.

    Instructions:
    1. Analyze the provided message to understand the search context and intent.
    2. Extract and generate a set of relevant keywords that can be used to perform searches on the Google Maps API.
    3. The generated keywords should be specific to the context of the message and should be formatted as a comma-separated list.
    4. **Strictly return only the keywords in plain text format**. Do not include any additional text, explanations, or formatting.

    User Message: "${message}"

    Example:
    Input: "Suggest some hospitals or clinic for fever"
    Output: "fever"

    Input: "Suggest some hospitals or clinic for skin rash treatment"
    Output: "skin_rash"
  `);

  return result.response.text();
}