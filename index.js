const express = require('express')
const socketio = require('socket.io')
const path = require('path')
const http = require('http')
const dotenv = require('dotenv')
const { addUser, removeUser, getList } = require('./utils/users')

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, 'client')))

//Run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId }) => {
    const user = addUser(socket.id, roomId)
    socket.join(user.roomId)
    console.log(`User ${user.id} joined room:`, user.roomId)
    console.log(getList())
    // socket.broadcast.to(user.room).emit("PeerJoined", {id:user.id,room:user.room});
  })
  socket.on('MessagePeer', ({ roomId, data, type }) => {
    socket.broadcast.to(roomId).emit('MessageFromPeer', { data, type })
  })
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    console.log(getList())
    if (user) {
      io.to(user.roomId).emit('PeerLeft', user.id)
      console.log(`User ${user.id} left room:`, user.roomId)
    }
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
