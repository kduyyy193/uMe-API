const { Server } = require("socket.io");

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.emit('connected', 'You are successfully connected to the server!');

    socket.on("clientMessage", (data) => {
      console.log(`Message from client: ${data}`);
      socket.emit("serverResponse", `Server received your message: ${data}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSocket;
