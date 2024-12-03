const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");
const InventoryHistory = require("../models/InventoryHistory");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Đã kết nối MongoDB!");
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1);
  }
};

const seedHistory = async () => {
  try {
    // Xóa dữ liệu lịch sử cũ
    await InventoryHistory.deleteMany();

    // Lấy danh sách nguyên liệu
    const ingredients = await Ingredient.find();
    if (ingredients.length === 0) {
      throw new Error("Không có nguyên liệu nào. Vui lòng seed nguyên liệu trước.");
    }

    // Tạo dữ liệu lịch sử
    const historyData = [
      {
        ingredientId: ingredients[0]._id,
        type: "IN",
        quantity: 100,
        description: "Nhập kho đầu kỳ cho nguyên liệu đầu tiên",
        date: new Date(),
      },
      {
        ingredientId: ingredients[1]._id,
        type: "IN",
        quantity: 50,
        description: "Nhập kho nguyên liệu thứ hai",
        date: new Date(),
      },
      {
        ingredientId: ingredients[2]._id,
        type: "OUT",
        quantity: 20,
        description: "Xuất kho sử dụng cho nhà bếp",
        date: new Date(),
      },
    ];

    // Lưu vào cơ sở dữ liệu
    await InventoryHistory.insertMany(historyData);
    console.log("Dữ liệu lịch sử nhập/xuất kho đã được seed thành công!");
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu lịch sử nhập/xuất kho:", error);
  } finally {
    mongoose.disconnect();
  }
};

const seedDatabase = async () => {
  await connectDB();
  await seedHistory();
};

seedDatabase();
