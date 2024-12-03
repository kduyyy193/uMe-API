const tablesRoutes = require("./tables");
const authRoutes = require("./auth");
const categoryRoutes = require("./category");
const menuRoutes = require("./menu");
const orderRoutes = require("./orders");
const checkoutRoutes = require("./checkout");
const reportsRoutes = require("./report");
const ingredientRoutes = require("./ingredients");
const inventoryRoutes = require("./inventory");

const initRoutes = (app) => {
  app.use("/api/tables", tablesRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/category", categoryRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/checkout", checkoutRoutes);
  app.use("/api/report", reportsRoutes);
  app.use("/api/ingredients", ingredientRoutes);
  app.use("/api/inventory", inventoryRoutes);

  app.use("/", (_, res) => {
    res.send("Hello World!");
  });
};

module.exports = initRoutes;
