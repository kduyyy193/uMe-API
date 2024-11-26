// routes/menu.js
const express = require("express");
const Menu = require("../models/Menu");
const Category = require("../models/Category");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

// Tạo món ăn mới
router.post("/", async (req, res) => {
  const { name, quantity, price, description, categoryId } = req.body;

  if (!name || !quantity || !price || !categoryId) {
    return res.status(400).json({ msg: "Name, quantity, price, and category are required." });
  }

  try {
    // Kiểm tra xem category có tồn tại không
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    const menuItem = new Menu({ name, quantity, price, description, category: categoryId });
    await menuItem.save();
    res.status(201).json({ msg: "Menu item created", menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy tất cả món ăn
router.get("/", async (req, res) => {
  try {
    const menuItems = await Menu.find().populate("category"); // Liên kết category
    res.json({ data: menuItems });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy món ăn theo ID
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id).populate("category");
    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }
    res.json({ data: menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Cập nhật món ăn
router.put("/:id", async (req, res) => {
  const { name, quantity, price, description, available, categoryId } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    const menuItem = await Menu.findByIdAndUpdate(
      req.params.id,
      { name, quantity, price, description, available, category: categoryId },
      { new: true }
    );
    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }

    res.json({ msg: "Menu item updated", menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Xóa món ăn
router.delete("/:id", async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }
    res.json({ msg: "Menu item deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/category/:categoryId", async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Kiểm tra xem category có tồn tại không
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: "Category not found." });
    }

    // Lấy các món ăn thuộc category đó
    const menuItems = await Menu.find({ category: categoryId }).populate("category");

    res.json({ data: menuItems });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
