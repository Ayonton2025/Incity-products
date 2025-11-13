// src/pages/api/health/index.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id;
  const userName = session.user.name || "User"; // Get actual user name from session
  const userEmail = session.user.email;
  const { message, chatHistory } = req.body;

  try {
    // Get user context from MCP
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const mcpUrl = `${protocol}://${host}/api/mcp/context?userId=${userId}`;
    
    let userContext = { health: {}, food: {}, finance: {} };
    try {
      const contextRes = await fetch(mcpUrl);
      if (contextRes.ok) {
        userContext = await contextRes.json();
      }
    } catch (contextError) {
      console.warn("MCP context fetch failed, using default context:", contextError.message);
    }

    // Health keyword detection (PRESERVED LOGIC)
    const illnessKeywords = [
      "fever", "cold", "cough", "sick", "ill", "flu", "infection", 
      "rash", "dengue", "chikungunya"
    ];
    const hasIllness = illnessKeywords.some(kw =>
      message.toLowerCase().includes(kw)
    );

    // Auto-expire health status if outdated (ENHANCED LOGIC)
    const now = new Date();
    let healthUpdateNeeded = false;
    let healthUpdates = {};

    // Check if health status needs to be reset
    if (userContext.health?.expiresAt && new Date(userContext.health.expiresAt) < now) {
      healthUpdates = {
        activeIllness: null,
        symptoms: [],
        startedAt: null,
        expiresAt: null,
        currentCondition: "healthy"
      };
      healthUpdateNeeded = true;
    }

    // Update illness status if new symptom detected (ENHANCED LOGIC)
    if (hasIllness && !userContext.health?.activeIllness) {
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      healthUpdates = {
        activeIllness: "reported_symptoms",
        symptoms: [...(userContext.health?.symptoms || []), message],
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        currentCondition: "sick"
      };
      healthUpdateNeeded = true;
    }

    // Manual reset detection
    const resetKeywords = ["fine", "healthy", "not sick", "recovered", "better now"];
    const shouldReset = resetKeywords.some(kw => 
      message.toLowerCase().includes(kw)
    );

    if (shouldReset && userContext.health?.activeIllness) {
      healthUpdates = {
        activeIllness: null,
        symptoms: [],
        startedAt: null,
        expiresAt: null,
        currentCondition: "healthy"
      };
      healthUpdateNeeded = true;
    }

    // Send health updates to MCP if needed
    if (healthUpdateNeeded) {
      try {
        await fetch(mcpUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            health: { ...userContext.health, ...healthUpdates }
          }),
        });
        // Update local context
        userContext.health = { ...userContext.health, ...healthUpdates };
      } catch (updateError) {
        console.warn("Failed to update MCP context:", updateError.message);
      }
    }

    // Initialize Gemini client (PRESERVED LOGIC)
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use currently supported models (PRESERVED LOGIC)
    let model;
    try {
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
    } catch (err) {
      console.warn("gemini-2.0-flash not found, using gemini-2.0-pro");
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-pro",
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
    }

    // ENHANCED SYSTEM INSTRUCTION WITH DYNAMIC USER NAME
    const systemInstruction = `
CRITICAL USER CONTEXT (From MCP Database):
- User Name: ${userName}
- User Email: ${userEmail}
- Current Health Status: ${userContext.health?.currentCondition || "unknown"}
- Active Illness: ${userContext.health?.activeIllness || "none"}
- Symptoms: ${userContext.health?.symptoms?.join(", ") || "none reported"}
- Allergies: ${userContext.health?.allergies?.join(", ") || "none reported"}
- Illness Started: ${userContext.health?.startedAt || "N/A"}
- Illness Expires: ${userContext.health?.expiresAt || "N/A"}

USER PROFILE:
The user's name is ${userName} (email: ${userEmail}). Always address them by their name "${userName}" in your responses. Use their medical history, lifestyle habits, and other personal factors to provide tailored, accurate, and empathetic responses.

RESPONSE GUIDELINES:
1. PERSONALIZATION: Always address the user by their name "${userName}" in your responses. Make the conversation personal and tailored to them.

2. HEALTH STATUS AWARENESS: If the user has an active illness (${userContext.health?.activeIllness || "none"}), tailor your advice accordingly. Consider their symptoms: ${userContext.health?.symptoms?.join(", ") || "none"}.

3. ALLERGY SAFETY: Never recommend anything that contains allergens: ${userContext.health?.allergies?.join(", ") || "none"}. If unsure, ask about ingredients.

4. RECIPE COORDINATION: If suggesting foods or recipes, recommend items that are appropriate for their current health condition. For example, if they have fever, suggest light, easy-to-digest foods and mention they can ask the Recipes Bot for specific preparations.

5. CROSS-BOT COLLABORATION: 
   - If user asks about food while sick, suggest: "You can ask the Recipes Bot for light meals like khichdi or soup that would be good for your condition."
   - If user mentions budget constraints for medications, suggest: "The Finance Bot can help you manage healthcare expenses."
   - If user needs to visit a doctor, suggest: "The Commute Bot can help you find the best route to nearby hospitals."

6. LOCATION-BASED ADVICE: When providing recommendations for healthcare services, pharmacies, hospitals, or other facilities, always name specific places with their exact location (e.g., clinic names, addresses, or landmarks) in Chennai rather than suggesting a Google search.

7. AUTO-RESET NOTICE: Inform users that their health status will automatically reset after 7 days, or they can manually reset it by saying "I'm fine now" or "I'm not sick anymore".

8. PREVENTIVE CARE: For ongoing conditions, suggest follow-up actions and remind them to consult actual healthcare professionals for serious issues.

Prioritize personalized advice, including preventive care, possible risks, and lifestyle adjustments. The response should be clear, actionable, and considerate of the user's unique health context.
`;

  
    const parts = [
      {
        text: "input: I was bitten by a stray dog in North Chennai. What should I do?",
      },
      {
        text: `output: ${userName}, go to the nearest government or private hospital immediately for a rabies vaccination. Chennai hospitals like Rajiv Gandhi Government General Hospital and Apollo Hospital provide post-exposure rabies vaccines. Don't delay, as rabies is fatal once symptoms appear.`,
      },
      {
        text: "input: I'm experiencing respiratory issues, and I live near Perungudi in Chennai. Could it be due to pollution?",
      },
      {
        text: `output: ${userName}, Perungudi, like other industrial areas in Chennai, has seen rising air pollution levels. Prolonged exposure can trigger respiratory issues like asthma or bronchitis. It's advisable to wear a mask outdoors and consult a doctor if the symptoms persist.`,
      },
      {
        text: "input: I have a fever and headache.",
      },
      {
        text: `output: ${userName}, I understand you're feeling unwell with fever and headache. Let me help you manage these symptoms. For fever, make sure to stay hydrated and rest. You can take paracetamol for the headache, but avoid aspirin. If your fever persists beyond 48 hours or exceeds 102°F, please consult a doctor. Would you like me to suggest some home remedies that might help?`,
      },
      {
        text: "input: What should I eat when I have a cold?",
      },
      {
        text: `output: ${userName}, when you have a cold, it's best to eat light, warm, and nutritious foods. Consider warm soups, khichdi, steamed vegetables, and plenty of fluids like herbal tea. The Recipes Bot can provide specific meal preparations that would be gentle on your system while you recover.`,
      },
      {
        text: "input: I think I'm allergic to peanuts.",
      },
      {
        text: `output: ${userName}, peanut allergies can be serious. I've noted this in your health profile. If you experience symptoms like swelling, difficulty breathing, or hives after consuming peanuts, seek immediate medical attention. For mild reactions, antihistamines might help, but it's best to consult an allergist for proper testing and management.`,
      },
      {
        text: "input: I'm feeling better now.",
      },
      {
        text: `output: That's great to hear, ${userName}! I'm glad you're feeling better. I've updated your health status to reflect your recovery. Remember to continue taking care of yourself and maintain good hydration and nutrition.`,
      }
      // ... (Add your other examples with ${userName} placeholder)
    ];

    // ormat chat history for Gemini (PRESERVED LOGIC)
    const history = (chatHistory || []).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text || "" }],
    }));

    // Combine few-shot examples + chat history (PRESERVED LOGIC)
    const fullHistory = [
      ...parts.map((p, i) => ({
        role: i % 2 === 0 ? "user" : "model",
        parts: [{ text: p.text }]
      })),
      ...history
    ];

    const chat = model.startChat({
      history: fullHistory,
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Send message with enhanced context
    const result = await chat.sendMessage([
      { text: systemInstruction },
      { text: `Current User: ${userName} (${userEmail}). Health status - ${userContext.health?.currentCondition || 'unknown'}. Allergies - ${userContext.health?.allergies?.join(', ') || 'none'}. User message: ${message}` }
    ]);
    
    let responseText = result.response.text();

    // Ensure the response includes the user's name
    // If the AI didn't use the name, prepend it naturally
    if (!responseText.includes(userName) && !responseText.startsWith('I understand') && !responseText.startsWith('That\'s')) {
      responseText = `${userName}, ${responseText.charAt(0).toLowerCase() + responseText.slice(1)}`;
    }

    // Add cross-bot suggestions based on context
    if (userContext.health?.activeIllness) {
      const crossBotSuggestions = `
      
💡 **Cross-Bot Recommendations:**
- Ask the **Recipes Bot** for light, nutritious meals suitable for your condition
- Check the **Weather Bot** to see if weather might be affecting your symptoms
- Use the **Commute Bot** to find the best route to nearby medical facilities`;

      if (!responseText.includes('Recipes Bot') && !responseText.includes('Weather Bot') && !responseText.includes('Commute Bot')) {
        responseText += crossBotSuggestions;
      }
    }

    // Add health status reminder
    if (userContext.health?.activeIllness) {
      const expiryDate = new Date(userContext.health.expiresAt).toLocaleDateString();
      responseText += `\n\n⚠️ **Health Status**: You're currently marked as sick (since ${new Date(userContext.health.startedAt).toLocaleDateString()}). This will auto-reset on ${expiryDate}, or say "I'm fine now" to reset immediately.`;
    }

    res.status(200).json({ 
      response: responseText,
      healthContext: {
        activeIllness: userContext.health?.activeIllness,
        symptoms: userContext.health?.symptoms,
        allergies: userContext.health?.allergies,
        expiresAt: userContext.health?.expiresAt
      }
    });
    
  } catch (error) {
    console.error("Error sending message:", error);
    
    if (error.status === 404) {
      return res.status(500).json({
        error: "AI model not available",
        details: "The model gemini-1.5-flash is deprecated. Use gemini-2.0-flash or gemini-2.0-pro.",
      });
    }
    
    res.status(500).json({ 
      error: "Error sending message", 
      details: error.message 
    });
  }
}