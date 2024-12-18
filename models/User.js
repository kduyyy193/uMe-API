const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Merchant", "Waiter", "Kitchen", "Customer"],
    required: true,
  },
  businessName: {
    type: String,
    required: function () {
      return this.role === "Merchant";
    },
  },
  location: {
    type: String,
    required: function () {
      return this.role === "Merchant";
    },
  },
  isDeleted: { type: Boolean, default: false },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
