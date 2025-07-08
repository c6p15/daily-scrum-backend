const express = require('express')
const multer = require('multer')
const router = express.Router()
const dailyScrumController = require('../controllers/dailyScrum.controller.js')
const auth = require('../middleware/auth.js')

const upload = multer();

router.get('/', dailyScrumController.getAllDailyScrums)
router.get('/:id', dailyScrumController.getDailyScrumById)
router.post('/', auth, upload.array('files'), dailyScrumController.createDailyScrum)
router.put('/:id', auth, upload.array('files'), dailyScrumController.updateDailyScrum)
router.delete('/:id/file', auth, dailyScrumController.deleteSingleFile)
router.delete('/:id', auth, dailyScrumController.deleteDailyScrum)

module.exports = router