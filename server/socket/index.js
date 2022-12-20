const SocketIo = require('socket.io');

let io;

const init = (server) => {
  io = SocketIo(server, {
    cors: {
      origin: "*",
      methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
    }
  });
  io.on("connection", (socket) => {
    socket.on("disconnect", (reason) => {
      for (const [key, socketId] of Object.entries(userToSocketId)) {
        if (socketId === socket.id) {
          delete userToSocketId[key];
        }
      }
    });

    socket.on("authenticate", (data) => {
      const {
        userAddress
      } = data;
      if (!userAddress) {
        socket.emit('authenticateResult', 'userAddress is required');
      }
      userToSocketId[userAddress] = socket.id;
      socket.emit('authenticateResult', 'socket connected');
    });
  });
}

const userToSocketId = {};

const trySendSocket = async (userAddress, event, data) => {
  try {
    const socketId = userToSocketId[userAddress];
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  init,
  getSocketIo: () => io,
  trySendSocket
};
