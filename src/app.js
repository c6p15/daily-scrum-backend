const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const { createAdapter } = require("@socket.io/redis-adapter")
const { createClient } = require("redis")
const { connectRedis } = require("../configs/redis.js") 
const { connectDB } = require("../configs/db.js")
const cookieParser = require("cookie-parser")
const storage = require("../services/storage.service.js")
const path = require("path")
const { notificationJobs } = require('../jobs/notifications.job.js')

const cors = require('cors')
const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.frontend_url,
    credentials: true,
  },
})

app.use(
  cors({
    origin: process.env.frontend_url,
    credentials: true
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/files", express.static(path.join(__dirname, "../uploads")))

app.get("/api/files/:filename", async (req, res) => {
  try {
    const filename = req.params.filename
    const storageDriver =
      process.env.STORAGE_DRIVER ||
      (process.env.NODE_ENV === "development" ? "local" : "s3")

    if (storageDriver === "s3") {
      const signedUrl = await storage.getObjectSignedUrl(filename)
      return res.redirect(signedUrl)
    } else {
      const storagePath = process.env.STORAGE_PATH || "./uploads"
      const absoluteStoragePath = path.resolve(storagePath)
      const filePath = path.join(absoluteStoragePath, filename)
      return res.sendFile(filePath)
    }
  } catch (error) {
    console.error(`Error serving file: ${error.message}`)
    return res.status(404).json({ message: "File not found" })
  }
})

const userRoutes = require('../routes/users.route.js')
const projectRoutes = require('../routes/projects.route.js')
const dailyScrumRoutes = require('../routes/dailyScrum.route.js')
const commentRoutes = require('../routes/comments.route.js')
const oauthRoutes = require('../routes/oauth.route.js')
const notificationRoutes = require('../routes/notification.route.js')

app.use('/auth', oauthRoutes)
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/daily-scrum', dailyScrumRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/notifications', notificationRoutes)

async function startServer() {
  try {
    await connectDB()
    await connectRedis()

    const pubClient = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` })
    const subClient = pubClient.duplicate()

    await pubClient.connect()
    await subClient.connect()

    io.adapter(createAdapter(pubClient, subClient))
    global._io = io

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join", (userId) => {
        if (userId) {
          socket.join(userId.toString())
          console.log(`Socket ${socket.id} joined room for user ${userId}`)
        }
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })

    notificationJobs(io)

    server.listen(3000, () => {
      console.log("🚀 Server is running on port 3000")
    })

  } catch (err) {
    console.error("❌ Startup error:", err)
  }
}

startServer()
