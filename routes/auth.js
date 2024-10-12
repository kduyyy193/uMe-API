const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../constants/roles");
const isMerchant = require("../middlewares/roleMiddleware");
const router = express.Router();

// Đăng ký
router.post("/register", async (req, res) => {
  const { username, password, role, businessName, location } = req.body;

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ msg: "Username, password, and role are required." });
  }

  // Kiểm tra vai trò hợp lệ
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ msg: "Invalid role." });
  }

  // Kiểm tra nếu vai trò là Merchant thì cần thêm thông tin businessName và location
  if (role === ROLES.MERCHANT) {
    if (!businessName || !location) {
      return res
        .status(400)
        .json({ msg: "Business name and location are required for Merchant." });
    }
  }

  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({
      username,
      password: await bcrypt.hash(password, 10),
      role,
      businessName: role === ROLES.MERCHANT ? businessName : undefined,
      location: role === ROLES.MERCHANT ? location : undefined,
    });

    await user.save();
    res.status(201).json({ msg: "User created", user });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, isDeleted: false }); // Chỉ tìm user chưa bị xoá
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          businessName:
            user.role === ROLES.MERCHANT ? user.businessName : undefined,
          location: user.role === ROLES.MERCHANT ? user.location : undefined,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Xoá người dùng (chỉ dành cho Customer)
router.delete("/delete/:id", isMerchant, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isDeleted = true; // Đánh dấu user là đã xoá
    await user.save();

    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// Lấy danh sách người dùng (không hiển thị user đã bị xoá)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }); // Không lấy user bị xoá
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
