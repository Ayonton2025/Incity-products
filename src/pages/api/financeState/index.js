// // src/pages/api/updateFinancialState.js
// import { GoogleGenerativeAI } from "@google/generative-ai";

// let financialState = {
//   salary: 0,
//   needs: 0,
//   wants: 0,
//   savings: 0,
//   investments: 0,
// };

// export default async function handler(req, res) {
//   if (req.method === "POST") {
//     const { prompt, currentState, chatHistory } = req.body;

//     try {
//       // Initialize Gemini AI model with API key and custom system instruction
//       const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
//       const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
//         model: "gemini-1.5-flash",
//         systemInstruction: `
//           You are a financial advisor bot. You receive a financial state object with fields like "salary", "needs", "wants", "savings", and "investments". Based on the given user prompt and chatHistory, make necessary adjustments to these fields and return only the updated financial state object in JSON format. No additional text.
//         `,
//       });

//       // Construct the payload for the model
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

//       // Parse and update the internal financial state based on model response
//       console.log("Model response:", jsonResponse);
//       const updatedState = JSON.parse(jsonResponse);
//       console.log("Updated financial state:", updatedState);
//       financialState = updatedState;

//       res.status(200).json({
//         message: "Financial state updated successfully.",
//         financialState,
//       });
//     } catch (error) {
//       console.error("Error updating financial data:", error);
//       res.status(500).json({
//         error: "An error occurred while updating financial data.",
//         details: error.message,
//       });
//     }
//   } else {
//     res.setHeader("Allow", ["POST"]);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
