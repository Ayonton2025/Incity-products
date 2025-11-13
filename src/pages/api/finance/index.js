// src/pages/api/finance/index.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Securely get userId from authenticated session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.id;

  const { userMessage, chatHistory } = req.body;
  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "Valid user message is required" });
  }

  try {
    // Enhanced MCP Context Fetching
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const mcpUrl = `${protocol}://${host}/api/mcp/context?userId=${userId}`;

    let userContext = { finance: {}, health: {}, preferences: {} };
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

    // Enhanced Financial Data Extraction from User Message
    let financialUpdates = {};
    const financialPatterns = {
      income: /(salary|income|earn|make)\s*(?:of|₹|rs\.?)?\s*(\d+[,.]?\d*)/i,
      expense: /(spent|spend|expense|cost|paid)\s*(?:₹|rs\.?)?\s*(\d+[,.]?\d*)/i,
      balance: /(balance|have|saved|save)\s*(?:₹|rs\.?)?\s*(\d+[,.]?\d*)/i,
      goal: /(goal|target|need|want)\s*(?:₹|rs\.?)?\s*(\d+[,.]?\d*)/i
    };

    // Extract financial information from user message
    Object.keys(financialPatterns).forEach(type => {
      const match = userMessage.match(financialPatterns[type]);
      if (match) {
        const amount = parseInt(match[2].replace(/[,.]/g, ''));
        if (!isNaN(amount)) {
          switch(type) {
            case 'income':
              financialUpdates.monthlyIncome = amount;
              financialUpdates.totalBalance = (userContext.finance?.totalBalance || 0) + amount;
              break;
            case 'balance':
              financialUpdates.totalBalance = amount;
              break;
            case 'expense':
              // Will be handled in transaction processing
              break;
          }
        }
      }
    });

    // Health-Finance Integration: Check if medical expenses
    const medicalKeywords = ["hospital", "doctor", "medicine", "medical", "treatment", "health", "sick"];
    const isMedicalExpense = medicalKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );

    // Process Transactions and Update MCP
    if (financialUpdates.monthlyIncome || financialUpdates.totalBalance) {
      try {
        await fetch(mcpUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            finance: {
              ...userContext.finance,
              ...financialUpdates,
              lastUpdated: new Date().toISOString()
            }
          }),
        });
        // Update local context
        userContext.finance = { ...userContext.finance, ...financialUpdates };
      } catch (updateError) {
        console.warn("Failed to update finance context:", updateError.message);
      }
    }

    // Enhanced Finance Bot prompt instructions with MCP Context
    const systemInstruction = `
CRITICAL USER FINANCIAL CONTEXT (From MCP Database):
- Current Balance: ₹${userContext.finance?.totalBalance || 0}
- Monthly Income: ₹${userContext.finance?.monthlyIncome || 0}
- Recent Expenses: ${userContext.finance?.recentTransactions?.length || 0} transactions
- Budget Categories: ${userContext.finance?.budget ? Object.keys(userContext.finance.budget).join(", ") : "Not set"}
- Health Status: ${userContext.health?.activeIllness || "Healthy"}

FINANCE BOT CORE RESPONSIBILITIES:

1. **BUDGET MANAGEMENT & CROSS-BOT COORDINATION**
   - Always reference the user's current balance: ₹${userContext.finance?.totalBalance || 0}
   - Coordinate with other bots:
     * **Commute Bot**: "Based on your balance of ₹${userContext.finance?.totalBalance || 0}, I recommend budget-friendly travel options"
     * **Health Bot**: "${userContext.health?.activeIllness ? 'Consider setting aside funds for medical expenses.' : 'Your health expenses seem manageable.'}"
     * **Events Bot**: "With your current balance, here are affordable events"

2. **EXPENSE CATEGORIZATION & ANALYSIS**
   - Needs (50-60%): Rent, food, utilities, healthcare
   - Wants (20-30%): Entertainment, dining out, hobbies
   - Savings (20%): Emergency fund, investments

3. **SMART RECOMMENDATIONS BASED ON CONTEXT**
   - If balance < ₹5000: Focus on essential spending only
   - If medical condition: Prioritize health expenses
   - If high expenses: Suggest cost-cutting measures

4. **TRANSACTION PROCESSING GUIDELINES**
   - Detect amounts in messages: "I spent ₹1000" → Record as expense
   - Detect income: "My salary is ₹50000" → Update monthly income
   - Categorize automatically when possible

5. **CROSS-BOT FINANCIAL CONSTRAINTS**
   - Commute: "This trip costs ₹2000 (40% of your balance) - consider alternatives"
   - Events: "Event ticket ₹1500 - 30% of balance remaining after essentials"
   - Food: "Restaurant budget: ₹${Math.floor((userContext.finance?.totalBalance || 0) * 0.1)} for this week"

RESPONSE STRUCTURE:
1. Acknowledge current financial context
2. Provide specific, actionable advice
3. Suggest coordination with other bots when relevant
4. Include concrete numbers and percentages

EXAMPLE RESPONSES:
"With your current balance of ₹${userContext.finance?.totalBalance || 0}, I recommend:
• Essentials: ₹${Math.floor((userContext.finance?.totalBalance || 0) * 0.6)}
• Discretionary: ₹${Math.floor((userContext.finance?.totalBalance || 0) * 0.3)}
• Savings: ₹${Math.floor((userContext.finance?.totalBalance || 0) * 0.1)}

💡 Ask Commute Bot for travel options within ₹${Math.floor((userContext.finance?.totalBalance || 0) * 0.1)} budget"
`;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    // Enhanced model configuration with fallbacks
    const genAI = new GoogleGenerativeAI(apiKey);
    let model;
    try {
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction,
      });
    } catch (err) {
      console.warn("gemini-2.0-flash not found, using gemini-2.0-pro");
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-pro",
        systemInstruction,
      });
    }

    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: "text/plain",
    };

    // Enhanced chat history with financial context
    let history = (chatHistory || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.parts?.[0] || msg.text || "" }],
    }));

    // Add financial context to the conversation
    if (history.length === 0 || history[0].role !== "user") {
      history.unshift({ 
        role: "user", 
        parts: [{ 
          text: `My current financial situation: Balance ₹${userContext.finance?.totalBalance || 0}, Monthly income ₹${userContext.finance?.monthlyIncome || 0}. ${userContext.health?.activeIllness ? `I also have medical expenses for ${userContext.health.activeIllness}.` : ''}` 
        }] 
      });
    }

    const chat = model.startChat({ generationConfig, history });

    const result = await chat.sendMessage(userMessage);
    let responseText = result.response.text();

    // 💡 ADD CROSS-BOT RECOMMENDATIONS BASED ON FINANCIAL CONTEXT
    let crossBotSuggestions = "";

    // Travel-related suggestions
    if (userMessage.toLowerCase().includes("travel") || userMessage.toLowerCase().includes("trip") || userMessage.toLowerCase().includes("commute")) {
      const travelBudget = Math.floor((userContext.finance?.totalBalance || 0) * 0.3);
      crossBotSuggestions += `\n\n **Travel Planning**: Ask the **Commute Bot** for options within ₹${travelBudget} budget.`;
    }

    // Event-related suggestions
    if (userMessage.toLowerCase().includes("event") || userMessage.toLowerCase().includes("movie") || userMessage.toLowerCase().includes("concert")) {
      const eventBudget = Math.floor((userContext.finance?.totalBalance || 0) * 0.15);
      crossBotSuggestions += `\n\n **Entertainment**: Check **Events Bot** for activities under ₹${eventBudget}.`;
    }

    // Health-related financial planning
    if (userContext.health?.activeIllness) {
      const medicalBudget = Math.floor((userContext.finance?.totalBalance || 0) * 0.2);
      crossBotSuggestions += `\n\n **Health Budget**: Set aside ₹${medicalBudget} for medical expenses. Ask **Health Bot** for cost-effective care options.`;
    }

    // Food budget suggestions
    if (userMessage.toLowerCase().includes("food") || userMessage.toLowerCase().includes("restaurant") || userMessage.toLowerCase().includes("eat")) {
      const foodBudget = Math.floor((userContext.finance?.totalBalance || 0) * 0.1);
      crossBotSuggestions += `\n\n **Dining**: **Recipes Bot** can suggest meals within ₹${foodBudget} daily budget.`;
    }

    // Add cross-bot suggestions if not already present
    if (crossBotSuggestions && !responseText.includes('Commute Bot') && !responseText.includes('Events Bot') && !responseText.includes('Health Bot') && !responseText.includes('Recipes Bot')) {
      responseText += crossBotSuggestions;
    }

    // ADD FINANCIAL HEALTH METRICS
    const balance = userContext.finance?.totalBalance || 0;
    let financialHealth = "";
    
    if (balance < 1000) {
      financialHealth = `\n\n **Financial Alert**: Low balance (₹${balance}). Focus on essential spending only.`;
    } else if (balance < 5000) {
      financialHealth = `\n\n **Budget Careful**: Moderate balance (₹${balance}). Limit discretionary spending.`;
    } else {
      financialHealth = `\n\n **Good Standing**: Healthy balance (₹${balance}). You can plan for some discretionary expenses.`;
    }

    if (!responseText.includes('Financial Alert') && !responseText.includes('Budget Careful') && !responseText.includes('Good Standing')) {
      responseText += financialHealth;
    }

    // UPDATE TRANSACTIONS IF EXPENSE DETECTED
    const expenseMatch = userMessage.match(/(?:spent|spend|expense|cost|paid)\s*(?:₹|rs\.?)?\s*(\d+[,.]?\d*)/i);
    if (expenseMatch) {
      const amount = parseInt(expenseMatch[1].replace(/[,.]/g, ''));
      if (!isNaN(amount)) {
        try {
          const newBalance = (userContext.finance?.totalBalance || 0) - amount;
          await fetch(mcpUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              finance: {
                ...userContext.finance,
                totalBalance: newBalance,
                recentTransactions: [
                  {
                    type: "expense",
                    amount: amount,
                    category: isMedicalExpense ? "healthcare" : "general",
                    description: `Expense: ${userMessage.substring(0, 50)}...`,
                    date: new Date().toISOString()
                  },
                  ...(userContext.finance?.recentTransactions || []).slice(0, 9)
                ]
              }
            }),
          });
        } catch (transactionError) {
          console.warn("Failed to record transaction:", transactionError.message);
        }
      }
    }

    return res.status(200).json({ 
      responseText,
      financialContext: {
        currentBalance: userContext.finance?.totalBalance || 0,
        monthlyIncome: userContext.finance?.monthlyIncome || 0,
        financialHealth: balance < 1000 ? "critical" : balance < 5000 ? "moderate" : "healthy",
        crossBotSuggestions: crossBotSuggestions ? true : false
      }
    });
    
  } catch (error) {
    console.error("Finance Bot Error:", error);
    res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
}