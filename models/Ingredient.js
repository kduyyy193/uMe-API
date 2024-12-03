const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }, // e.g., kg, liter, etc.
  createdAt: { type: Date, default: Date.now },
  unitPrice: { type: Number},
  totalCost: { type: Number },
});

module.exports = mongoose.model("Ingredient", ingredientSchema);
