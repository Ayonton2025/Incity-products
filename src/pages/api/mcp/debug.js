// src/pages/api/mcp/debug.js
import { Redis } from "@upstash/redis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const userId = session.user.id;
  
  try {
    // Get current context
    const context = await redis.get(`user:${userId}:context`) || getDefaultContext();
    
    // Test update
    const testUpdate = {
      health: {
        activeIllness: "test_fever",
        symptoms: ["fever", "headache"],
        currentCondition: "sick",
        startedAt: new Date().toISOString()
      }
    };
    
    await redis.set(`user:${userId}:context`, { ...context, ...testUpdate });
    
    const updatedContext = await redis.get(`user:${userId}:context`);
    
    return res.status(200).json({
      userId,
      redisConnected: true,
      currentContext: updatedContext,
      message: "MCP system is working"
    });
    
  } catch (error) {
    return res.status(500).json({
      error: "MCP system failed",
      details: error.message
    });
  }
}

function getDefaultContext() {
  return { health: { currentCondition: "healthy" } };
}