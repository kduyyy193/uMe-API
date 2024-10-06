const mongoose = require("mongoose");
const Menu = require("../models/Menu");
require('dotenv').config();

const defaultMenuItems = [
  {
    name: "Phở Bò",
    quantity: 100,
    price: 50000,
    description: "Món ăn truyền thống của Việt Nam",
  },
  {
    name: "Bánh Mì",
    quantity: 200,
    price: 20000,
    description: "Bánh mì kẹp thịt",
  },
  {
    name: "Gà Rán",
    quantity: 150,
    price: 70000,
    description: "Gà rán giòn rụm",
  },
  { name: "Mì Ý", quantity: 80, price: 60000, description: "Mì Ý sốt cà chua" },
  {
    name: "Cơm Tấm",
    quantity: 120,
    price: 45000,
    description: "Cơm tấm với sườn nướng",
  },
  {
    name: "Nem Rán",
    quantity: 90,
    price: 30000,
    description: "Nem rán giòn ngon",
  },
  {
    name: "Sushi",
    quantity: 70,
    price: 80000,
    description: "Món sushi Nhật Bản",
  },
  {
    name: "Bò Lúc Lắc",
    quantity: 60,
    price: 75000,
    description: "Bò lúc lắc thơm ngon",
  },
  {
    name: "Salad",
    quantity: 100,
    price: 25000,
    description: "Salad rau củ tươi ngon",
  },
  {
    name: "Trà Sữa",
    quantity: 200,
    price: 30000,
    description: "Trà sữa truyền thống",
  },
];

const seedMenu = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Menu.deleteMany({});

    await Menu.insertMany(defaultMenuItems);
    console.log("Menu đã được khởi tạo với 10 món ăn mặc định!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Lỗi khi khởi tạo menu:", error);
    mongoose.connection.close();
  }
};

seedMenu();
