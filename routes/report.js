const express = require("express");
const Order = require("../models/Order");
const isMerchant = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get("/", isMerchant, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const match = {
      isCheckout: true,
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) {
        match.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        match.createdAt.$lte = new Date(endDate);
      }
    }

    const report = await Order.aggregate([
      { $match: match },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.menuItemId",
          totalRevenue: { $sum: "$totalAmount" },
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
      {
        $unwind: "$menuDetails",
      },
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

    if (report.length === 0) {
      return res.status(404).json({ msg: "No sales data found." });
    }

    const totalRevenue = report.reduce(
      (acc, item) => acc + item.totalRevenue,
      0
    );

    res.json({
      totalRevenue,
      report,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
