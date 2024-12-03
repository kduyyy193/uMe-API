const mongoose = require("mongoose");

const inventoryHistorySchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true,
  },
  type: { type: String, enum: ["IN", "OUT"], required: true }, // IN for adding, OUT for taking out
  quantity: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("InventoryHistory", inventoryHistorySchema);
