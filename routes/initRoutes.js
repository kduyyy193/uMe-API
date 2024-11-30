const tablesRoutes = require("./tables");
const authRoutes = require("./auth");
const categoryRoutes = require("./category");
const menuRoutes = require("./menu");
const orderRoutes = require("./orders");
const checkoutRoutes = require("./checkout");
const reportRoutes = require("./report");

const initRoutes = (app) => {
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
};

module.exports = initRoutes;
