// // src/pages/api/updateFoodState.js
// import { GoogleGenerativeAI } from "@google/generative-ai";

// let foodState = {
//   breakfast: "",
//   lunch: "",
//   dinner: "",
//   snacks: "",
//   dietaryPreferences: "", // e.g., vegetarian, vegan, keto, etc.
//   allergies: [], // e.g., ["nuts", "gluten"]
//   calorieIntake: 0, // Estimated daily calorie intake
//   favoriteCuisines: [], // e.g., ["Indian", "Italian", "Japanese"]
// };

// export default async function handler(req, res) {
//   if (req.method === "POST") {
//     const { prompt, currentState, chatHistory } = req.body;
//     console.log(prompt, chatHistory, currentState);
//     try {
//       // Initialize Gemini AI model with API key and system instruction
//       const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
//       const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
//         model: "gemini-1.5-flash",
//         systemInstruction: `
//           You are a food tracking assistant. You receive a food state object with fields like "breakfast", "lunch", "dinner", "snacks", "dietaryPreferences", "allergies", "calorieIntake", and "favoriteCuisines". Based on the user prompt and chat history, update the foodState accordingly.

//           Ensure:
//           - Meals match the user's dietary preferences.
//           - Allergies are strictly avoided in meal recommendations.
//           - The updated state includes balanced and nutritious food choices.
//           - If calorie intake is mentioned, adjust meal suggestions accordingly.
//           - Favorite cuisines are considered in meal recommendations.

//           Return ONLY the updated food state object in JSON format. No additional text.
//         `,
//       });

//       // Construct payload for the model
//       const payload = JSON.stringify({
//         currentState,
//         prompt,
//         chatHistory,
//       });

//       // Send request to Gemini model and parse JSON response
//       const response = await model.generateContent(payload);
//       let responseText = await response.response.text();

//       // Extract JSON part from the response text
//       const jsonStartIndex = responseText.indexOf("{");
//       const jsonEndIndex = responseText.lastIndexOf("}") + 1;
//       const jsonResponse = responseText.substring(jsonStartIndex, jsonEndIndex);

//       // Parse and update internal food state
//       console.log("Model response:", jsonResponse);
//       const updatedState = JSON.parse(jsonResponse);
//       console.log("Updated food state:", updatedState);
//       foodState = updatedState;

//       res.status(200).json({
//         message: "Food state updated successfully.",
//         foodState,
//       });
//     } catch (error) {
//       console.error("Error updating food data:", error);
//       res.status(500).json({
//         error: "An error occurred while updating food data.",
//         details: error.message,
//       });
//     }
//   } else {
//     res.setHeader("Allow", ["POST"]);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
