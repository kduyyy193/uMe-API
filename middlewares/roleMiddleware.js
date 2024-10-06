const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isMerchant = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (user.role !== "Merchant") {
      return res
        .status(403)
        .json({
          msg: "Access denied. Only Merchants can perform this action.",
        });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = isMerchant;
