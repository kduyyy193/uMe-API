const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const socketMiddleware = require("./middlewares/socketMiddleware"); // Import middleware
const initRoutes = require("./routes/initRoutes");
const connectDB = require("./db");
const createDefaultTable = require("./heplers/createDefaultTable");
const setupSocket = require("./socket");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const server = http.createServer(app);
const io = setupSocket(server);
app.use(socketMiddleware(io));

initRoutes(app);
connectDB(process.env.MONGO_URI);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
