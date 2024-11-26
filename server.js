const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const tablesRoutes = require("./routes/tables");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const checkoutRoutes = require("./routes/checkout");
const reportRoutes = require("./routes/report");
require("dotenv").config();

const createDefaultTable = require("./heplers/createDefaultTable");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Kết nối DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    createDefaultTable(); // Tạo cái bàn take away
  })
  .catch((err) => console.log(err));

app.use("/api/tables", tablesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/report", reportRoutes);

app.use("/", (_, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
