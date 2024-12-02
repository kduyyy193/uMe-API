import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }, // e.g., kg, liter, etc.
  createdAt: { type: Date, default: Date.now },
});

export const Ingredient = mongoose.model("Ingredient", ingredientSchema);