const express = require("express")
const multer = require('multer')
const router = express.Router()
const userController = require("../controllers/users.controller.js")
const auth = require("../middleware/auth.js")

const upload = multer();

router.post("/register", upload.single('profile_pic'), userController.register)
router.post("/login", userController.login)
router.patch("/edit-profile", auth, upload.single('profile_pic'), userController.editProfile)
router.post("/logout", auth, userController.logout)
router.get("/profile", auth, userController.profile)
router.get('/all', userController.getAllUsers)

router.post("/forgot-password", userController.forgotPassword)
router.post("/reset-password/:token", userController.resetPassword)

module.exports = router
