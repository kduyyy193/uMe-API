const express = require("express");
const Ingredient = require("../models/Ingredient");
const InventoryHistory = require("../models/InventoryHistory");
const router = express.Router();

router.post("/in", async (req, res) => {
  const { ingredientId, quantity, description } = req.body;

  if (!ingredientId || !quantity) {
    return res
      .status(400)
      .json({ msg: "Ingredient ID and quantity are required." });
  }

  try {
    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ msg: "Ingredient not found." });
    }

    ingredient.quantity += quantity;

    const history = new InventoryHistory({
      ingredientId,
      type: "IN",
      quantity,
      description,
    });

    await ingredient.save();
    await history.save();

    res
      .status(200)
      .json({ msg: "Ingredient added to inventory.", data: ingredient });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.post("/out", async (req, res) => {
  const { ingredientId, quantity, description } = req.body;

  if (!ingredientId || !quantity) {
    return res
      .status(400)
      .json({ msg: "Ingredient ID and quantity are required." });
  }

  if (quantity <= 0) {
    return res
      .status(400)
      .json({ msg: "Quantity must be greater than 0." });
  }

  try {
    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ msg: "Ingredient not found." });
    }

    if (ingredient.quantity < quantity) {
      return res.status(400).json({ msg: "Not enough stock available." });
    }

    ingredient.quantity -= quantity;

    const history = new InventoryHistory({
      ingredientId,
      type: "OUT",
      quantity,
      description,
    });

    await ingredient.save();
    await history.save();

    res
      .status(200)
      .json({ msg: "Ingredient removed from inventory.", data: ingredient });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/history", async (req, res) => {
  const { ingredientId, startDate, endDate, type } = req.query;

  const filter = {};
  if (ingredientId) filter.ingredientId = ingredientId;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  try {
    const history = await InventoryHistory.find(filter)
      .populate("ingredientId", "name unit")
      .sort({ date: -1 });

    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
