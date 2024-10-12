const express = require("express");
const Menu = require("../models/Menu");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

// Tạo món ăn mới
router.post("/", async (req, res) => {
  const { name, quantity, price, description } = req.body;

  if (!name || !quantity || !price) {
    return res
      .status(400)
      .json({ msg: "Name, quantity, and price are required." });
  }

  try {
    const menuItem = new Menu({ name, quantity, price, description });
    await menuItem.save();
    res.status(201).json({ msg: "Menu item created", menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Lấy tất cả món ăn
router.get("/", async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.page) || 1;

    const totalItems = await Menu.countDocuments();

    const menuItems = await Menu.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      data: menuItems,
      pageSize,
      page,
      totalCount: totalItems,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Chỉnh sửa món ăn
router.put("/:id", async (req, res) => {
  const { name, quantity, price, description, available } = req.body;

  try {
    const menuItem = await Menu.findByIdAndUpdate(
      req.params.id,
      { name, quantity, price, description, available },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }

    res.json({ msg: "Menu item updated", menuItem });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
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
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
