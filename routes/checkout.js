const express = require("express");
const Order = require("../models/Order");
const PAYMENT_METHOD = require("../constants/paymentMethod");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/:orderId", async (req, res) => {
  const { paymentMethod } = req.body;

  if (
    !paymentMethod ||
    !Object.values(PAYMENT_METHOD).includes(paymentMethod)
  ) {
    return res.status(400).json({
      msg: "Payment method is required and must be valid.",
    });
  }

  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    if (order.isCheckout) {
      return res
        .status(400)
        .json({ msg: "Order has already been checked out." });
    }

    order.isCheckout = true;
    order.paymentMethod = paymentMethod;
    await order.save();

    return res.status(200).json({
      msg: `Checkout successful with ${paymentMethod}.`,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
