// src/models/User.js
import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  name: { type: String, default: "" }
}, { timestamps: true });

// ✅ Prevent OverwriteModelError during Next.js hot reloads
export default models.User || model('User', userSchema);
