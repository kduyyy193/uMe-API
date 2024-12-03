const express = require("express");
const Order = require("../models/Order");
const Ingredient = require("../models/Ingredient"); // Model Ingredient để lấy unitPrice
const InventoryHistory = require("../models/InventoryHistory");  // Model InventoryHistory để lấy thông tin xuất kho
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
    // Báo cáo đơn hàng
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

    // Báo cáo chi phí nhập kho
    const totalCostIn = await Ingredient.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $addFields: {
          totalCost: { $multiply: ["$quantity", "$unitPrice"] }, // Tổng chi phí nhập kho (số lượng * đơn giá)
        },
      },
      {
        $group: {
          _id: null,
          totalCostIn: { $sum: "$totalCost" }, // Tổng chi phí nhập kho
        },
      },
    ]);

    const totalCostInAmount = totalCostIn.length > 0 ? totalCostIn[0].totalCostIn : 0;

    // Báo cáo chi phí xuất kho (dựa vào InventoryHistory)
    const totalCostOut = await InventoryHistory.aggregate([
      { $match: { date: { $gte: start, $lte: end }, type: "OUT" } },
      {
        $lookup: {
          from: "ingredients",  // Liên kết với bảng Ingredient để lấy unitPrice của nguyên liệu
          localField: "ingredientId",  // Trường chứa ID nguyên liệu trong InventoryHistory
          foreignField: "_id",
          as: "ingredientDetails",
        },
      },
      { $unwind: "$ingredientDetails" },
      {
        $addFields: {
          totalCost: {
            $multiply: [
              "$quantity", 
              "$ingredientDetails.unitPrice"  // Lấy unitPrice từ Ingredient
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCostOut: { $sum: "$totalCost" }, // Tổng chi phí xuất kho
        },
      },
    ]);

    const totalCostOutAmount = totalCostOut.length > 0 ? totalCostOut[0].totalCostOut : 0;

    res.json({
      data: {
        totalRevenue,
        report,
        topMenuItems,
        paymentMethodReport,
        takeawayReport,
        nonTakeawayReport,
        totalCostIn: totalCostInAmount,  // Tổng chi phí nhập kho
        totalCostOut: totalCostOutAmount,  // Tổng chi phí xuất kho
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
