const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User } = require("../models/index.js") 
const { getFromCache, saveToCache } = require("../services/redis.service.js")

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

    res.status(201).json({ message: "Registered successfully!", status: 201, userId: newUser.id })
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
      expiresIn: process.env.JWT_EXPIRE || "1d",
    })

    res.status(200).json({
      message: "Login successfully!",
      status: 200,
      token
    })
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message })
  }
}

exports.logout = (req, res) => {
  const expiredToken = jwt.sign({}, process.env.JWT_SECRET, {
    expiresIn: 0, 
  })

  return res.status(200).json({
    message: "Logged out successfully!",
    expiredToken,
  })
}

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    })

    if (!user) return res.status(404).json({ error: "User not found" })

    res.status(200).json({ message: `Fetch user's info successfully!`, status: 200, user })
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } })

    res.status(200).json({ users })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" })
  }
}
