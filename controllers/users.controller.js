const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User } = require("../models/index.js") 
const { getFromCache, saveToCache } = require("../services/redis.service.js")

const JWT_EXPIRE = "1d" 

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" })

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    })

    res.status(201).json({ message: "User registered", userId: newUser.id })
  } catch (error) {
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" })

    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(400).json({ error: "Invalid email or password" })

    const payload = { id: user.id, email: user.email }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    })

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: "strict",
    })

    res.json({ message: "Login successful" })
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message })
  }
}

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
  res.json({ message: "Logged out successfully" })
}

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    })

    if (!user) return res.status(404).json({ error: "User not found" })

    res.json(user)
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message })
  }
}

exports.getAllUsers = async (req, res) => {
  const cacheKey = "users:all"

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.json({ fromCache: true, users: cached })

    const users = await User.findAll({ attributes: { exclude: ["password"] } })
    await saveToCache(cacheKey, users)

    res.json({ fromCache: false, users })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" })
  }
}
