const express = require("express");
const Order = require("../models/Order");
const moment = require("moment");
const router = express.Router();
const isMerchant = require("../middlewares/roleMiddleware");

router.get("/", isMerchant, async (req, res) => {
  const { startDate, endDate, period } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ msg: "Both startDate and endDate are required." });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ msg: "Invalid date format." });
  }

  let match = {
    isCheckout: true,
    createdAt: { $gte: start, $lte: end },
  };

  try {
    const report = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $addFields: {
          itemRevenue: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
      {
        $group: {
          _id: "$items._id",
          totalRevenue: { $sum: "$itemRevenue" },
          totalQuantity: { $sum: "$items.quantity" },
          menuItem: { $first: "$items" },
        },
      },
      {
        $lookup: {
          from: "menus",
          localField: "_id",
          foreignField: "_id",
          as: "menuDetails",
        },
      },
      { $unwind: "$menuDetails" },
      {
        $project: {
          _id: 0,
          menuItemId: "$menuDetails._id",
          menuItemName: "$menuDetails.name",
          totalRevenue: 1,
          totalQuantity: 1,
        },
      },
    ]);

    const totalRevenue = report.reduce(
      (acc, item) => acc + item.totalRevenue,
      0
    );

    const topMenuItems = report
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 3);

    const paymentMethodReport = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const takeawayReport = await Order.aggregate([
      { $match: { ...match, isTakeaway: true } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    const nonTakeawayReport = await Order.aggregate([
      { $match: { ...match, isTakeaway: false } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      data: {
        totalRevenue,
        report,
        topMenuItems,
        paymentMethodReport,
        takeawayReport,
        nonTakeawayReport,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
