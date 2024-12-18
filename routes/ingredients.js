const express = require("express");
const isMerchant = require("../middlewares/roleMiddleware");
const Ingredient = require("../models/Ingredient");
const router = express.Router();

router.use(isMerchant);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const ingredients = await Ingredient.find()
      .skip(skip)
      .limit(pageSize)
      .lean(); 

    if (ingredients.length === 0) {
      return res.status(404).json({ msg: "No ingredients found." });
    }

    const totalIngredients = await Ingredient.countDocuments();

    const totalPages = Math.ceil(totalIngredients / pageSize);

    res.status(200).json({
      msg: "Ingredients retrieved successfully.",
      data: ingredients,
      pageInfo: {
        currentPage: page,
        pageSize: pageSize,
        count: totalIngredients,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.post("/", async (req, res) => {
  const { name, quantity, unit, unitPrice } = req.body;

  if (!name || !quantity || !unit || !unitPrice) {
    return res.status(400).json({ msg: "All fields are required." });
  }

  try {
    const totalCost = quantity * unitPrice;

    const ingredient = new Ingredient({
      name,
      quantity,
      unit,
      unitPrice,
      totalCost,
    });

    await ingredient.save();

    res.status(201).json({
      msg: "Ingredient added successfully.",
      data: ingredient,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/:id", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ msg: "Ingredient not found." });
    }

    res.status(200).json({
      msg: "Ingredient and its history deleted successfully.",
      data: {
        succcess: true,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
