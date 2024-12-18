const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");
require("dotenv").config();

// Kết nối MongoDB
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

// Seed dữ liệu nguyên liệu
const seedIngredients = async () => {
  try {
    // Xóa dữ liệu cũ
    await Ingredient.deleteMany();

    // Tạo dữ liệu nguyên liệu
    const ingredients = await Ingredient.create([
      { name: "Bột mì", quantity: 100, unit: "kg" },
      { name: "Đường", quantity: 50, unit: "kg" },
      { name: "Bơ", quantity: 30, unit: "kg" },
      { name: "Trứng gà", quantity: 200, unit: "quả" },
      { name: "Sữa tươi", quantity: 100, unit: "lít" },
      { name: "Đường", quantity: 50, unit: "kg" },
      { name: "Muối", quantity: 20, unit: "kg" },
      { name: "Dầu ăn", quantity: 30, unit: "lít" },
      { name: "Gạo", quantity: 200, unit: "kg" },
      { name: "Thịt bò", quantity: 50, unit: "kg" },
      { name: "Thịt gà", quantity: 60, unit: "kg" },
      { name: "Hành tím", quantity: 15, unit: "kg" },
      { name: "Tỏi", quantity: 10, unit: "kg" },
      { name: "Ớt", quantity: 5, unit: "kg" },
      { name: "Sữa tươi", quantity: 20, unit: "lít" },
      { name: "Tôm sú", quantity: 50, unit: "kg" },
      { name: "Cá hồi", quantity: 30, unit: "kg" },
      { name: "Mực ống", quantity: 40, unit: "kg" },
      { name: "Nghêu", quantity: 20, unit: "kg" },
      { name: "Cua biển", quantity: 25, unit: "kg" },
      { name: "Hàu", quantity: 15, unit: "kg" },
      { name: "Sò điệp", quantity: 10, unit: "kg" },
      { name: "Bạch tuộc", quantity: 35, unit: "kg" }

    ]);

    console.log("Nguyên liệu đã được tạo thành công!", ingredients);
  } catch (err) {
    console.error("Lỗi khi tạo nguyên liệu:", err);
  }
};

// Ngắt kết nối MongoDB
const disconnectDB = () => {
  mongoose.disconnect()
    .then(() => console.log("Đã ngắt kết nối MongoDB"))
    .catch(err => console.error("Lỗi khi ngắt kết nối MongoDB:", err));
};

// Seed dữ liệu
const seedDatabase = async () => {
  await connectDB();
  await seedIngredients();
  disconnectDB();
};

seedDatabase();
