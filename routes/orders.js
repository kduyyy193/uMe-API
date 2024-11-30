const express = require("express");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middlewares/authMiddleware");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
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
    if (existingOrder) {
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
      item.status = "NEW";
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
        status: item.status,
        note: item.note || "",
      })),
      totalAmount: order.totalAmount,
      isTakeaway: order.isTakeaway,
      createdAt: new Date().toISOString(),
    };

    await db.ref(`orders/${order._id}`).set(orderData);

    const io = req.io;
    if (io) {
      io.emit("newOrder", { message: "New Order" });
    }

    res.status(201).json({
      msg: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/update-status", async (req, res) => {
  const { orderId, itemId, newStatus } = req.body;
console.log( orderId, itemId, newStatus )
  if (!orderId || !itemId || !newStatus) {
    return res
      .status(400)
      .json({ msg: "Order ID, item ID, and new status are required." });
  }

  if (!["NEW", "INPROGRESS", "DONE"].includes(newStatus)) {
    return res.status(400).json({
      msg: "Invalid status. Allowed statuses: NEW, INPROGRESS, DONE.",
    });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    const itemIndex = order.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ msg: "Item not found in order." });
    }

    order.items[itemIndex].status = newStatus;

    await order.save();

    res.status(200).json({
      msg: "Item status updated successfully.",
      data: order.items[itemIndex],
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.delete("/delete-done-items", async (req, res) => {
  const { orderId, itemId } = req.body;

  if (!orderId || !itemId) {
    return res.status(400).json({ msg: "Order ID and item ID are required." });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    const itemIndex = order.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ msg: "Item not found in order." });
    }

    if (order.items[itemIndex].status === "done") {
      order.items.splice(itemIndex, 1);
      await order.save();

      res.status(200).json({ msg: "Item deleted successfully." });
    } else {
      res.status(400).json({ msg: "Item is not in 'done' status." });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/order-items", async (req, res) => {
  try {
    const orders = await Order.find({ isCheckout: false });
    const inprogress = [];
    const newItems = [];
    const done = [];

    for (let order of orders) {
      const table = await Table.findById(order.tableId);
      if (!table) {
        continue;
      }

      for (let item of order.items) {
        const menuItem = await Menu.findById(item._id);
        if (!menuItem) {
          continue;
        }

        const itemData = {
          orderId: order._id,
          tableName: table?.tableNumber,
          menuItem: menuItem?.name,
          itemId: menuItem?._id,
          quantity: item.quantity,
          status: item.status,
          note: item.note || "",
        };

        if (item.status === 'INPROGRESS') {
          inprogress.push(itemData);
        } else if (item.status === 'NEW') {
          newItems.push(itemData);
        } else if (item.status === 'DONE') {
          done.push(itemData);
        }
      }
    }

    res.status(200).json({ data: {inprogress, new: newItems, done} });
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

router.put("/update-items/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: "Items are required and should be an array." });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }
    let totalAmount = order.totalAmount;
    for (const item of items) {
      const menuItem = await Menu.findById(item._id);
      if (!menuItem) {
        return res.status(404).json({ msg: `Menu item with ID ${item._id} not found.` });
      }
      totalAmount += menuItem.price * item.quantity;
      order.items.push({
        _id: item._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        status: "NEW",
        note: item.note || "",
      });
    }

    order.totalAmount = totalAmount;
    await order.save();

    res.status(200).json({
      msg: "Items added to order successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/checkout", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const orders = await Order.find({ isCheckout: true })
      .select(
        "uniqueId isCheckout paymentMethod totalAmount isTakeaway createdAt tableId"
      )
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
        const table = await Table.findById(order.tableId).select("tableNumber");
        return {
          ...order,
          createdAt: moment(order.createdAt).format("YYYY-MM-DD HH:mm:ss"),
          tableNumber: table ? table.tableNumber : null,
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
