// src/models/UserContext.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const userContextSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  health: {
    activeIllness: String,
    symptoms: [String],
    allergies: [String],
    startedAt: Date,
    expiresAt: Date,
  },
  finance: {
    balance: { type: Number, default: 5000 },
    monthlyIncome: Number,
    spendingLimit: Number,
  },
  food: {
    dietaryPreferences: String,
    allergies: [String],
    calorieIntake: Number,
    favoriteCuisines: [String],
  },
}, { timestamps: true });

// ✅ Prevent OverwriteModelError on hot reload
export default mongoose.models.UserContext ||
  mongoose.model("UserContext", userContextSchema);
