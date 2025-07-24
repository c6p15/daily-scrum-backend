const express = require("express")
const router = express.Router()
const passport = require("../services/passport.service")
const auth = require("../middleware/auth.js")
const jwt = require("jsonwebtoken")

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
)

router.get(
  "/google/callback",
  (req, res, next) => {
    res.locals.redirectState = req.query.state
    next()
  },
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    const frontendURL = res.locals.redirectState || process.env.frontend_url
    res.redirect(`${frontendURL}/login-success?token=${token}`)
  }
)

router.get("/me", auth, async (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
