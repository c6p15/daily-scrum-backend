const { Project, UserProject, User } = require("../models/index.js");
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js");
const { memberInclude, responseWithMembers } = require('../utils/projects.util.js')

exports.getAllProjects = async (req, res) => {
  const cacheKey = "projects:all";

  try {
    const cached = await getFromCache(cacheKey);
    if (cached) return res.json({ fromCache: true, projects: cached });

    const projects = await Project.findAll({
      order: [["created_at", "DESC"]],
      include: memberInclude(),
    });

    const formattedProjects = projects.map(responseWithMembers);
    await saveToCache(cacheKey, formattedProjects);

    res.status(200).json({ projects: formattedProjects });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findByPk(id, {
      include: memberInclude(),
    });
    
    if (!project) return res.status(404).json({ error: "Project not found" });
    
    res.status(200).json(responseWithMembers(project));
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline_date, scrum_time, members = [] } = req.body;
    const userId = req.user.id;

    const newProject = await Project.create({
      title,
      description,
      deadline_date,
      scrum_time,
    });

    await UserProject.create({
      user_id: userId,
      project_id: newProject.id,
      position: "Leader",
      scrum_point: 0,
    });

    for (const member of members) {
      if (member.user_id === userId) continue; 

      const user = await User.findByPk(member.user_id);
      if (user) {
        const exists = await UserProject.findOne({
          where: { user_id: member.user_id, project_id: newProject.id },
        });

        if (!exists) {
          await UserProject.create({
            user_id: member.user_id,
            project_id: newProject.id,
            position: member.position || "Member",
            scrum_point: 0,
          });
        }
      }
    }

    await deleteFromCache(`projects:user:${userId}`);

    const fullProject = await Project.findByPk(newProject.id, {
      include: memberInclude(),
    });

    res.status(201).json({
      message: "Project created",
      project: responseWithMembers(fullProject),
    });
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message });
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline_date, scrum_time, members = [] } = req.body;
  const userId = req.user.id;

  try {
    const link = await UserProject.findOne({
      where: { project_id: id, user_id: userId },
    });

    if (!link || link.position !== "Leader") {
      return res.status(403).json({ error: "Only the project leader can update the project" });
    }

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    await project.update({ title, description, deadline_date, scrum_time });

    const incomingUserIds = members.map(m => m.user_id);

    const currentLinks = await UserProject.findAll({
      where: { project_id: id },
    });

    for (const link of currentLinks) {
      if (link.user_id === userId) continue;

      if (!incomingUserIds.includes(link.user_id)) {
        await link.destroy();
      }
    }

    for (const member of members) {
      if (member.user_id === userId) continue; 

      const existing = await UserProject.findOne({
        where: { user_id: member.user_id, project_id: id },
      });

      if (existing) {
        await existing.update({ position: member.position || "Member" });
      } else {
        await UserProject.create({
          user_id: member.user_id,
          project_id: id,
          position: member.position || "Member",
          scrum_point: 0,
        });
      }
    }

    await deleteFromCache(`projects:user:${userId}`);

    const updatedProject = await Project.findByPk(id, {
      include: memberInclude(),
    });

    res.status(200).json({
      message: "Project updated with synced members",
      project: responseWithMembers(updatedProject),
    });
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const project = await Project.findByPk(id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  try {
    const link = await UserProject.findOne({
      where: { project_id: id, user_id: userId },
    });

    if (!link || link.position !== "Leader") {
      return res.status(403).json({ error: "Only the leader can delete the project" });
    }

    await UserProject.destroy({ where: { project_id: id } });

    await Project.destroy({ where: { id } });

    await deleteFromCache(`projects:user:${userId}`);

    res.status(200).json({ message: "Project deleted!!" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};
