const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../constants/roles");
const isMerchant = require("../middlewares/roleMiddleware");
const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user with a username, password, and role. For users with the Merchant role, additional business details are required.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the new user
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: Password for the new user
 *                 example: password123
 *               role:
 *                 type: string
 *                 description: Role of the user (e.g., Admin, Merchant, etc.)
 *                 example: Merchant
 *               businessName:
 *                 type: string
 *                 description: Business name (required if role is Merchant)
 *                 example: John's Bakery
 *               location:
 *                 type: string
 *                 description: Location of the business (required if role is Merchant)
 *                 example: 123 Main St, Springfield
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: User created
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     role:
 *                       type: string
 *                       example: Merchant
 *                     businessName:
 *                       type: string
 *                       example: John's Bakery
 *                     location:
 *                       type: string
 *                       example: 123 Main St, Springfield
 */
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

/**
 * @swagger
 * /api/auth/login:
 *    post:
 *      summary: Login to system
 *      description: Use username and password to log in
 *      tags:
 *        - Auth
 *      requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the new user
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: Password for the new user
 *                 example: password123
 *      responses:
 *        200:
 *          description: Successful login
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  token:
 *                    type: string
 *                    description: JWT token for authenticated user
 *                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                  user:
 *                    type: object
 *                    properties:
 *                      id:
 *                        type: string
 *                        description: ID of the user
 *                        example: 12345
 *                      username:
 *                        type: string
 *                        description: Username of the logged-in user
 *                        example: admin
 *                      role:
 *                        type: string
 *                        description: Role of the user (e.g., admin, merchant)
 *                        example: admin
 *                      businessName:
 *                        type: string
 *                        description: Name of the business (if role is MERCHANT)
 *                        example: "Tech Store"
 *                      location:
 *                        type: string
 *                        description: Location of the business (if role is MERCHANT)
 *                        example: "New York"
 */
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
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        businessName:
          user.role === ROLES.MERCHANT ? user.businessName : undefined,
        location: user.role === ROLES.MERCHANT ? user.location : undefined,
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

/**
 * @swagger
 * /api/auth/users:
 *    get:
 *      summary: Get a list of Users
 *      tags:
 *        - User
 *      responses:
 *        200:
 *           description: A list of users
 *           content:
 *              application/json:
 *                type: array
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false });
    res.json(users.map(user => {
      const { password, __v, ...userWithoutSensitiveData } = user.toObject();
      return userWithoutSensitiveData;
    }));
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
