const express = require('express')
const router = express.Router()
const projectController = require('../controllers/projects.controller.js')
const auth = require('../middleware/auth.js')

router.get('/', projectController.getAllProjects)
router.get('/:id', projectController.getProjectById)
router.post('/', auth, projectController.createProject)
router.put('/:id', auth, projectController.updateProject)
router.delete('/:id', auth, projectController.deleteProject)

module.exports = router