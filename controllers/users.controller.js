const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/index.js"); // from your models/index.js
const { getFromCache, saveToCache } = require("../services/redis.service.js");

const JWT_EXPIRE = "1d"; // Token expiration

// Register new user
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered", userId: newUser.id });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: "Invalid email or password" });

    // Create JWT payload (include only needed info)
    const payload = { id: user.id, email: user.email };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    });

    // Set cookie (httpOnly + secure in production)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "strict",
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

// Logout user (clear cookie)
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
};

// Show logged-in user profile
exports.profile = async (req, res) => {
  try {
    // req.user is set by your JWT middleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const cacheKey = "users:all";

  try {
    const cached = await getFromCache(cacheKey);
    if (cached) return res.json({ fromCache: true, users: cached });

    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    await saveToCache(cacheKey, users);

    res.json({ fromCache: false, users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
