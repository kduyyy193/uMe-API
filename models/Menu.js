// models/Menu.js
const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  available: {
    type: Boolean,
    default: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Liên kết đến Category
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Menu", MenuSchema);
