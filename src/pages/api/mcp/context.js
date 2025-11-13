// src/pages/api/mcp/context.js - COMPLETE UPDATED VERSION
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (req.method === "GET") {
    try {
      const userContext = await redis.get(`user:${userId}:context`);
      const context = userContext || getDefaultContext();
      
      console.log("📥 GET MCP Context for", userId, ":", {
        health: context.health?.currentCondition,
        budget: context.finance?.totalBalance,
        location: context.location?.current,
        eventsInterests: context.preferences?.events?.interests
      });
      
      return res.status(200).json(context);
    } catch (error) {
      console.error("MCP GET Error:", error);
      return res.status(500).json({ error: "Failed to fetch user context" });
    }
  }

  if (req.method === "POST") {
    try {
      const updates = req.body;
      const currentContext = await redis.get(`user:${userId}:context`) || getDefaultContext();
      
      // Deep merge updates
      const updatedContext = deepMerge(currentContext, updates);
      
      // Auto-calculate budget for events if finance data is updated
      if (updates.finance && updates.finance.totalBalance !== undefined) {
        updatedContext.preferences.events.budgetRange.max = 
          Math.min(5000, Math.max(0, updates.finance.totalBalance * 0.2)); // Max 20% of balance for events
      }
      
      // Auto-expire health status if outdated
      if (updatedContext.health?.expiresAt && new Date(updatedContext.health.expiresAt) < new Date()) {
        updatedContext.health = {
          ...updatedContext.health,
          activeIllness: null,
          symptoms: [],
          startedAt: null,
          expiresAt: null,
          currentCondition: "healthy"
        };
        console.log("🔄 Auto-reset health status for", userId);
      }
      
      await redis.set(`user:${userId}:context`, updatedContext);
      
      console.log("💾 UPDATED MCP Context for", userId, ":", {
        health: updatedContext.health?.currentCondition,
        budget: updatedContext.finance?.totalBalance,
        eventsBudget: updatedContext.preferences?.events?.budgetRange,
        eventsInterests: updatedContext.preferences?.events?.interests
      });
      
      return res.status(200).json(updatedContext);
    } catch (error) {
      console.error("MCP POST Error:", error);
      return res.status(500).json({ error: "Failed to update user context" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

function getDefaultContext() {
  return {
    health: {
      activeIllness: null,
      symptoms: [],
      allergies: [],
      startedAt: null,
      expiresAt: null,
      currentCondition: "healthy",
      medications: [],
      doctorVisits: [],
      recoveryProgress: 0
    },
    food: {
      dietaryPreferences: [],
      allergies: [],
      favoriteCuisines: [],
      restrictions: [],
      temporaryRestrictions: false
    },
    finance: {
      totalBalance: 0,
      monthlyIncome: 0,
      expenses: [],
      budget: {
        needs: 0,
        wants: 0,
        savings: 0,
        travel: 0,
        entertainment: 0
      },
      recentTransactions: [],
      spendingPatterns: {},
      tripBudget: 0
    },
    location: {
      current: "Chennai", // Default to Chennai
      home: null,
      work: null,
      lastKnown: null,
      preferredCity: "Chennai"
    },
    preferences: {
      commute: {
        preferredMode: "balanced",
        budgetConscious: true,
        maxTravelTime: 60, // minutes
        avoidTolls: false
      },
      events: {
        interests: ["music", "food", "sports", "culture"], // Default interests
        budgetRange: { min: 0, max: 5000 },
        preferredTypes: ["concerts", "festivals", "workshops"],
        frequency: "weekly",
        groupSize: 1,
        preferredDays: ["saturday", "sunday"]
      },
      general: {
        notificationEnabled: true,
        language: "english",
        theme: "dark"
      }
    },
    // ENHANCED: Events-specific tracking
    eventsHistory: {
      attended: [],
      interested: [],
      budgetSpent: 0,
      lastEventDate: null,
      favoriteVenues: [],
      avoidedEvents: []
    },
    // ENHANCED: Bot communication tracking
    botInteractions: {
      lastHealthUpdate: null,
      lastFinanceCheck: null,
      lastEventsSearch: null,
      lastRecipeCheck: null,
      lastCommutePlan: null,
      lastWeatherCheck: null,
      crossBotRecommendations: [],
      pendingActions: []
    },
    // ENHANCED: User profile
    profile: {
      age: null,
      occupation: null,
      hobbies: [],
      familySize: 1,
      hasVehicle: false,
      dietaryRestrictions: []
    }
  };
}

function deepMerge(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

// Helper function to check event affordability
export async function checkEventAffordability(userId, eventCost) {
  try {
    const userContext = await redis.get(`user:${userId}:context`) || getDefaultContext();
    const availableBudget = userContext.finance?.totalBalance || 0;
    const eventBudget = userContext.preferences?.events?.budgetRange?.max || 5000;
    
    const canAffordFromTotal = availableBudget >= eventCost;
    const canAffordFromEventBudget = eventCost <= eventBudget;
    const budgetPercentage = availableBudget > 0 ? (eventCost / availableBudget * 100).toFixed(1) : 0;
    
    return {
      canAfford: canAffordFromTotal && canAffordFromEventBudget,
      availableBudget,
      eventBudget,
      eventCost,
      budgetPercentage,
      recommendation: canAffordFromTotal && canAffordFromEventBudget 
        ? `✅ Affordable (${budgetPercentage}% of total budget)`
        : `❌ Too expensive (${budgetPercentage}% of total budget)`,
      suggestion: canAffordFromTotal && canAffordFromEventBudget 
        ? "You can attend this event within your budget"
        : canAffordFromTotal 
          ? "Event exceeds your entertainment budget but you have overall funds"
          : "Consider cheaper alternatives or save more"
    };
  } catch (error) {
    console.error("Event affordability check failed:", error);
    return {
      canAfford: false,
      availableBudget: 0,
      eventBudget: 5000,
      eventCost,
      budgetPercentage: 0,
      recommendation: "❌ Budget check unavailable",
      suggestion: "Check Finance Bot to set your budget"
    };
  }
}

// Helper function to update events history
export async function updateEventsHistory(userId, eventData) {
  try {
    const userContext = await redis.get(`user:${userId}:context`) || getDefaultContext();
    
    const updatedContext = {
      ...userContext,
      eventsHistory: {
        ...userContext.eventsHistory,
        attended: [...userContext.eventsHistory.attended, eventData],
        budgetSpent: userContext.eventsHistory.budgetSpent + (eventData.cost || 0),
        lastEventDate: new Date().toISOString()
      },
      finance: {
        ...userContext.finance,
        totalBalance: Math.max(0, userContext.finance.totalBalance - (eventData.cost || 0)),
        expenses: [
          ...userContext.finance.expenses,
          {
            type: "entertainment",
            amount: eventData.cost || 0,
            description: `Event: ${eventData.name}`,
            date: new Date().toISOString()
          }
        ]
      }
    };
    
    await redis.set(`user:${userId}:context`, updatedContext);
    return { success: true, newBalance: updatedContext.finance.totalBalance };
  } catch (error) {
    console.error("Update events history failed:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to get event recommendations based on context
export async function getEventRecommendations(userId, filters = {}) {
  try {
    const userContext = await redis.get(`user:${userId}:context`) || getDefaultContext();
    
    const {
      interests = userContext.preferences.events.interests,
      maxPrice = userContext.preferences.events.budgetRange.max,
      location = userContext.location.current
    } = filters;
    
    return {
      filters: { interests, maxPrice, location },
      userContext: {
        budget: userContext.finance.totalBalance,
        eventBudget: userContext.preferences.events.budgetRange,
        location: userContext.location.current,
        interests: userContext.preferences.events.interests,
        history: userContext.eventsHistory.attended.length
      },
      recommendation: `Looking for ${interests.join(', ')} events in ${location} under ₹${maxPrice}`
    };
  } catch (error) {
    console.error("Get event recommendations failed:", error);
    return { error: "Failed to get recommendations" };
  }
}