const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  seats: { type: Number, required: true },
  status: {
    type: String,
    enum: ["available", "occupied"],
    default: "available",
  },
  location: { type: String },
  isTakeaway: { type: Boolean, default: false },
});

const Table = mongoose.model("Table", TableSchema);
module.exports = Table;
