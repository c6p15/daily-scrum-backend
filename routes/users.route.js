const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller.js");
const auth = require("../middleware/auth.js"); // your JWT middleware

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", auth, userController.logout);
router.get("/profile", auth, userController.profile);
router.get('/all', userController.getAllUsers)

module.exports = router;
