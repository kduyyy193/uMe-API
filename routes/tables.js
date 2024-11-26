const express = require("express");
const Table = require("../models/Table");
const authMiddleware = require("../middlewares/authMiddleware");
const isMerchant = require("../middlewares/roleMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/", isMerchant, async (req, res) => {
  const { tableNumber, seats, location } = req.body;

  if (!tableNumber || !seats) {
    return res
      .status(400)
      .json({ msg: "Table number and seats are required." });
  }

  try {
    const table = new Table({ tableNumber, seats, location });
    await table.save();
    res.status(201).json({ msg: "Table created", table });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Lấy tất cả các bàn (mọi vai trò có thể xem)
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find();
    res.json({
      data: tables,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Chỉnh sửa bàn
router.put("/:id", isMerchant, async (req, res) => {
  const { seats, status, location } = req.body;

  try {
    // Tìm bàn theo ID
    const table = await Table.findById(req.params.id);

    // Kiểm tra xem bàn có tồn tại hay không
    if (!table) {
      return res.status(404).json({ msg: "Table not found" });
    }

    // Kiểm tra nếu bàn là bàn mang đi thì không cho phép chỉnh sửa
    if (table.isTakeaway) {
      return res.status(403).json({ msg: "Cannot edit takeaway tables." });
    }

    // Cập nhật thông tin bàn
    table.seats = seats !== undefined ? seats : table.seats;
    table.status = status !== undefined ? status : table.status;
    table.location = location !== undefined ? location : table.location;

    await table.save();

    res.json({ msg: "Table updated", table });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Xóa bàn
router.delete("/:id", isMerchant, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ msg: "Table not found" });
    }

    if (table.isTakeaway) {
      return res.status(403).json({ msg: "Cannot delete takeaway tables." });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.json({ msg: "Table deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
