const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Merchant", "Waiter", "Kitten", "Customer"],
    required: true,
  },
  businessName: { type: String }, // Chỉ dành cho Merchant
  location: { type: String }, // Chỉ dành cho Merchant
  isDeleted: { type: Boolean, default: false },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
