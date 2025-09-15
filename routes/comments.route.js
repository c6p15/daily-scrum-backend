const express = require('express')
const router = express.Router()
const commentController = require('../controllers/comments.controller.js')
const auth = require("../middleware/auth.js")

router.get('/:post_id', commentController.getAllComments)
router.post('/:post_id', auth, commentController.createComment)

router.get('/comment/:id', commentController.getCommentById)
router.put('/comment/:id', auth, commentController.updateComment)
router.delete('/comment/:id', auth, commentController.deleteComment)

module.exports = router