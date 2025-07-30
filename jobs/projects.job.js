const cron = require("node-cron")
const { Project } = require("../models/index.js")
const { Op } = require("sequelize")
const { deleteFromCache } = require("../services/redis.service.js")

function projectJob() {
    cron.schedule("* * * * *", async () => {
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
          console.log(`✅ Updated ${updatedCount} projects status to done`)
          await deleteFromCache("projects:all")
        } else {
          console.log("⏱ No projects needed updating")
        }
      } catch (error) {
        console.error("❌ Error updating projects status:", error)
      }
    })
  }

module.exports = { projectJob }