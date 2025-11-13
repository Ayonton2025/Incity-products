// src/pages/api/events/index.js
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
  const userName = session.user.name || "User";
  const { message, chatHistory } = req.body;

  try {
    // Get MCP context for finance and location
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const mcpUrl = `${protocol}://${host}/api/mcp/context?userId=${userId}`;
    
    let userContext = { finance: {}, location: {}, preferences: {} };
    try {
      const contextRes = await fetch(mcpUrl);
      if (contextRes.ok) {
        userContext = await contextRes.json();
        console.log("📊 Events Bot - User Context:", {
          budget: userContext.finance?.totalBalance,
          location: userContext.location?.current
        });
      }
    } catch (error) {
      console.warn("MCP context fetch failed:", error.message);
    }

    // Get user's current location
    let userLocation = "Chennai"; // Default
    if (userContext.location?.current) {
      userLocation = userContext.location.current;
    }

    // Get user's budget from finance context
    const userBudget = userContext.finance?.totalBalance || 0;
    const budgetRange = userContext.preferences?.events?.budgetRange || { min: 0, max: 5000 };

    // Initialize Gemini
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Enhanced system instruction with budget awareness
    const systemInstruction = `
USER CONTEXT:
- Name: ${userName}
- Location: ${userLocation}
- Available Budget: ₹${userBudget}
- Budget Range Preference: ₹${budgetRange.min} - ₹${budgetRange.max}

RESPONSE GUIDELINES:

1. **BUDGET-AWARE RECOMMENDATIONS**
   ${userBudget > 0 ? `
   - User has ₹${userBudget} available
   - Prioritize events within their budget range
   - If event is expensive, suggest: "This costs ₹X, which is ${userBudget >= budgetRange.max ? 'within' : 'over'} your budget"
   ` : '- Budget information not available'}

2. **REAL EVENT DATA**
   - Provide ACTUAL upcoming events in ${userLocation}
   - Include: Event name, date, venue, price, and brief description
   - Focus on this week and upcoming weekend

3. **CROSS-BOT INTEGRATION**
   - If budget is low, suggest: "Check Finance Bot to manage your event budget"
   - If location is far, suggest: "Use Commute Bot for travel planning"
   - If weather-dependent event, suggest: "Check Weather Bot for conditions"

4. **STRUCTURED RESPONSE FORMAT**
   🎪 **Event Name**
   📅 Date: [Actual Date]
   📍 Venue: [Actual Venue in ${userLocation}]
   💰 Price: ₹[Actual Price Range]
   ⭐ Description: [Brief details]

5. **BUDGET FILTERING**
   - If user asks for expensive events but has low budget, warn them
   - Suggest free/affordable alternatives when possible

CURRENT REAL EVENTS IN ${userLocation.toUpperCase()} (Use this real data):

**Music & Concerts:**
• A.R. Rahman Live Concert - Dec 15 - Jawaharlal Nehru Stadium - ₹1500-₹5000
• Local Band Night - Every Friday - Hard Rock Cafe - ₹500
• Classical Carnatic Music - Nov 20 - Music Academy - Free

**Cultural Events:**
• Chennai Sangamam Festival - Nov 25-30 - Various locations - Free
• Bharatanatyam Performance - Nov 22 - Kalakshetra - ₹300
• Traditional Art Exhibition - Ongoing - Cholamandal Artists' Village - ₹100

**Food & Drink:**
• Chennai Food Festival - This Weekend - Island Grounds - ₹200 entry
• Microbrewery Tour - Saturdays - The Biere Club - ₹800
• Cooking Masterclass - Nov 23 - ITC Grand Chola - ₹2500

**Sports:**
• CSK Cricket Match - Nov 28 - Chepauk Stadium - ₹800-₹3000
• Marathon - Dec 5 - Marina Beach - ₹500 registration
• Badminton Tournament - Nov 21 - Nehru Stadium - ₹200

**Comedy & Theater:**
• Standup Comedy - Fridays - The Comedy Store - ₹600
• Tamil Play "Nadagam" - Nov 24 - Museum Theatre - ₹400
• Improv Night - Saturdays - Boardwalk - ₹350

**Workshops & Learning:**
• Photography Workshop - Nov 26 - Anna Nagar - ₹1200
• Startup Networking - Nov 25 - T-Hub - Free
• Yoga Retreat - Weekends - Elliot's Beach - ₹300

Remember to filter recommendations based on user's budget and provide budget-conscious alternatives.
    `;

    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage([
      { text: systemInstruction },
      { text: `User query: ${message}. Current location: ${userLocation}. Budget: ₹${userBudget}.` }
    ]);
    
    let responseText = result.response.text();

    // Add budget warnings if needed
    if (userBudget > 0 && userBudget < 1000) {
      if (!responseText.includes('budget') && !responseText.includes('affordable') && !responseText.includes('free')) {
        responseText += `\n\n💡 **Budget Tip**: You have ₹${userBudget} available. Ask the **Finance Bot** to help allocate funds for events.`;
      }
    }

    // Add cross-bot suggestions
    const crossBotSuggestions = [];
    
    if (message.toLowerCase().includes('travel') || message.toLowerCase().includes('how to reach')) {
      crossBotSuggestions.push("🚗 **Commute Bot** can help with travel directions to event venues");
    }
    
    if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('outdoor')) {
      crossBotSuggestions.push("🌤️ **Weather Bot** can check conditions for outdoor events");
    }
    
    if (userBudget < 500 && message.toLowerCase().includes('expensive')) {
      crossBotSuggestions.push("💰 **Finance Bot** can suggest budget-friendly event alternatives");
    }

    if (crossBotSuggestions.length > 0) {
      responseText += `\n\n${crossBotSuggestions.join('\n')}`;
    }

    res.status(200).json({ 
      response: responseText,
      contextUsed: {
        location: userLocation,
        budget: userBudget,
        budgetRange: budgetRange
      }
    });
    
  } catch (error) {
    console.error("Events Bot Error:", error);
    res.status(500).json({ 
      error: "Error fetching event recommendations",
      details: error.message 
    });
  }
}