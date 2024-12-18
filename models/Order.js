const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Menu",
  },
  name: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["NEW", "INPROGRESS", "DONE"],
    default: "NEW",
  },
});

const OrderSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Table",
    },
    uniqueId: {
      type: String,
      unique: true,
    },
    items: [ItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    isTakeaway: {
      type: Boolean,
      default: false,
    },
    isCheckout: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["NONE", "CASH", "CREDIT_CARD"],
      required: true,
      default: "NONE"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
