const cron = require("node-cron");
const {  User, UserProject, Notification, DailyScrum } = require("../models/index.js");
const { deleteFromCache } = require("../services/redis.service.js");
const { Op } = require("sequelize");

function notificationJobs(io) {
//   cron.schedule("0 18 * * *", async () => {
  cron.schedule("* * * * *", async () => {
    try {
      const userProjects = await UserProject.findAll({ include: User });

      for (const member of userProjects) {
        await Notification.create({
          user_id: member.user_id,
          type: "reminder",
          message: "อย่าลืมโพสต์ Daily Scrum วันนี้นะ!",
        });

        await deleteFromCache(`notifications:${member.user_id}`);

        io.to(member.user_id.toString()).emit("notification", {
          type: "reminder",
          message: "อย่าลืมโพสต์ Daily Scrum วันนี้นะ!",
        });
      }
    } catch (err) {
      console.error("[6PM Reminder] Job failed:", err);
    }
  });

  cron.schedule("0 19 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userProjects = await UserProject.findAll({ include: User });

      for (const member of userProjects) {
        const hasPosted = await DailyScrum.findOne({
          where: {
            user_project_id: member.id,
            created_at: { [Op.gte]: today },
          },
        });

        if (!hasPosted) {
          await Notification.create({
            user_id: member.user_id,
            type: "missed",
            message: "คุณยังไม่ได้โพสต์ Daily Scrum วันนี้นะ!",
          });

          await deleteFromCache(`notifications:${member.user_id}`);

          io.to(member.user_id.toString()).emit("notification", {
            type: "missed",
            message: "คุณยังไม่ได้โพสต์ Daily Scrum วันนี้นะ!",
          });
        }
      }
    } catch (err) {
      console.error("[7PM Missed] Job failed:", err);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    console.log("Running Cleanup Job");
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 30);

    const deleted = await Notification.destroy({
      where: {
        created_at: {
          [Op.lt]: thresholdDate,
        },
      },
    });

    console.log(`Deleted ${deleted} old notifications`);
  });
}

module.exports = { notificationJobs };
