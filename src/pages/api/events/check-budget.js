// src/pages/api/events/check-budget.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { userId, eventCost } = req.body;

  try {
    // Get user finance context
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const mcpUrl = `${protocol}://${host}/api/mcp/context?userId=${userId}`;
    
    const contextRes = await fetch(mcpUrl);
    const userContext = await contextRes.json();

    const availableBudget = userContext.finance?.totalBalance || 0;
    const canAfford = availableBudget >= eventCost;
    const budgetPercentage = availableBudget > 0 ? (eventCost / availableBudget * 100).toFixed(1) : 0;

    res.status(200).json({
      canAfford,
      availableBudget,
      eventCost,
      budgetPercentage,
      recommendation: canAfford 
        ? `✅ Affordable (${budgetPercentage}% of your budget)`
        : `❌ Too expensive (${budgetPercentage}% of your budget)`,
      suggestion: canAfford 
        ? "You can attend this event within your budget"
        : "Consider cheaper alternatives or save more"
    });

  } catch (error) {
    res.status(500).json({ error: "Budget check failed" });
  }
}