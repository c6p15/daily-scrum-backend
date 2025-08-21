const cron = require("node-cron")
const moment = require("moment")
const { User, UserProject, Project, Notification, DailyScrum } = require("../models/index.js")
const { deleteFromCache, getFromCache, saveToCache } = require("../services/redis.service.js")
const { Op } = require("sequelize")

async function checkNotifications(io) {
  const now = moment()
  const todayKey = now.format("YYYY-MM-DD")

  try {
    const projects = await Project.findAll()

    for (const project of projects) {
      if (!project.scrum_time) continue

      const scrumTime = moment(project.scrum_time, "HH:mm:ss")
      const reminderTime = scrumTime.clone().subtract(30, "minutes")
      const lateTime = scrumTime.clone().add(1, "hour")

      const userProjects = await UserProject.findAll({
        where: { project_id: project.id },
        include: [User],
      })

      const diffReminder = now.diff(reminderTime, "minutes")
      const diffLate = now.diff(lateTime, "minutes")

      if (diffReminder >= 0 && diffReminder < 10) {
        const reminderKey = `notified:reminder:${project.id}:${todayKey}`
        const alreadySent = await getFromCache(reminderKey)

        if (!alreadySent) {
          console.log(`[REMINDER] Sending reminder for project ${project.id} (${project.title})`)

          for (const member of userProjects) {
            await Notification.create({
              user_id: member.user_id,
              type: "reminder",
              project_id: project.id,
              daily_scrum_id: null,
              comment_id: null,
              message: `อย่าลืมโพสต์ Daily Scrum ของ ${project.title} วันนี้นะ!`,
            })

            await deleteFromCache(`notifications:user:${member.user_id}`)
            io.to(member.user_id.toString()).emit("notification", {
              type: "reminder",
              project_id: project.id,
              message: `อย่าลืมโพสต์ Daily Scrum ของ ${project.title} วันนี้นะ!`,
            })
            io.to(member.user_id.toString()).emit("notification:update")
          }

          await saveToCache(reminderKey, true, 60 * 60 * 6) 
        }
      }

      if (diffLate >= 0 && diffLate < 10) {
        const lateKey = `notified:late:${project.id}:${todayKey}`
        const alreadySent = await getFromCache(lateKey)

        if (!alreadySent) {
          console.log(`[LATE NOTICE] Sending late notice for project ${project.id} (${project.title})`)

          const todayStart = moment().startOf("day").toDate()

          for (const member of userProjects) {
            const hasPosted = await DailyScrum.findOne({
              where: {
                user_project_id: member.id,
                created_at: { [Op.gte]: todayStart },
              },
            })

            if (!hasPosted) {
              await Notification.create({
                user_id: member.user_id,
                type: "late_notice",
                project_id: project.id,
                daily_scrum_id: null,
                comment_id: null,
                message: `คุณยังไม่ได้โพสต์ Daily Scrum ของ ${project.title} วันนี้นะ!`,
              })

              await deleteFromCache(`notifications:user:${member.user_id}`)
              io.to(member.user_id.toString()).emit("notification", {
                type: "late_notice",
                project_id: project.id,
                message: `คุณยังไม่ได้โพสต์ Daily Scrum ของ ${project.title} วันนี้นะ!`,
              })
              io.to(member.user_id.toString()).emit("notification:update")
            }
          }

          await saveToCache(lateKey, true, 60 * 60 * 6) 
        }
      }
    }
  } catch (err) {
    console.error("[Dynamic Scrum Jobs] failed:", err)
  }
}

function notificationJobs(io) {
  checkNotifications(io).catch(err => console.error("[Startup Notification Check] failed:", err))

  cron.schedule("*/10 * * * *", async () => {
    await checkNotifications(io)
  })

  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running Cleanup Job")

      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() - 30)

      const deleted = await Notification.destroy({
        where: {
          created_at: {
            [Op.lt]: thresholdDate,
          },
        },
      })

      console.log(`Deleted ${deleted} old notifications`)
    } catch (err) {
      console.error("Cleanup Job Error:", err.message)
    }
  })
}

module.exports = { notificationJobs, checkNotifications }