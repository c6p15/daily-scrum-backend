const moment = require('moment')
const { DailyScrum, UserProject, FilesUpload, Project } = require("../models/index.js")
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js")
const { handleFilesUpload } = require('../services/fileUpload.service.js')
const { deleteFile } = require('../services/storage.service.js')
const { formatDailyScrum } = require('../utils/dailyScrum.util.js')

exports.getAllDailyScrums = async (req, res) => {
  const { id: projectId } = req.params
  const cacheKey = `dailyscrums:project:${projectId}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.status(200).json({ message: "Fetch daily scrums successfully!", status: 200, scrums: cached })

    const scrums = await DailyScrum.findAll({
      include: [
        {
          model: UserProject,
          required: true,
          where: { project_id: projectId },
          include: ["User", "Project"],
        },
        {
          model: FilesUpload,
        },
      ],
    })

    const formattedScrums = await Promise.all(scrums.map(formatDailyScrum))

    await saveToCache(cacheKey, formattedScrums)

    res.status(200).json({
      message: "Fetch daily scrums successfully!",
      status: 200,
      scrums: formattedScrums,
    })
  } catch (err) {
    console.error("Get daily scrums error:", err)
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.getDailyScrumById = async (req, res) => {
  const { id } = req.params
  const cacheKey = `dailyscrum:one:${id}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached)
      return res.status(200).json({
        message: "Fetch daily scrum successfully!",
        status: 200,
        scrum: cached,
      })

    const scrum = await DailyScrum.findByPk(id, {
      include: [
        { model: UserProject, include: ["Project", "User"] },
        { model: FilesUpload },
      ],
    })

    if (!scrum) {
      return res.status(404).json({ error: "Scrum not found" })
    }

    const formattedScrum = await formatDailyScrum(scrum)

    await saveToCache(cacheKey, formattedScrum)

    res.status(200).json({
      message: "Fetch daily scrum successfully!",
      status: 200,
      scrum: formattedScrum,
    })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.createDailyScrum = async (req, res) => {
  const userId = req.user.id
  const { project_id, created_at, ...rest } = req.body

  try {
    const userProject = await UserProject.findOne({
      where: { user_id: userId, project_id },
    })

    if (!userProject) {
      return res.status(403).json({ error: "You're not a member of this project" })
    }

    let customCreatedAt = new Date()
    if (created_at) {
      const allowedDates = [
        moment().startOf("day").format("YYYY-MM-DD"),
        moment().subtract(1, "day").startOf("day").format("YYYY-MM-DD"),
      ]
      const inputDate = moment(created_at).startOf("day").format("YYYY-MM-DD")

      if (!allowedDates.includes(inputDate)) {
        return res.status(400).json({
          error: "Invalid created_at date. Only today or yesterday are allowed.",
        })
      }

      customCreatedAt = new Date(created_at)
    }

    // Create scrum
    const scrum = await DailyScrum.create({
      ...rest,
      user_project_id: userProject.id,
      created_at: customCreatedAt,
    })

    const project = await Project.findByPk(project_id)
    const createdAt = moment(customCreatedAt)
    const scrumTime = moment(project.scrum_time, "HH:mm:ss").set({
      year: createdAt.year(),
      month: createdAt.month(),
      date: createdAt.date(),
    })

    let points = 0
    if (createdAt.isSameOrBefore(scrumTime)) {
      points = 1
    } else if (
      createdAt.isAfter(scrumTime) &&
      createdAt.isBefore(scrumTime.clone().add(1, "hour"))
    ) {
      points = 0.5
    }

    userProject.scrum_point += points
    await userProject.save()

    if (req.files && req.files.length > 0) {
      const uploaded = await handleFilesUpload(req.files)
      const fileEntries = []

      for (const fileName of uploaded.image) {
        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: "image/webp",
          file_name: fileName,
        })
      }

      for (const fileName of uploaded.other) {
        const ext = fileName.split(".").pop()
        const mime = ext === "pdf" ? "application/pdf" : "application/octet-stream"

        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: mime,
          file_name: fileName,
        })
      }

      await FilesUpload.bulkCreate(fileEntries)
    }

    const fullScrum = await DailyScrum.findByPk(scrum.id, {
      include: [
        { model: FilesUpload },
        { model: UserProject, include: ["User"] },
      ],
    })

    const formattedScrum = await formatDailyScrum(fullScrum)

    await deleteFromCache(`dailyscrums:user:${userId}`)
    await deleteFromCache(`dailyscrums:project:${project_id}`)

    return res.status(201).json({
      message: "Create daily scrum successfully!",
      status: 201,
      scrum: formattedScrum,
    })
  } catch (err) {
    return res.status(500).json({ error: "Create failed", details: err.message })
  }
}

