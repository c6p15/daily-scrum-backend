const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const { createAdapter } = require("@socket.io/redis-adapter")
const { createClient } = require("redis")
const { connectRedis } = require("../configs/redis.js") // Your general Redis connection (optional)
const { connectDB } = require("../configs/db.js")        // Sequelize init
const cookieParser = require("cookie-parser")

const app = express()

app.use(express.json())
app.use(cookieParser())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "*" }
})

const userRoutes = require('../routes/users.route.js')

app.use('/api/users', userRoutes)

async function startServer() {
  try {
    await connectDB()
    await connectRedis()

    const pubClient = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` })
    const subClient = pubClient.duplicate()

    await pubClient.connect()
    await subClient.connect()

    io.adapter(createAdapter(pubClient, subClient))

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("chat", (msg) => {
        io.emit("chat", msg) 
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })

    server.listen(3000, () => {
      console.log("Server is running on port 3000")
    })

  } catch (err) {
    console.error("Startup error:", err)
  }
}

startServer()
