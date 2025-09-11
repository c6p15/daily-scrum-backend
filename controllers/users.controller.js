const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User } = require("../models/index.js")
const { Op } = require("sequelize")
const { handleFilesUpload } = require("../services/fileUpload.service.js")
const { getObjectSignedUrl,deleteFile } = require("../services/storage.service.js")
const { redisClient } = require("../configs/redis.js")
const { sendMail } = require("../services/mailer.service.js")
const generateOtp = require("../utils/generateOtp.util.js")
const { deleteFromCache } = require("../services/redis.service.js")

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" })

    const hashedPassword = await bcrypt.hash(password, 10)

    let profilePicFilename = null

    if (req.file) {
      const uploaded = await handleFilesUpload([req.file])
      if (uploaded.image.length > 0) {
        profilePicFilename = uploaded.image[0]
      }
    }

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      profile_pic: profilePicFilename,
    })

    res.status(201).json({
      message: "Registered successfully!",
      status: 201,
      userId: newUser.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      error: "Registration failed",
      details: error.message,
    })
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

    const payload = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "1d",
    })

    res.status(200).json({
      message: "Login successfully!",
      status: 200,
      token,
    })
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message })
  }
}

exports.editProfile = async (req, res) => {
  try {
    const userId = req.user.id
    if (!userId) return res.status(401).json({ error: "Unauthorized" })

    const user = await User.findByPk(userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const { firstname, lastname, email, password } = req.body

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } })
      if (existing)
        return res.status(400).json({ error: "Email already in use" })
    }

    let profilePicFilename = user.profile_pic

    if (req.file) {
      const uploaded = await handleFilesUpload([req.file])

      if (uploaded.image.length > 0) {
        if (
          user.profile_pic &&
          !user.profile_pic.startsWith("https://") &&
          !user.profile_pic.startsWith("http://")
        ) {
          await deleteFile(user.profile_pic)
        }

        profilePicFilename = uploaded.image[0]
      }
    }

    const updatedData = {
      firstname: firstname ?? user.firstname,
      lastname: lastname ?? user.lastname,
      email: email ?? user.email,
      profile_pic: profilePicFilename,
    }

    if (password) {
      updatedData.password = await bcrypt.hash(password, 10)
    }

    await user.update(updatedData)
    await user.reload()

    await deleteFromCache("projects:all")

    const profile_pic_url =
      profilePicFilename &&
      !profilePicFilename.startsWith("https://") &&
      !profilePicFilename.startsWith("http://")
        ? await getObjectSignedUrl(profilePicFilename)
        : profilePicFilename

    res.status(200).json({
      message: "Profile updated successfully!",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        profile_pic: profile_pic_url,
      },
    })
  } catch (err) {
    console.error("Edit profile error:", err)
    res.status(500).json({ error: "Update failed", details: err.message })
  }
}

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    })

    if (!user) return res.status(404).json({ error: "User not found" })

    const userData = user.toJSON()

    if (
      userData.profile_pic &&
      !userData.profile_pic.startsWith("https://") &&
      !userData.profile_pic.startsWith("http://")
    ) {
      userData.profile_pic = await getObjectSignedUrl(userData.profile_pic)
    }

    res.status(200).json({
      message: "Fetch user's info successfully!",
      status: 200,
      user: userData,
    })
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message })
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

exports.getAllUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.id

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: loggedInUserId },
      },
      attributes: { exclude: ["email", "password", "created_at"] },
    })

    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        const userData = user.toJSON()

        if (
          userData.profile_pic &&
          !userData.profile_pic.startsWith("https://") &&
          !userData.profile_pic.startsWith("http://")
        ) {
          userData.profile_pic = await getObjectSignedUrl(userData.profile_pic)
        }

        return userData
      })
    )

    res.status(200).json({
      message: "Fetch users successfully!",
      status: 200,
      users: updatedUsers,
    })
  } catch (err) {
    console.error("getAllUsers error:", err)
    res.status(500).json({ error: "Failed to fetch users" })
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(404).json({ error: "User not found" })

    const otp = generateOtp()
    const key = `otp:${email}`

    await redisClient.setEx(key, 600, otp)

    sendMail({
      to: email,
      subject: "Reset Your Password - OTP Code",
      html: `<p>Your OTP code is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
    })
      .then(() => {
        console.log(`OTP email sent to ${email}`)
      })
      .catch((err) => {
        console.error(`OTP email failed to send to ${email}:`, err)
      })

    res.status(200).json({ message: "OTP sent to your email.", status: 200 })
  } catch (err) {
    console.error("Forgot password (OTP) error:", err)
    res.status(500).json({ error: "Failed to send OTP" })
  }
}

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(404).json({ error: "User not found" })

    const otp = generateOtp()
    const key = `otp:${email}`

    await redisClient.setEx(key, 600, otp)

    sendMail({
      to: email,
      subject: "Resend OTP Code - Reset Your Password",
      html: `<p>Your new OTP code is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
    })
      .then(() => {
        console.log(`OTP re-sent to ${email}`)
      })
      .catch((err) => {
        console.error(`Failed to resend OTP to ${email}:`, err)
      })

    res.status(200).json({ message: "OTP resent to your email.", status: 200 })
  } catch (err) {
    console.error("Resend OTP error:", err)
    res.status(500).json({ error: "Failed to resend OTP" })
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(404).json({ error: "User not found" })

    const key = `otp:${email}`
    const storedOtp = await redisClient.get(key)

    if (!storedOtp) {
      return res.status(400).json({ error: "OTP expired or not found" })
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" })
    }

    await redisClient.del(key)

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    )

    res.status(200).json({
      message: "OTP verified successfully",
      status: 200,
      token,
    })
  } catch (err) {
    console.error("OTP verify error:", err)
    res.status(500).json({ error: "OTP verification failed" })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token) return res.status(400).json({ error: "Token is required" })

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired token" })
    }

    const user = await User.findByPk(payload.id)
    if (!user) return res.status(404).json({ error: "User not found" })

    const hashed = await bcrypt.hash(newPassword, 10)
    await user.update({ password: hashed })

    res
      .status(200)
      .json({ message: "Password has been reset successfully", status: 200 })
  } catch (err) {
    console.error("Reset password error:", err)
    res.status(500).json({ error: "Failed to reset password" })
  }
}