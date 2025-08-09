const cron = require("node-cron")
const { Project } = require("../models/index.js")
const { Op } = require("sequelize")
const { deleteFromCache } = require("../services/redis.service.js")

function projectJob() {
  (async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)

      const [updatedCount] = await Project.update(
        { status: "done" },
        {
          where: {
            deadline_date: { [Op.lte]: today },
            status: { [Op.ne]: "done" },
          },
        }
      )

      if (updatedCount > 0) {
        await deleteFromCache("projects:all")
      }
    } catch (error) {
    }
  })()

  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)

      const [updatedCount] = await Project.update(
        { status: "done" },
        {
          where: {
            deadline_date: { [Op.lte]: today },
            status: { [Op.ne]: "done" },
          },
        }
      )

      if (updatedCount > 0) {
        await deleteFromCache("projects:all")
      }
    } catch (error) {
    }
  })
}

module.exports = { projectJob }