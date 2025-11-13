// src/pages/api/products/index.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

const handler = async (req, res) => {
  if (req.method === "POST") {
    try {
      // 🔒 Secure session validation
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = session.user.id;

      // 🔄 Fetch user context from MCP
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const mcpUrl = `${protocol}://${host}/api/mcp/context?userId=${userId}`;
      
      let userContext = { finance: {}, health: {}, preferences: {} };
      try {
        const contextRes = await fetch(mcpUrl);
        if (contextRes.ok) {
          userContext = await contextRes.json();
        }
      } catch (contextError) {
        console.warn("MCP context fetch failed:", contextError.message);
      }

      const { prompt, imageParts } = req.body;
      
      const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      };

      // ✅ Enhanced System Instruction with MCP Context Integration
      const systemInstruction = `
CRITICAL USER CONTEXT (From MCP Database):
- Current Budget: ₹${userContext.finance?.totalBalance || 'Not specified'}
- Financial Health: ${userContext.finance?.totalBalance ? (userContext.finance.totalBalance < 5000 ? 'Budget-conscious' : 'Flexible budget') : 'Unknown'}
- Health Status: ${userContext.health?.activeIllness || 'Healthy'}
- Allergies: ${userContext.health?.allergies?.join(', ') || 'None reported'}

PRODUCT ANALYSIS BOT - ENHANCED INSTRUCTIONS:

Objective: Analyze images of rooms to identify empty spaces and recommend suitable products that enhance the environment while considering user's financial context and preferences.

1. **Context-Aware Analysis**:
   - Consider user's budget: ${userContext.finance?.totalBalance ? `₹${userContext.finance.totalBalance}` : 'Flexible'}
   - Prioritize affordable options if budget is limited
   - Consider health context: ${userContext.health?.activeIllness ? `User is recovering from ${userContext.health.activeIllness}` : 'No health constraints'}

2. **Smart Product Filtering**:
   - If budget < ₹5000: Focus on products under ₹1000
   - If budget ₹5000-₹20000: Include mid-range products (₹1000-₹5000)
   - If budget > ₹20000: Can include premium products
   - AVOID products containing allergens: ${userContext.health?.allergies?.join(', ') || 'None'}

3. **Enhanced Product Recommendations**:
   Each recommendation MUST include:
   - 'name': Product name
   - 'imageLink': Realistic product image URL
   - 'productLink': Actual purchase link (preferably Amazon, Flipkart, or local Chennai stores)
   - 'description': Brief product description
   - 'benefitExplanation': How it enhances the specific space in the image
   - 'shopName': Local Chennai shop name
   - 'shopAddress': Actual Chennai address
   - 'price': Realistic price in INR
   - 'budgetCategory': 'budget' | 'mid-range' | 'premium'
   - 'priorityLevel': 1-5 (1=essential, 5=luxury)

4. **Local Chennai Market Focus**:
   - Only recommend products available in Chennai local shops
   - Use real shop names and addresses in Chennai
   - Consider Chennai's climate and cultural preferences

5. **Output Format**: Provide ONLY a raw JSON array without any additional text.
   Structure: [{
     "name": "Product Name",
     "imageLink": "https://real-image-url.com/product.jpg",
     "productLink": "https://purchase-link.com",
     "description": "Product description",
     "benefitExplanation": "How it benefits this specific space",
     "shopName": "Actual Chennai Shop",
     "shopAddress": "Real Chennai address",
     "price": "₹1,500",
     "budgetCategory": "mid-range",
     "priorityLevel": 3
   }]

6. **Safety & Relevance**:
   - Culturally appropriate for Chennai
   - Practical for Indian households
   - Weather-appropriate for Chennai climate
   - Budget-aware for user's financial situation

Budget Allocation Guide:
- Essential items (priority 1-2): Should be affordable
- Improvement items (priority 3): Mid-range pricing
- Luxury items (priority 4-5): Only if budget allows

Current User Budget Context: ${userContext.finance?.totalBalance ? `₹${userContext.finance.totalBalance} available` : 'Budget not specified - recommend affordable options'}
`;

      // ✅ USE CORRECT, AVAILABLE MODELS WITH FALLBACKS
      let model;
      try {
        // Try the latest available models
        model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash", // ✅ Primary - confirmed working
          generationConfig,
          systemInstruction,
        });
      } catch (err) {
        console.warn("gemini-2.0-flash failed, trying gemini-1.5-flash-8b:", err.message);
        try {
          model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-8b", // ✅ Fallback option
            generationConfig,
            systemInstruction,
          });
        } catch (err2) {
          console.warn("gemini-1.5-flash-8b failed, trying gemini-1.0-pro:", err2.message);
          model = genAI.getGenerativeModel({
            model: "gemini-1.0-pro", // ✅ Final fallback
            generationConfig,
            systemInstruction,
          });
        }
      }

      // ✅ Enhanced parts with better examples
      const parts = [
        { 
          text: "Suggest me some affordable products for this kitchen in Chennai. My budget is limited." 
        },
        { 
          text: "Image: [kitchen image data]" 
        },
        {
          text: `[{
            "name": "Stainless Steel Spice Rack",
            "imageLink": "https://example.com/spice-rack.jpg",
            "productLink": "https://amazon.in/stainless-steel-spice-rack",
            "description": "Compact 3-tier stainless steel spice organizer",
            "benefitExplanation": "Maximizes vertical space in small Chennai kitchens while keeping spices accessible",
            "shopName": "Chennai Kitchen Essentials",
            "shopAddress": "45 Pondy Bazaar, T Nagar, Chennai",
            "price": "₹450",
            "budgetCategory": "budget",
            "priorityLevel": 2
          }]`
        },
        { 
          text: prompt 
        },
        { 
          text: "Image: " 
        },
        imageParts,
      ];

      console.log("Sending request to Gemini API...");
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
      });

      let parsedResponse;
      try {
        const responseText = result.response.text();
        console.log("Raw AI Response:", responseText);
        
        // Clean the response - remove any markdown formatting
        const cleanResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
        parsedResponse = JSON.parse(cleanResponse);
        
        // ✅ Enhance response with MCP context and cross-bot suggestions
        const enhancedResponse = {
          products: parsedResponse,
          context: {
            budgetAware: userContext.finance?.totalBalance ? true : false,
            userBudget: userContext.finance?.totalBalance || null,
            healthConsiderations: userContext.health?.allergies?.length > 0 ? userContext.health.allergies : null,
            totalRecommendations: parsedResponse.length
          },
          recommendations: {
            budgetSummary: generateBudgetSummary(parsedResponse, userContext.finance?.totalBalance),
            crossBotSuggestions: generateCrossBotSuggestions(parsedResponse, userContext)
          }
        };

        // ✅ Record product interest in MCP for future personalization
        try {
          const productCategories = parsedResponse.map(product => 
            product.budgetCategory || 'general'
          );
          
          await fetch(mcpUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              preferences: {
                ...userContext.preferences,
                productInterests: [...new Set([
                  ...(userContext.preferences?.productInterests || []),
                  ...productCategories
                ])],
                lastProductSearch: new Date().toISOString()
              }
            }),
          });
        } catch (updateError) {
          console.warn("Failed to update product preferences:", updateError.message);
        }

        console.log("Successfully processed products response");
        res.status(200).json(enhancedResponse);

      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.log("Raw response that failed to parse:", result.response.text());
        
        // Fallback: Try to extract JSON from text response
        const textResponse = result.response.text();
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            res.status(200).json({ products: parsedResponse });
          } catch (e) {
            // If still failing, return fallback suggestions
            console.error("Even extracted JSON failed to parse:", e);
            res.status(200).json({
              products: getFallbackSuggestions(),
              note: "Using fallback suggestions due to parsing issues"
            });
          }
        } else {
          // No JSON found, return fallback
          res.status(200).json({
            products: getFallbackSuggestions(),
            note: "AI response format issue, using fallback suggestions"
          });
        }
      }

    } catch (error) {
      console.error("Products Bot Error:", error);
      
      // Provide more specific error messages
      if (error.status === 404) {
        res.status(500).json({ 
          error: "AI model not available",
          details: "The requested Gemini model is not available. Please check model availability.",
          fallbackSuggestions: getFallbackSuggestions()
        });
      } else if (error.status === 403) {
        res.status(500).json({ 
          error: "API key invalid or quota exceeded",
          details: "Check your Gemini API key configuration and billing",
          fallbackSuggestions: getFallbackSuggestions()
        });
      } else {
        res.status(500).json({ 
          error: "Failed to analyze product image",
          details: error.message,
          fallbackSuggestions: getFallbackSuggestions()
        });
      }
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// ✅ Helper function to generate budget summary
function generateBudgetSummary(products, userBudget) {
  const totalCost = products.reduce((sum, product) => {
    const price = parseInt(product.price?.replace(/[₹,]/g, '') || '0');
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  let budgetAdvice = "";
  if (userBudget) {
    const percentage = (totalCost / userBudget) * 100;
    if (percentage > 50) {
      budgetAdvice = `⚠️ These products cost ${percentage.toFixed(1)}% of your budget. Consider prioritizing essential items.`;
    } else if (percentage > 25) {
      budgetAdvice = `💰 These products cost ${percentage.toFixed(1)}% of your budget. Manageable for most users.`;
    } else {
      budgetAdvice = `✅ These products cost only ${percentage.toFixed(1)}% of your budget. Well within your means.`;
    }
  }

  const prices = products.map(p => parseInt(p.price?.replace(/[₹,]/g, '') || '0')).filter(p => !isNaN(p));
  
  return {
    totalEstimatedCost: totalCost,
    budgetAdvice,
    productCount: products.length,
    budgetRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    }
  };
}

// ✅ Helper function to generate cross-bot suggestions
function generateCrossBotSuggestions(products, userContext) {
  const suggestions = [];
  const totalCost = products.reduce((sum, product) => {
    const price = parseInt(product.price?.replace(/[₹,]/g, '') || '0');
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  // Finance Bot suggestions
  if (totalCost > 2000) {
    suggestions.push({
      bot: "Finance Bot",
      message: "Plan your purchase with the Finance Bot to manage this expense effectively.",
      priority: "high"
    });
  }

  // Health Bot suggestions (if health context exists)
  if (userContext.health?.activeIllness) {
    suggestions.push({
      bot: "Health Bot",
      message: `Check if these products are suitable while recovering from ${userContext.health.activeIllness}.`,
      priority: "medium"
    });
  }

  // Recipes Bot suggestions for kitchen products
  const kitchenKeywords = ["kitchen", "cook", "spice", "utensil", "storage"];
  const hasKitchenProducts = products.some(product => 
    kitchenKeywords.some(keyword => 
      product.name?.toLowerCase().includes(keyword) || 
      product.description?.toLowerCase().includes(keyword)
    )
  );

  if (hasKitchenProducts) {
    suggestions.push({
      bot: "Recipes Bot",
      message: "Get kitchen organization tips and recipe ideas that complement your new products.",
      priority: "low"
    });
  }

  return suggestions;
}

// ✅ Fallback suggestions when AI fails
function getFallbackSuggestions() {
  return [
    {
      name: "Modular Wall Shelves",
      imageLink: "https://example.com/fallback-shelves.jpg",
      productLink: "https://amazon.in/wall-shelves",
      description: "Space-saving wall shelves for organized storage",
      benefitExplanation: "Utilizes vertical space efficiently in compact Chennai homes",
      shopName: "Chennai Furniture Mart",
      shopAddress: "78 Mount Road, Chennai",
      price: "₹1,200",
      budgetCategory: "budget",
      priorityLevel: 2
    },
    {
      name: "LED Desk Lamp",
      imageLink: "https://example.com/led-lamp.jpg",
      productLink: "https://amazon.in/led-desk-lamp",
      description: "Energy-efficient LED lamp with adjustable brightness",
      benefitExplanation: "Provides optimal lighting for workspaces while saving electricity",
      shopName: "Chennai Electronics Hub",
      shopAddress: "23 Ritchie Street, Chennai",
      price: "₹800",
      budgetCategory: "budget",
      priorityLevel: 3
    }
  ];
}

export default handler;