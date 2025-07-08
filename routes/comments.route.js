const express = require('express')
const router = express.Router()
const commentController = require('../controllers/comments.controller.js')
const auth = require("../middleware/auth.js")

router.get('/:daily_scrum_id', commentController.getAllComments)
router.get('/:daily_scrum_id', auth, commentController.createComment)

router.get('/:daily_scrum_id/:id', commentController.getCommentById)
router.put('/:daily_scrum_id/:id', auth, commentController.updateComment)
router.get('/:daily_scrum_id/:id', auth, commentController.createComment)

module.exports = router