const express = require('express')
const multer = require('multer')
const router = express.Router()
const postController = require('../controllers/posts.controller.js')
const auth = require('../middleware/auth.js')

const upload = multer()

router.get('/project/:id', postController.getAllPosts)
router.get('/:id', postController.getPostById)
router.post('/', auth, upload.array('files'), postController.createPost)
router.put('/:id', auth, upload.array('files'), postController.updatePost)
router.delete('/:id/file', auth, postController.deleteSingleFile)
router.delete('/:id', auth, postController.deletePost)

module.exports = router