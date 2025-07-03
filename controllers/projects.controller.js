const { Project } = require("../models/index.js");
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js");

const CACHE_KEY_ALL = "projects:all";

exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline_date, scrum_time } = req.body;

    const newProject = await Project.create({
      title,
      description,
      deadline_date,
      scrum_time,
    });

    await deleteFromCache(CACHE_KEY_ALL);
    res.status(201).json({ message: "Project created", project: newProject });
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const cached = await getFromCache(CACHE_KEY_ALL);
    if (cached) return res.json({ fromCache: true, projects: cached });

    const projects = await Project.findAll({ order: [["created_at", "DESC"]] });
    await saveToCache(CACHE_KEY_ALL, projects);

    res.json({ fromCache: false, projects });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline_date, scrum_time } = req.body;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    await project.update({ title, description, deadline_date, scrum_time });
    await deleteFromCache(CACHE_KEY_ALL);

    res.json({ message: "Project updated", project });
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    await project.destroy();
    await deleteFromCache(CACHE_KEY_ALL);

    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};
