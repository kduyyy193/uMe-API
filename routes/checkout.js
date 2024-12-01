const express = require("express");
const Order = require("../models/Order");
const PAYMENT_METHOD = require("../constants/paymentMethod");
const authMiddleware = require("../middlewares/authMiddleware");
const Table = require("../models/Table");
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
    console.log("Order found:", order);

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
    console.log("Order updated successfully:", order);

    if (order.tableId) {
      const table = await Table.findById(order.tableId);
      console.log("Table found:", table);

      if (table) {
        table.status = "available";
        await table.save();
        console.log("Table updated successfully:", table);
      } else {
        console.warn(`Table with ID ${order.tableId} not found.`);
      }
    }

    return res.status(200).json({
      msg: `Checkout successful with ${paymentMethod}.`,
      data: order,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
});



module.exports = router;
