const express = require("express");
const Order = require("../models/Order");
const PAYMENT_METHOD = require("../constants/paymentMethod");

const handleCreditCardPayment = require("../paymentHandlers/creditCard");
const handleCashPayment = require("../paymentHandlers/cash");

const router = express.Router();

router.post("/:orderId", async (req, res) => {
  const { paymentMethod, amount, paymentToken } = req.body;

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

    let result;
    switch (paymentMethod) {
      case PAYMENT_METHOD.CREDIT_CARD:
        result = await handleCreditCardPayment(order, amount, paymentToken);
        break;
      case PAYMENT_METHOD.CASH:
        result = await handleCashPayment(order);
        break;

      default:
        return res.status(400).json({ msg: "Unsupported payment method." });
    }

    if (result.success) {
      res.status(200).json({
        msg: result.msg,
        order: result.order,
      });
    } else {
      res.status(400).json({
        msg: result.msg,
        error: result.error || null,
      });
    }
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
