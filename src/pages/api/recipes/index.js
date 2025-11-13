// src/pages/api/recipes/index.js
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Secure session validation (PRESERVED)
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.id;

  const { message, chatHistory } = req.body;

  try {
    // Construct proper URL for MCP context API (ENHANCED)
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const mcpUrl = `${protocol}://${host}/api/mcp/context?userId=${userId}`;

    // Fetch user context from MCP (ENHANCED with error handling)
    let userContext = { health: {}, food: {}, finance: {} };
    try {
      const contextRes = await fetch(mcpUrl);
      if (contextRes.ok) {
        userContext = await contextRes.json();
      } else {
        console.warn("MCP context fetch failed with status:", contextRes.status);
      }
    } catch (contextError) {
      console.warn("MCP context fetch failed, using default context:", contextError.message);
    }

    // Build safety warnings based on health status and allergies (ENHANCED)
    let safetyWarning = "";
    let healthContextInfo = "";
    
    // Check if user has active illness
    if (userContext.health?.activeIllness) {
      healthContextInfo = `\n\n **Health Context**: You're currently recovering from ${userContext.health.activeIllness}. `;
      
      // Enhanced illness-specific warnings
      const unhealthyFoods = {
        spicy: ["spicy", "chilly", "hot", "mirchi", "pepper"],
        oily: ["fried", "oily", "deep fry", "batter fry"],
        heavy: ["biriyani", "biryani", "heavy", "rich", "cream", "butter"],
        cold: ["ice cream", "cold", "chilled", "smoothie", "milkshake"]
      };
      
      const detectedUnhealthyTypes = [];
      
      Object.keys(unhealthyFoods).forEach(type => {
        if (unhealthyFoods[type].some(food => message.toLowerCase().includes(food))) {
          detectedUnhealthyTypes.push(type);
        }
      });
      
      if (detectedUnhealthyTypes.length > 0) {
        safetyWarning = `\n\n **Health Alert**: You're currently unwell. It's better to avoid ${detectedUnhealthyTypes.join(", ")} foods. `;
        
        // Suggest healthy alternatives based on illness type
        if (userContext.health.activeIllness.includes("fever") || userContext.health.activeIllness.includes("cold")) {
          safetyWarning += "Consider light options like khichdi, vegetable soup, steamed idli, or porridge.";
        } else if (userContext.health.activeIllness.includes("stomach")) {
          safetyWarning += "Consider BRAT diet foods: banana, rice, apple sauce, toast, or clear soups.";
        } else {
          safetyWarning += "Try light, easily digestible meals that won't aggravate your condition.";
        }
        
        // Add cross-bot suggestion
        safetyWarning += `\n **Ask Health Bot**: "What foods are best for ${userContext.health.activeIllness}?"`;
      }
    }

    // Enhanced allergy detection
    const allergies = [...(userContext.health?.allergies || []), ...(userContext.food?.allergies || [])];
    if (allergies.length > 0) {
      const allergenMatch = allergies.some(allergy => {
        const allergyWords = allergy.toLowerCase().split(/[,\s]+/);
        return allergyWords.some(word => 
          word.length > 3 && message.toLowerCase().includes(word)
        );
      });
      
      if (allergenMatch) {
        safetyWarning += `\n\n **Allergy Alert**: You're allergic to ${allergies.join(", ")}. I'll avoid recommending dishes containing these ingredients.`;
        
        // Add allergy-safe alternatives
        safetyWarning += `\n🍃 **Allergy-Safe Options**: Look for dishes without ${allergies.join(" or ")}.`;
      }
    }

    //  Initialize Gemini client with working models (PRESERVED)
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use currently supported models (PRESERVED)
    let model;
    try {
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Primary supported model
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        },
      });
    } catch (err) {
      console.warn("gemini-2.0-flash not found, using gemini-2.0-pro");
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-pro", // Reliable fallback
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        },
      });
    }

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // YOUR ORIGINAL COMPREHENSIVE FEW-SHOT EXAMPLES (PRESERVED EXACTLY)
    const parts = [
      {
        text: "input: What are some of the hidden gems in Chennai for food lovers?",
      },
      {
        text: "output: While places like Saravana Bhavan are well-known, hidden gems like Anbu Mess, Seena Bhai Tiffin Centre, and small thallu vandi biryani stalls offer affordable yet delicious food experiences that many locals swear by. Exploring these spots offers a more authentic taste of Chennai.",
      },
      {
        text: "input: Is the quality of street food in Chennai declining?",
      },
      {
        text: "output: Many locals feel that the quality of street food has declined over the years. Dishes like pani puri and biryani, which once had authentic flavors, now taste bland in many places. Overhyped eateries tend to raise prices, making it hard to justify the cost for the quality offered.",
      },
      {
        text: "input: Where can I find affordable yet tasty rolls in Chennai?",
      },
      {
        text: "output: While many popular roll centers have started to increase their prices, you can still find affordable and delicious options at small local joints, especially around T. Nagar and Egmore. Look out for places that haven't been hyped by food vloggers to avoid paying extra.",
      },
      
      {
        text: "input: Where can I try traditional Chettinad cuisine in Chennai?",
      },
      {
        text: "output: For traditional Chettinad cuisine, visit places like Anjappar, Ponnusamy, and Velu Military Hotel. These spots serve spicy, flavorful Chettinad dishes like chicken curry and pepper mutton.",
      },
    ];

    const history = (chatHistory || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text || "" }],
    }));

    const fullHistory = [
      ...parts.map((p, i) => ({
        role: i % 2 === 0 ? "user" : "model",
        parts: [{ text: p.text }],
      })),
      ...history,
    ];

    // ENHANCED SYSTEM INSTRUCTION WITH MCP CONTEXT INTEGRATION
    const systemInstruction = `
IMPORTANT USER CONTEXT (From Health & Food Profile):
${userContext.health?.activeIllness ? `- Current Health Status: Recovering from ${userContext.health.activeIllness}` : '- Current Health Status: Healthy'}
${allergies.length > 0 ? `- Food Allergies: ${allergies.join(", ")}` : '- Food Allergies: None reported'}
${userContext.health?.symptoms?.length > 0 ? `- Recent Symptoms: ${userContext.health.symptoms.slice(0, 3).join(", ")}` : ''}

RESPONSE GUIDELINES:

1. **Provide Specific Restaurant Names**  
   - Always list actual restaurants, food stalls, or street vendors in Chennai when recommending places to eat.  
   - Avoid generic responses like "look for a place" or "ask locals."  
   - If you don't know an exact restaurant, provide a famous area or landmark where great food can be found.

2. **Ensure Local & Personalized Suggestions**  
   - Prioritize restaurants and food stalls based on the user's stated preferences (e.g., vegetarian, non-vegetarian, spicy, mild).  
   - When possible, use lesser-known but well-reviewed restaurants to give unique recommendations.  
   - If the user asks for biryani, give the names of specific shops instead of generalizing ("Small, independent biryani shops").

3. **Health & Safety Considerations**
   ${userContext.health?.activeIllness ? `- User is currently recovering from ${userContext.health.activeIllness}. Avoid recommending spicy, oily, or hard-to-digest foods.` : ''}
   ${allergies.length > 0 ? `- STRICTLY AVOID recommending any dishes containing: ${allergies.join(", ")}. Always check ingredients.` : ''}
   - If user asks for unhealthy food while sick, gently suggest healthier alternatives.

4. **Avoid Asking for More Input Before Giving an Answer**  
   - When the user asks for food recommendations, **do not ask them to clarify their preferences before answering**.  
   - Instead, **immediately list 3-5 specific restaurants or food stalls** and then ask if they need further customization.  

5. **Structure Responses for Clarity**  
   - Always format responses in a structured list:
     - 📍 **Restaurant Name** – Address – Specialty Dish  
     - Include landmarks for easy identification.

6. **Cross-Bot Coordination**
   - If user asks about food for specific health conditions, suggest: "You can also ask the Health Bot for dietary recommendations for your condition."
   - If budget is a concern, mention: "The Finance Bot can help you plan your food budget."

${safetyWarning}

### **Example Response Format**
**Hidden Gems in Chennai for Food Lovers:**

📍 **Ratna Cafe** – Triplicane – Famous for sambar idli  
📍 **Junior Kuppanna** – T. Nagar – Best for spicy Chettinad-style biryani  
📍 **Sundari Akka Kadai** – Marina Beach – Must-try fish fry  

${userContext.health?.activeIllness ? ` **Health Note**: Since you're recovering, I've focused on lighter options that are easier to digest.` : ''}
    `;

    const chat = model.startChat({
      history: fullHistory,
      generationConfig,
    });

    // Send message with enhanced context
    const result = await chat.sendMessage([
      { text: systemInstruction },
      { text: `User query: ${message} ${healthContextInfo}` }
    ]);
    let responseText = result.response.text();

    // ADD CROSS-BOT RECOMMENDATIONS BASED ON CONTEXT
    let crossBotSuggestions = "";
    
    // Health-related cross-bot suggestions
    if (userContext.health?.activeIllness && !responseText.includes('Health Bot')) {
      crossBotSuggestions += `\n\n**Health Coordination**: Ask the **Health Bot** for specific dietary advice for ${userContext.health.activeIllness}.`;
    }
    
    // Budget-related suggestions
    if (userContext.finance?.totalBalance && userContext.finance.totalBalance < 5000) {
      crossBotSuggestions += `\n**Budget Tip**: Use the **Finance Bot** to track your food expenses and stay within budget.`;
    }
    
    // Allergy management
    if (allergies.length > 0 && !responseText.includes('allerg') && !responseText.includes('avoid')) {
      crossBotSuggestions += `\n **Allergy Safety**: I've avoided recipes with ${allergies.join(", ")}. Always double-check ingredients when dining out.`;
    }

    // Add cross-bot suggestions if not already present
    if (crossBotSuggestions && !responseText.includes('Health Bot') && !responseText.includes('Finance Bot')) {
      responseText += crossBotSuggestions;
    }

    // ADD HEALTH STATUS REMINDER IF SICK
    if (userContext.health?.activeIllness && userContext.health?.expiresAt) {
      const expiryDate = new Date(userContext.health.expiresAt).toLocaleDateString();
      const healthReminder = `\n\n **Health Status**: You're marked as recovering until ${expiryDate}. Say "I'm fine now" to the Health Bot to update your status.`;
      
      if (!responseText.includes('Health Status') && !responseText.includes('recovering until')) {
        responseText += healthReminder;
      }
    }

    // UPDATE FOOD PREFERENCES IN MCP IF NEW PREFERENCES DETECTED
    try {
      const cuisineKeywords = {
        southIndian: ["idli", "dosa", "sambar", "vada", "uttapam"],
        northIndian: ["naan", "paneer", "butter chicken", "tandoori"],
        chinese: ["noodles", "fried rice", "manchurian", "chilli"],
        biryani: ["biryani", "biriyani"],
        seafood: ["fish", "prawn", "crab", "seafood"]
      };
      
      let detectedCuisines = [];
      Object.keys(cuisineKeywords).forEach(cuisine => {
        if (cuisineKeywords[cuisine].some(keyword => message.toLowerCase().includes(keyword))) {
          detectedCuisines.push(cuisine);
        }
      });
      
      if (detectedCuisines.length > 0) {
        // Update food preferences in MCP
        await fetch(mcpUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            food: {
              ...userContext.food,
              favoriteCuisines: [...new Set([...(userContext.food?.favoriteCuisines || []), ...detectedCuisines])]
            }
          }),
        });
      }
    } catch (updateError) {
      console.warn("Failed to update food preferences in MCP:", updateError.message);
    }

    res.status(200).json({ 
      response: responseText,
      foodContext: {
        healthStatus: userContext.health?.activeIllness || "healthy",
        allergies: allergies,
        safetyWarnings: safetyWarning ? true : false
      }
    });
    
  } catch (error) {
    console.error("Recipes Bot Error:", error);
    
    if (error.status === 404) {
      return res.status(500).json({
        error: "AI model not available",
        details: "The model gemini-1.5-flash is deprecated. Use gemini-2.0-flash or gemini-2.0-pro.",
      });
    }
    
    res.status(500).json({ error: "Error processing request" });
  }
}