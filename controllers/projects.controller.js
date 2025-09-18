const { Project, UserProject, User } = require("../models/index.js")
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js")
const { memberInclude, responseWithMembers } = require('../utils/projects.util.js')

exports.getAllProjects = async (req, res) => {
  const cacheKey = "projects:all"

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.json({ message: 'Fetch projects successfully!', status: 200, projects: cached })

    const projects = await Project.findAll({
      order: [["created_at", "DESC"]],
      include: memberInclude(),
    })

    const formattedProjects = await Promise.all(projects.map(responseWithMembers))

    await saveToCache(cacheKey, formattedProjects)

    res.status(200).json({ message: 'Fetch projects successfully!', status: 200, projects: formattedProjects })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.getProjectById = async (req, res) => {
  const { id } = req.params

  try {
    const project = await Project.findByPk(id, {
      include: memberInclude(),
    })

    if (!project) return res.status(404).json({ error: "Project not found" })

    const formattedProject = await responseWithMembers(project)

    res.status(200).json({ message: 'Fetch project successfully!', status: 200, project: formattedProject })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.createProject = async (req, res) => {
  try {
    const { title, description, status, deadline_date, scrum_time, members = [] } = req.body;
    const userId = req.user.id;

    const creator = await User.findByPk(userId);
    if (!creator) return res.status(404).json({ error: "Creator not found in users table" });

    for (const member of members) {
      const exists = await User.findByPk(member.user_id);
      if (!exists) {
        return res.status(400).json({
          error: `User with ID ${member.user_id} not found in users table`
        });
      }
    }

    const newProject = await Project.create({
      title,
      description,
      deadline_date,
      scrum_time,
      status,
    });

    await UserProject.create({
      user_id: userId,
      project_id: newProject.id,
      position: "Project Manager",
      scrum_point: 0,
    });

    for (const member of members) {
      if (member.user_id === userId) continue; 

      const alreadyExists = await UserProject.findOne({
        where: { user_id: member.user_id, project_id: newProject.id },
      });

      if (!alreadyExists) {
        await UserProject.create({
          user_id: member.user_id,
          project_id: newProject.id,
          position: member.position || "Member",
          scrum_point: 0,
        });
      }
    }

    await deleteFromCache("projects:all");

    const fullProject = await Project.findByPk(newProject.id, {
      include: memberInclude(),
    });

    const formattedProject = await responseWithMembers(fullProject);

    res.status(201).json({
      message: "Create project successfully!",
      status: 201,
      project: formattedProject,
    });

  } catch (err) {
    console.error("Project creation failed:", err);
    res.status(500).json({ error: "Create failed", details: err.message });
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params
  const { title, description, deadline_date, scrum_time, members = [] } = req.body
  const userId = req.user.id

  try {
    const link = await UserProject.findOne({
      where: { project_id: id, user_id: userId },
    })
    if (!link || link.position.toLowerCase() !== "project manager") {
      return res.status(403).json({ error: "Only the Project Manager can update the project" })
    }

    const project = await Project.findByPk(id)
    if (!project) return res.status(404).json({ error: "Project not found" })

    await project.update({ title, description, deadline_date, scrum_time })

    const incomingUserIds = members.map(m => m.user_id)

    const currentLinks = await UserProject.findAll({
      where: { project_id: id },
    })

    for (const link of currentLinks) {
      if (link.user_id === userId) continue

      if (!incomingUserIds.includes(link.user_id)) {
        await link.destroy()
      }
    }

    for (const member of members) {
      if (member.user_id === userId) continue

      const existing = await UserProject.findOne({
        where: { user_id: member.user_id, project_id: id },
      })

      if (existing) {
        await existing.update({ position: member.position || "Member" })
      } else {
        await UserProject.create({
          user_id: member.user_id,
          project_id: id,
          position: member.position || "Member",
          scrum_point: 0,
        })
      }
    }

    await deleteFromCache("projects:all")

    const updatedProject = await Project.findByPk(id, {
      include: memberInclude(),
    })

    const formattedProject = await responseWithMembers(updatedProject)

    res.status(200).json({
      message: "Update project successfully!",
      status: 200,
      project: formattedProject,
    })
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message })
  }
}

exports.deleteProject = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  
  const project = await Project.findByPk(id)
  if (!project) return res.status(404).json({ error: "Project not found" })

  try {
    const link = await UserProject.findOne({
      where: { project_id: id, user_id: userId },
    })

    if (!link || link.position !== "Project Manager") {
      return res.status(403).json({ error: "Only the Project Manager can update the project" })
    }

    await UserProject.destroy({ where: { project_id: id } })

    await Project.destroy({ where: { id } })

    await deleteFromCache(`projects:all`)

    res.status(200).json({ message: "Delete project successfully!", status: 200 })
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message })
  }
}

exports.setProjectDone = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const project = await Project.findByPk(id)
    if (!project) {
      return res.status(404).json({ error: "Project not found" })
    }

    const link = await UserProject.findOne({
      where: { project_id: id, user_id: userId },
    })

    if (!link || link.position !== "Project Manager") {
      return res.status(403).json({ error: "Only the Project Manager can update the project" })
    }

    project.status = "done"
    await project.save()

    await deleteFromCache(`projects:all`)

    return res.status(200).json({ message: "Project status updated to done", status: 200, project })
  } catch (error) {
    console.error("Error updating project status:", error)
    return res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

exports.togglePinProject = async (req, res) => {
  const userId = req.user.id
  const { project_id } = req.params

  try {
    const userProject = await UserProject.findOne({
      where: { user_id: userId, project_id },
    })

    if (!userProject) {
      return res.status(404).json({ error: "Project not found or you're not a member" })
    }

    userProject.is_pinned = !userProject.is_pinned
    await userProject.save()

    await deleteFromCache(`projects:all`)

    return res.json({
      message: userProject.is_pinned ? "Project pinned!" : "Project unpinned!",
      status: 200,
    })
  } catch (err) {
    return res.status(500).json({ error: "Toggle failed", details: err.message })
  }
}

exports.getLeaderboard = async (req, res) => {
  try {
    const cacheKey = "leaderboard:top"
    const cached = await getFromCache(cacheKey)

    if (cached) {
      return res.json(JSON.parse(cached))
    }

    const users = await User.findAll({
      attributes: ["id", "firstname", "lastname"],
      include: [
        {
          model: UserProject,
          attributes: ["scrum_point"],
        },
      ],
    })

    const formatted = users.map(user => {
      const totalPoints = user.UserProjects?.reduce(
        (sum, curr) => sum + (curr.scrum_point || 0),
        0
      ) || 0

      return {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        scrum_point: totalPoints,
      }
    })

    formatted.sort((a, b) => b.scrum_point - a.scrum_point)

    const response = {
      message: "Fetch leaderboard successfully!",
      status: 200,
      leaderboard: formatted,
    }

    await saveToCache(cacheKey, JSON.stringify(response))

    return res.json(response)
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return res.status(500).json({
      message: "Internal server error",
      status: 500,
      leaderboard: [],
    })
  }
}
