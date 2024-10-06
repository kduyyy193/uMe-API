const express = require("express");
const Order = require("../models/Order");
const PAYMENT_METHOD = require("../constants/paymentMethod");
const router = express.Router();

router.post("/:orderId", async (req, res) => {
  const { paymentMethod } = req.body;

  // Kiểm tra phương thức thanh toán
  if (
    !paymentMethod ||
    !Object.values(PAYMENT_METHOD).includes(paymentMethod)
  ) {
    return res.status(400).json({
      msg: "Payment method is required and must be either CASH or CREDIT_CARD.",
    });
  }

  try {
    // Tìm đơn hàng dựa trên orderId
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    // Kiểm tra xem đơn hàng đã checkout chưa
    if (order.isCheckout) {
      return res
        .status(400)
        .json({ msg: "Order has already been checked out." });
    }

    // Cập nhật đơn hàng với trạng thái checkout
    order.isCheckout = true;
    order.paymentMethod = paymentMethod; // Thêm phương thức thanh toán vào đơn hàng

    await order.save(); // Lưu lại thay đổi

    res.status(200).json({
      msg: "Checkout successful.",
      order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