exports.updateDailyScrum = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
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
  } = req.body

  try {
    const scrum = await DailyScrum.findByPk(id, {
      include: [
        { model: UserProject, include: ["Project", "User"] },
        { model: FilesUpload },
      ],
    })

    if (!scrum || scrum.UserProject.user_id !== userId) {
      return res.status(403).json({ error: "You can't edit this post" })
    }

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
    })

    if (req.files && req.files.length > 0) {
      const uploaded = await handleFilesUpload(req.files)
      const fileEntries = []

      for (const fileName of uploaded.image) {
        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: "image/webp",
          file_name: fileName,
        })
      }

      for (const fileName of uploaded.other) {
        const ext = fileName.split(".").pop()
        const mime = ext === "pdf" ? "application/pdf" : `application/octet-stream`

        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: mime,
          file_name: fileName,
        })
      }

      await FilesUpload.bulkCreate(fileEntries)
    }

    const updatedScrum = await DailyScrum.findByPk(id, {
      include: [
        { model: FilesUpload },
        { model: UserProject, include: ["User"] },
      ],
    })

    const formattedScrum = await formatDailyScrum(updatedScrum)

    await deleteFromCache(`dailyscrum:one:${id}`)
    await deleteFromCache(`dailyscrums:user:${userId}`)
    if (scrum.UserProject?.project_id) {
      await deleteFromCache(`dailyscrums:project:${scrum.UserProject.project_id}`)
    }

    return res.status(200).json({
      message: "Update daily Scrum successfully!",
      status: 200,
      scrum: formattedScrum,
    })
  } catch (err) {
    return res.status(500).json({ error: "Update failed", details: err.message })
  }
}

exports.deleteDailyScrum = async (req, res) => {
  try {
    const { id } = req.params

    const dailyScrum = await DailyScrum.findByPk(id, {
      include: [
        { model: FilesUpload, as: "FileUploads" },
        { model: UserProject },
      ],
    })

    if (!dailyScrum) return res.status(404).json({ message: "Not found" })

    const deletePromises = dailyScrum.FileUploads.map(async (file) => {
      await deleteFile(file.file_url)
      await file.destroy()
    })
    await Promise.all(deletePromises)

    await dailyScrum.destroy()

    await deleteFromCache(`dailyscrum:one:${id}`)
    await deleteFromCache(`dailyscrums:all`)
    await deleteFromCache(`dailyscrums:user:${dailyScrum.user_project_id}`)
    await deleteFromCache(`dailyscrums:project:${dailyScrum.UserProject?.project_id}`)

    res.status(200).json({ message: "Delete daily scrum successfully!", status: 200 })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
}

exports.deleteSingleFile = async (req, res) => {
  const { id } = req.params
  const { fileName } = req.body

  if (!fileName) {
    return res.status(400).json({ message: 'fileName is required in the request body' })
  }

  try {
    const dailyScrum = await DailyScrum.findByPk(id, {
      include: [
        { model: FilesUpload, as: "FileUploads" },
        { model: UserProject },
      ],
    })

    if (!dailyScrum) {
      return res.status(404).json({ message: 'Daily scrum post not found' })
    }

    const fileToDelete = dailyScrum.FileUploads.find(f => f.file_url === fileName)
    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found in this scrum post' })
    }

    await deleteFile(fileName)
    await fileToDelete.destroy()

    await deleteFromCache(`dailyscrum:one:${id}`)
    await deleteFromCache(`dailyscrums:all`)
    await deleteFromCache(`dailyscrums:user:${dailyScrum.UserProject?.user_id}`)
    await deleteFromCache(`dailyscrums:project:${dailyScrum.UserProject?.project_id}`)

    res.status(200).json({ message: "File deleted successfully", status: 200 })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
}