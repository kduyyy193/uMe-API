const express = require("express");
const Menu = require("../models/Menu");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middlewares/authMiddleware");
const Table = require("../models/Table");
const router = express.Router();
const db = require("../firebase");
const STATUS = require("../constants/status");

router.use(authMiddleware);

// Tạo đơn hàng
router.post("/", async (req, res) => {
  const { tableId, items, isTakeaway } = req.body;

  if (!tableId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: "Table ID and items are required." });
  }

  try {
    // Kiểm tra thông tin bàn
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ msg: "Table not found." });
    }

    // Kiểm tra logic bàn takeaway
    if (isTakeaway && !table.isTakeaway) {
      return res
        .status(400)
        .json({ msg: "The specified table is not a takeaway table." });
    }
    if (!isTakeaway && table.isTakeaway) {
      return res
        .status(400)
        .json({ msg: "Cannot use a takeaway table for a normal order." });
    }

    let totalAmount = 0;

    // Tính tổng tiền cho các món ăn
    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItemId);
      if (!menuItem) {
        return res
          .status(404)
          .json({ msg: `Menu item with ID ${item.menuItemId} not found.` });
      }
      totalAmount += menuItem.price * item.quantity;
    }

    // Tạo đơn hàng mới
    const order = new Order({
      tableId,
      uniqueId: isTakeaway ? uuidv4() : undefined,
      items,
      totalAmount,
      isTakeaway,
    });

    await order.save();

    // Đẩy đơn hàng xuống Firebase
    const orderData = {
      tableId: order.tableId.toString(),
      items: order.items.map((item) => ({
        menuItemId: item.menuItemId.toString(),
        quantity: item.quantity,
        name: item.name,
        status: item?.status ?? STATUS.NEW,
        note: item?.note ?? "",
      })),
      totalAmount: order.totalAmount,
      isTakeaway: order.isTakeaway,
      createdAt: new Date().toISOString(),
    };

    await db.ref(`orders/${order._id}`).set(orderData);

    res.status(201).json({
      msg: "Order created successfully.",
      order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Cập nhật đơn hàng
router.put("/:orderId", async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: "Items are required." });
  }

  try {
    // Tìm đơn hàng dựa trên orderId
    const order = await Order.findById(req.params.orderId).populate(
      "items.menuItemId"
    );

    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    let totalAmount = 0;

    // Kiểm tra trạng thái các món ăn trước khi cập nhật
    for (const item of items) {
      const existingItem = order.items.find(
        (i) => i.menuItemId.toString() === item.menuItemId
      );

      // Nếu món ăn đã tồn tại trong đơn hàng
      if (existingItem) {
        if (
          existingItem.status === "IN_PROGRESS" ||
          existingItem.status === "DONE"
        ) {
          return res.status(400).json({
            msg: `Cannot edit item ${item.menuItemId} because its status is ${existingItem.status}.`,
          });
        }

        // Cập nhật số lượng món ăn
        existingItem.quantity = item.quantity;

        // Tính tổng tiền cho món ăn đã cập nhật
        const menuItem = await Menu.findById(item.menuItemId);
        if (!menuItem) {
          return res
            .status(404)
            .json({ msg: `Menu item with ID ${item.menuItemId} not found.` });
        }
        totalAmount += menuItem.price * existingItem.quantity;
      } else {
        return res
          .status(404)
          .json({ msg: `Item with ID ${item.menuItemId} not found in order.` });
      }
    }

    // Cập nhật tổng tiền
    order.totalAmount = totalAmount;

    await order.save();
    res.json({ msg: "Order updated", order });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy đơn hàng theo table ID
router.get("/table/:tableId", async (req, res) => {
  const { tableId } = req.params;

  try {
    const orders = await Order.find({ tableId, isCheckout: false }).populate(
      "items.menuItemId"
    );

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No orders found for this table." });
    }

    res.json({
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy đơn hàng theo unique ID cho bàn takeaway
router.get("/takeaway/:uniqueId", async (req, res) => {
  const { uniqueId } = req.params;
  try {
    const order = await Order.findOne({ uniqueId }).populate(
      "items.menuItemId"
    );

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json({
      data: order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Cập nhật trạng thái món ăn trong đơn hàng
router.put("/update-status/:orderId", async (req, res) => {
  const { items } = req.body; // items là một mảng các đối tượng chứa menuItemId và status
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: "Items are required." });
  }

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }
    console.log(items);
    items.forEach((item) => {
      const orderItem = order.items.find(
        (i) => i.menuItemId.toString() === item.menuItemId
      );

      if (orderItem) {
        // Cập nhật trạng thái cho món ăn
        orderItem.status = item.status;
      }
    });

    await order.save();

    // Đẩy đơn hàng xuống Firebase
    const orderData = {
      tableId: order.tableId.toString(),
      items: order.items.map((item) => ({
        menuItemId: item.menuItemId.toString(),
        quantity: item.quantity,
        name: item.name,
        status: item?.status ?? STATUS.NEW,
        note: item?.note ?? "",
      })),
      totalAmount: order.totalAmount,
      isTakeaway: order.isTakeaway,
      createdAt: new Date().toISOString(),
    };

    await db.ref(`orders/${order._id}`).set(orderData);

    res.json({ msg: "Order item status updated successfully.", order });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/check-firebase", (req, res) => {
  db.ref(".info/connected").once("value", (snapshot) => {
    if (snapshot.val() === true) {
      res.status(200).json({ msg: "Firebase connected successfully." });
    } else {
      res.status(500).json({ msg: "Firebase not connected." });
    }
  });
});

module.exports = router;
