const express = require("express");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({ isCheckout: true })
      .select("items")
      .lean();

    if (!orders.length) {
      return res.status(404).json({ msg: "No confirmed orders found." });
    }

    const menuItemIds = orders.flatMap((order) => order.items.map((item) => item.menuItemId));
    const uniqueMenuItemIds = [...new Set(menuItemIds)];

    const menuItems = await Menu.find({ _id: { $in: uniqueMenuItemIds } })
      .select("name price")
      .lean();

    const ordersWithMenu = orders.map((order) => {
      const orderItems = order.items.map((item) => {
        const menuItem = menuItems.find((menu) => menu._id.toString() === item.menuItemId.toString());
        return {
          menuItemId: item.menuItemId,
          menuItemName: menuItem ? menuItem.name : "Unknown",
          quantity: item.quantity,
          price: menuItem ? menuItem.price : 0,
        };
      });

      return {
        orderId: order._id,
        items: orderItems,
      };
    });

    res.json({
      msg: "Confirmed orders retrieved successfully.",
      data: ordersWithMenu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
