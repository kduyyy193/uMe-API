const express = require("express");
const isMerchant = require("../middlewares/roleMiddleware");
const { Ingredient } = require("../models/Ingredient");
const { InventoryHistory } = require("../models/InventoryHistory");
const router = express.Router();

router.use(isMerchant);

router.get("/ingredients", async (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  try {
    const totalCount = await Ingredient.countDocuments(filter);
    const ingredients = await Ingredient.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.status(200).json({
      msg: "List of ingredients retrieved successfully.",
      data: ingredients,
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.post("/ingredients", async (req, res) => {
  const { name, quantity, unit } = req.body;

  if (!name || !quantity || !unit) {
    return res.status(400).json({ msg: "All fields are required." });
  }

  try {
    const ingredient = new Ingredient({ name, quantity, unit });
    await ingredient.save();

    res
      .status(201)
      .json({ msg: "Ingredient added successfully.", data: ingredient });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/ingredients/:id", async (req, res) => {
  const { name, quantity, unit } = req.body;

  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ msg: "Ingredient not found." });
    }

    if (name) ingredient.name = name;
    if (quantity) ingredient.quantity = quantity;
    if (unit) ingredient.unit = unit;

    await ingredient.save();

    res
      .status(200)
      .json({ msg: "Ingredient updated successfully.", data: ingredient });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.post("/inventory/in", async (req, res) => {
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

router.post("/inventory/out", async (req, res) => {
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

router.get("/inventory/history", async (req, res) => {
  const { ingredientId, startDate, endDate } = req.query;

  const filter = {};
  if (ingredientId) filter.ingredientId = ingredientId;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  try {
    const history = await InventoryHistory.find(filter)
      .populate("ingredientId", "name")
      .sort({ date: -1 });

    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});
