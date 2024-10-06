// models/Menu.js
const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  available: { type: Boolean, default: true },
});

const Menu = mongoose.model("Menu", MenuSchema);
module.exports = Menu;
