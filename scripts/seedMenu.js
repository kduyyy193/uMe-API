const mongoose = require("mongoose");
const Category = require("../models/Category");
const Menu = require("../models/Menu");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);  // Dừng script nếu không thể kết nối tới MongoDB
  }
};

const seedCategoriesAndMenus = async () => {
  try {
    // Xóa tất cả dữ liệu trong Category và Menu
    await Category.deleteMany();
    await Menu.deleteMany();

    // Tạo các Category
    const categories = await Category.create([
      { name: 'Lẩu', description: 'Món ăn lẩu phong phú và đa dạng' },
      { name: 'Nướng', description: 'Các món nướng thơm ngon, hấp dẫn' },
      { name: 'Ốc', description: 'Món ốc tươi ngon, đậm đà hương vị' },
      { name: 'Thức uống', description: 'Nước giải khát và các loại đồ uống hấp dẫn' },
    ]);

    // Tạo món ăn cho từng Category
    await createMenuForCategory(categories[0]._id, 'Lẩu');  // Lẩu
    await createMenuForCategory(categories[1]._id, 'Nướng'); // Nướng
    await createMenuForCategory(categories[2]._id, 'Ốc');    // Ốc
    await createMenuForCategory(categories[3]._id, 'Thức uống'); // Thức uống

    console.log("Successfully seeded categories and menus!");
  } catch (err) {
    console.error("Error seeding categories and menus:", err);
  }
};

const createMenuForCategory = async (categoryId, categoryName) => {
  const menuItems = getMenuItemsForCategory(categoryName);
  
  const menu = menuItems.map(item => ({
    ...item,
    category: categoryId,
  }));

  await Menu.create(menu);
  console.log(`Menu items for category "${categoryName}" created.`);
};

// Hàm trả về danh sách món ăn cho từng category
const getMenuItemsForCategory = (categoryName) => {
  switch (categoryName) {
    case 'Lẩu':
      return [
        { name: 'Lẩu Thái', price: 150000, description: 'Lẩu Thái chua cay đậm đà', quantity: 10 },
        { name: 'Lẩu Hải Sản', price: 180000, description: 'Lẩu hải sản tươi ngon, ngọt nước', quantity: 12 },
        { name: 'Lẩu Gà Đông Tảo', price: 220000, description: 'Lẩu gà Đông Tảo với nước dùng thơm ngon', quantity: 8 },
      ];
    case 'Nướng':
      return [
        { name: 'Sườn Nướng Mắm', price: 120000, description: 'Sườn nướng mắm đậm đà hương vị', quantity: 15 },
        { name: 'Ba Rọi Nướng', price: 130000, description: 'Ba rọi nướng thơm lừng, ngọt thịt', quantity: 20 },
        { name: 'Lươn Nướng Mỡ Hành', price: 150000, description: 'Lươn nướng mỡ hành béo ngậy, đậm đà', quantity: 10 },
      ];
    case 'Ốc':
      return [
        { name: 'Ốc Hương Nướng Mỡ Hành', price: 90000, description: 'Ốc hương nướng mỡ hành thơm ngon', quantity: 25 },
        { name: 'Ốc Len Xào Dừa', price: 110000, description: 'Ốc len xào dừa béo ngậy, thơm lừng', quantity: 20 },
        { name: 'Ốc Nhồi Thịt', price: 100000, description: 'Ốc nhồi thịt, sốt bơ béo ngậy', quantity: 18 },
      ];
    case 'Thức uống':
      return [
        { name: 'Trà Sữa', price: 35000, description: 'Trà sữa ngọt ngào, thơm ngon', quantity: 50 },
        { name: 'Sinh Tố', price: 25000, description: 'Sinh tố hoa quả tươi mát, bổ dưỡng', quantity: 40 },
        { name: 'Nước Mía', price: 15000, description: 'Nước mía tươi ngọt, giải khát tuyệt vời', quantity: 30 },
      ];
    default:
      return [];
  }
};

const disconnectDB = () => {
  mongoose.disconnect()
    .then(() => console.log("Disconnected from MongoDB"))
    .catch(err => console.error("Error disconnecting from MongoDB:", err));
};

const seedDatabase = async () => {
  await connectDB();
  await seedCategoriesAndMenus();
  disconnectDB();
};

seedDatabase();
