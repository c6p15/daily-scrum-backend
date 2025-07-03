const { DailyScrum, UserProject } = require("../models/index.js");
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js");

exports.getAllDailyScrums = async (req, res) => {
  const cacheKey = `dailyscrums:all`;

  try {
    const cached = await getFromCache(cacheKey);
    if (cached) return res.json({ scrums: cached });

    const scrums = await DailyScrum.findAll({
      include: {
        model: UserProject,
        include: ["Project", "User"],
      },
    });

    await saveToCache(cacheKey, scrums);
    res.json({ scrums });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.getDailyScrumById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `dailyscrum:one:${id}`;

  try {
    const cached = await getFromCache(cacheKey);
    if (cached) return res.json({ scrum: cached });

    const scrum = await DailyScrum.findByPk(id, {
      include: {
        model: UserProject,
        include: ["Project", "User"],
      },
    });

    if (!scrum) {
      return res.status(404).json({ error: "Scrum not found" });
    }

    await saveToCache(cacheKey, scrum);
    res.json({ scrum });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.createDailyScrum = async (req, res) => {
  const userId = req.user.id;
  const { project_id, ...rest } = req.body;

  try {
    const userProject = await UserProject.findOne({
      where: { user_id: userId, project_id },
    });

    if (!userProject) {
      return res
        .status(403)
        .json({ error: "You are not part of this project" });
    }

    const scrum = await DailyScrum.create({
      ...rest,
      user_project_id: userProject.id,
    });

    // Invalidate cache
    await deleteFromCache(`dailyscrums:user:${userId}`);
    await deleteFromCache(`dailyscrums:project:${project_id}`);

    res.status(201).json({ message: "Scrum created", scrum });
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message });
  }
};

exports.updateDailyScrum = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const scrum = await DailyScrum.findByPk(id, {
      include: {
        model: UserProject,
        include: ["Project"], // optional, only if you want to clear project cache
      },
    });

    if (!scrum || scrum.UserProject.user_id !== userId) {
      return res.status(403).json({ error: "You can't edit this post" });
    }

    const {
      type,
      today_task,
      problem,
      problem_level,
      tomorrow_task,
      good,
      bad,
      try: tryText,
      next_sprint,
    } = req.body;

    await scrum.update({
      type,
      today_task,
      problem,
      problem_level,
      tomorrow_task,
      good,
      bad,
      try: tryText,
      next_sprint,
    });

    // Invalidate related Redis keys
    await deleteFromCache(`dailyscrum:one:${id}`);
    await deleteFromCache(`dailyscrums:user:${userId}`);
    if (scrum.UserProject?.project_id) {
      await deleteFromCache(
        `dailyscrums:project:${scrum.UserProject.project_id}`
      );
    }

    res.json({ message: "Daily Scrum updated", scrum });
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

exports.deleteDailyScrum = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const scrum = await DailyScrum.findByPk(id, {
      include: {
        model: UserProject,
        include: ["Project"], // Optional if you want to clear project-level cache
      },
    });

    if (!scrum || scrum.UserProject.user_id !== userId) {
      return res.status(403).json({ error: "You can't delete this post" });
    }

    // Delete the daily scrum
    await scrum.destroy();

    // Invalidate related Redis keys
    await deleteFromCache(`dailyscrum:one:${id}`);
    await deleteFromCache(`dailyscrums:user:${userId}`);
    if (scrum.UserProject?.project_id) {
      await deleteFromCache(
        `dailyscrums:project:${scrum.UserProject.project_id}`
      );
    }

    res.json({ message: "Daily Scrum deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};
