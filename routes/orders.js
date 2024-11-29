const express = require("express");
const Menu = require("../models/Menu");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middlewares/authMiddleware");
const Table = require("../models/Table");
const router = express.Router();
const db = require("../firebase");
const STATUS = require("../constants/status");
const moment = require("moment");

router.use(authMiddleware);

router.post("/", async (req, res) => {
  const { tableId, items, isTakeaway } = req.body;

  if (!tableId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: "Table ID and items are required." });
  }

  try {
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ msg: "Table not found." });
    }

    const existingOrder = await Order.findOne({ tableId, isCheckout: false });
    if (existingOrder && !existingOrder?.isCheckout) {
      return res
        .status(400)
        .json({ msg: "This table already has an active order." });
    }

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

    for (const item of items) {
      const menuItem = await Menu.findById(item._id);
      if (!menuItem) {
        return res
          .status(404)
          .json({ msg: `Menu item with ID ${item._id} not found.` });
      }
      totalAmount += menuItem.price * item.quantity;
    }

    const order = new Order({
      tableId,
      uniqueId: isTakeaway ? uuidv4() : undefined,
      items,
      totalAmount,
      isTakeaway,
      isCheckout: false,
    });

    await order.save();

    const orderData = {
      tableId: order.tableId.toString(),
      items: order.items.map((item) => ({
        _id: item._id.toString(),
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
      data: order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/:orderId", async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: "Items are required." });
  }

  try {
    const order = await Order.findById(req.params.orderId).populate(
      "items._id"
    );

    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    let totalAmount = 0;

    for (const item of items) {
      const existingItem = order.items.find(
        (i) => i._id.toString() === item._id
      );

      if (existingItem) {
        if (
          existingItem.status === "IN_PROGRESS" ||
          existingItem.status === "DONE"
        ) {
          return res.status(400).json({
            msg: `Cannot edit item ${item._id} because its status is ${existingItem.status}.`,
          });
        }

        existingItem.quantity = item.quantity;

        const menuItem = await Menu.findById(item._id);
        if (!menuItem) {
          return res
            .status(404)
            .json({ msg: `Menu item with ID ${item._id} not found.` });
        }
        totalAmount += menuItem.price * existingItem.quantity;
      } else {
        return res
          .status(404)
          .json({ msg: `Item with ID ${item._id} not found in order.` });
      }
    }

    order.totalAmount = totalAmount;

    await order.save();
    res.json({ msg: "Order updated", order });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/table/:tableId", async (req, res) => {
  const { tableId } = req.params;

  try {
    const orders = await Order.find({ tableId, isCheckout: false });

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No orders found for this table." });
    }

    res.json({
      data: orders?.[0],
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/takeaway/:uniqueId", async (req, res) => {
  const { uniqueId } = req.params;
  try {
    const order = await Order.findOne({ uniqueId }).populate("items._id");

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

router.put("/update-status/:orderId", async (req, res) => {
  const { items } = req.body;
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
      const orderItem = order.items.find((i) => i._id.toString() === item._id);

      if (orderItem) {
        orderItem.status = item.status;
      }
    });

    await order.save();

    const orderData = {
      tableId: order.tableId.toString(),
      items: order.items.map((item) => ({
        _id: item._id.toString(),
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

router.get("/checkout", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const orders = await Order.find({ isCheckout: true })
      .select("uniqueId isCheckout paymentMethod totalAmount isTakeaway createdAt tableId")
      .skip(skip)
      .limit(pageSize)
      .lean();

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No checked-out orders found." });
    }

    const totalOrders = await Order.countDocuments({ isCheckout: true });

    const totalPages = Math.ceil(totalOrders / pageSize);

    const orderWithTableInfo = await Promise.all(
      orders.map(async (order) => {
        const table = await Table.findById(order.tableId).select('tableNumber');
        return {
          ...order,
          createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          tableNumber: table ? table.tableNumber : null 
        };
      })
    );

    res.status(200).json({
      msg: "Checkout orders retrieved successfully.",
      data: orderWithTableInfo,
      pageInfo: {
        currentPage: page,
        pageSize: pageSize,
        count: totalOrders,
        totalPages: totalPages,
      },
    });
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
