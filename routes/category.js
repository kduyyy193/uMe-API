const express = require("express");
const Category = require("../models/Category");
const authMiddleware = require("../middlewares/authMiddleware");
const isMerchant = require("../middlewares/roleMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/", isMerchant, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ msg: "Category name is required." });
  }

  try {
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({
      data: category,
      msg: "Category created",
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/:id", isMerchant, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }
    res.json({ data: category });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/:id", isMerchant, async (req, res) => {
  const { name, description } = req.body;

  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }
    res.json({ data: category, msg: "Category updated" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.delete("/:id", isMerchant, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }
    res.json({
      data: {
        succcess: true,
      },
      msg: "Category deleted",
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
