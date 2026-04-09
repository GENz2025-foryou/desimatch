const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/desimatch', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Socket.IO for real-time chat and calls
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('call-user', ({ userToCall, signalData, from }) => {
    io.to(userToCall).emit('call-made', { signal: signalData, from });
  });

  socket.on('answer-call', (data) => {
    io.to(data.to).emit('call-answered', data.signal);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));