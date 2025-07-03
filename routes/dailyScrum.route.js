const express = require('express')
const router = express.Router()
const dailyScrumController = require('../controllers/dailyScrum.controller.js')
const auth = require('../middleware/auth.js')

router.get('/', dailyScrumController.getAllDailyScrums)
router.get('/:id', dailyScrumController.getDailyScrumById)
router.post('/', auth, dailyScrumController.createDailyScrum)
router.put('/:id', auth, dailyScrumController.updateDailyScrum)
router.delete('/:id', auth, dailyScrumController.deleteDailyScrum)

module.exports = router