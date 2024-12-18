const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../constants/roles");
const isMerchant = require("../middlewares/roleMiddleware");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, role, businessName, location } = req.body;

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ msg: "Username, password, and role are required." });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ msg: "Invalid role." });
  }

  if (role === ROLES.MERCHANT) {
    if (!businessName || !location) {
      return res.status(400).json({
        msg: "Business name and location are required for Merchant.",
      });
    }
  } else {
    if (businessName || location) {
      return res.status(400).json({
        msg: "Business name and location are not required for this role.",
      });
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

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, isDeleted: false });
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

router.post("/createWaiterOrKitchen", isMerchant, async (req, res) => {
  const { username, password, role } = req.body;
  console.log(req.body);

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ msg: "Username, password, and role are required." });
  }

  if (role !== "Waiter" && role !== "Kitchen") {
    return res
      .status(400)
      .json({ msg: "Role must be either Waiter or Kitchen." });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const merchant = await User.findById(req.user.id);
    if (merchant.role !== "Merchant") {
      return res
        .status(403)
        .json({ msg: "Only merchants can create Waiter or Kitchen accounts." });
    }

    const newUser = new User({
      username,
      password: await bcrypt.hash(password, 10),
      role,
      businessName: merchant.businessName,
      location: merchant.location,
      merchantId: merchant._id,
    });

    await newUser.save();
    res.status(201).json({ msg: `${role} account created`, data: newUser });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.put("/updateWaiterOrKitchen/:id", isMerchant, async (req, res) => {
  const { role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    user.role = role;
    console.log(user);
    await user.save();
    res.json({ msg: "User updated", data: user });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.delete("/deleteWaiterOrKitchen/:id", isMerchant, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isDeleted = true;
    await user.save();

    res.json({
      msg: "User deleted successfully",
      data: { messsage: "Success" },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({
      isDeleted: false,
      role: { $in: ["Kitchen", "Waiter"] },
    });

    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
