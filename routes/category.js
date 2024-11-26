// routes/category.js
const express = require("express");
const Category = require("../models/Category");
const authMiddleware = require("../middlewares/authMiddleware"); // Nếu bạn cần xác thực
const router = express.Router();

router.use(authMiddleware);

// Tạo Category mới
router.post("/", async (req, res) => {
  const { name, description } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name) {
    return res.status(400).json({ msg: "Category name is required." });
  }

  try {
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({ msg: "Category created", category });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy tất cả Category
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy Category theo ID
router.get("/:id", async (req, res) => {
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

// Cập nhật Category
router.put("/:id", async (req, res) => {
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
    res.json({ msg: "Category updated", category });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Xóa Category
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }
    res.json({ msg: "Category deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
