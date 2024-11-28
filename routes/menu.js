const express = require("express");
const Menu = require("../models/Menu");
const Category = require("../models/Category");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/:categoryId", async (req, res) => {
  const { name, quantity, price, description } = req.body;
  const { categoryId } = req.params;

  if (!name || !quantity || !price || !categoryId) {
    return res
      .status(400)
      .json({ msg: "Name, quantity, price, and category are required." });
  }

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    const menuItem = new Menu({
      name,
      quantity,
      price,
      description,
      category: categoryId,
    });
    await menuItem.save();
    res.status(201).json({ msg: "Menu item created", data: menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/:categoryId", async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    const menuItems = await Menu.find({ category: categoryId }).populate(
      "category"
    );
    res.json({ data: menuItems });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/:categoryId/:id", async (req, res) => {
  const { categoryId, id } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    const menuItem = await Menu.findOne({
      _id: id,
      category: categoryId,
    }).populate("category");
    if (!menuItem) {
      return res
        .status(404)
        .json({ msg: "Menu item not found in this category" });
    }
    res.json({ data: menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/:categoryId/:id", async (req, res) => {
  const { categoryId, id } = req.params;
  const { name, quantity, price, description, available } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const menuItem = await Menu.findOneAndUpdate(
      { _id: id, category: categoryId },
      { name, quantity, price, description, available, category: categoryId },
      { new: true }
    );
    if (!menuItem) {
      return res
        .status(404)
        .json({ msg: "Menu item not found in this category" });
    }

    res.json({ msg: "Menu item updated", data: menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.delete("/:categoryId/:id", async (req, res) => {
  const { categoryId, id } = req.params;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const menuItem = await Menu.findOneAndDelete({
      _id: id,
      category: categoryId,
    });
    if (!menuItem) {
      return res
        .status(404)
        .json({ msg: "Menu item not found in this category" });
    }

    res.json({ msg: "Menu item deleted", data: {success: true} });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
