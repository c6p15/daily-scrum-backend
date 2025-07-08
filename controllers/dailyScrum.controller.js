const { DailyScrum, UserProject, FilesUpload } = require("../models/index.js")
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js")
const { handleFilesUpload } = require('../services/fileUpload.service.js')
const { getObjectSignedUrl, deleteFile } = require('../services/storage.service.js')

exports.getAllDailyScrums = async (req, res) => {
  const cacheKey = `dailyscrums:all`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.status(200).json({ scrums: cached })

    const scrums = await DailyScrum.findAll({
      include: [
        {
          model: UserProject,
          include: ["Project", "User"],
        },
        {
          model: FilesUpload,
        },
      ],
    })

    const scrumsWithUrls = await Promise.all(
      scrums.map(async (scrum) => {
        const files = await Promise.all(
          (scrum.FilesUploads || []).map(async (file) => ({
            ...file.toJSON(),
            url: await getObjectSignedUrl(file.file_url),
          }))
        )

        return {
          ...scrum.toJSON(),
          files,
        }
      })
    )

    await saveToCache(cacheKey, scrumsWithUrls)
    res.status(200).json({ scrums: scrumsWithUrls })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.getDailyScrumById = async (req, res) => {
  const { id } = req.params
  const cacheKey = `dailyscrum:one:${id}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.status(200).json({ scrum: cached })

    const scrum = await DailyScrum.findByPk(id, {
      include: [
        {
          model: UserProject,
          include: ["Project", "User"],
        },
        {
          model: FilesUpload,
        },
      ],
    })

    if (!scrum) {
      return res.status(404).json({ error: "Scrum not found" })
    }

    const files = await Promise.all(
      (scrum.FilesUploads || []).map(async (file) => ({
        ...file.toJSON(),
        url: await getObjectSignedUrl(file.file_url),
      }))
    )

    const response = {
      ...scrum.toJSON(),
      files,
    }

    await saveToCache(cacheKey, response)

    res.status(200).json({ scrum: response })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}


exports.createDailyScrum = async (req, res) => {
  const userId = req.user.id
  const { project_id, ...rest } = req.body

  try {
    const userProject = await UserProject.findOne({
      where: { user_id: userId, project_id },
    })

    if (!userProject) {
      return res.status(403).json({ error: "You're not a member of this project" })
    }

    const scrum = await DailyScrum.create({
      ...rest,
      user_project_id: userProject.id,
    })

    let uploadedFiles = []

    if (req.files && req.files.length > 0) {
      const uploaded = await handleFilesUpload(req.files)

      const fileEntries = []

      for (const fileName of uploaded.image) {
        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: 'image/webp',
          file_name: fileName,
        })
      }

      for (const fileName of uploaded.other) {
        const ext = fileName.split('.').pop()
        const mime = ext === 'pdf' ? 'application/pdf' : `application/octet-stream`

        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: mime,
          file_name: fileName,
        })
      }

      const filesCreated = await FilesUpload.bulkCreate(fileEntries)

      uploadedFiles = await Promise.all(
        filesCreated.map(async (file) => ({
          id: file.id,
          file_name: file.file_name,
          mime_type: file.mime_type,
          url: await getObjectSignedUrl(file.file_url),
        }))
      )
    }

    await deleteFromCache(`dailyscrums:user:${userId}`)
    await deleteFromCache(`dailyscrums:project:${project_id}`)

    res.status(201).json({ 
      message: "Daily Scrum created", 
      scrum_id: scrum.id, 
      files: uploadedFiles 
    })
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message })
  }
}

exports.updateDailyScrum = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const scrum = await DailyScrum.findByPk(id, {
      include: [
        {
          model: UserProject,
          include: ["Project"],
        },
        {
          model: FilesUpload,
        },
      ],
    })

    if (!scrum || scrum.UserProject.user_id !== userId) {
      return res.status(403).json({ error: "You can't edit this post" })
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
    } = req.body

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

    let uploadedFiles = []

    if (req.files && req.files.length > 0) {
      const uploaded = await handleFilesUpload(req.files)

      const fileEntries = []

      for (const fileName of uploaded.image) {
        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: 'image/webp',
          file_name: fileName,
        })
      }

      for (const fileName of uploaded.other) {
        const ext = fileName.split('.').pop()
        const mime = ext === 'pdf' ? 'application/pdf' : 'application/octet-stream'

        fileEntries.push({
          daily_scrum_id: scrum.id,
          file_url: fileName,
          mime_type: mime,
          file_name: fileName,
        })
      }

      const filesCreated = await FilesUpload.bulkCreate(fileEntries)

      uploadedFiles = await Promise.all(
        filesCreated.map(async (file) => ({
          id: file.id,
          file_name: file.file_name,
          mime_type: file.mime_type,
          url: await getObjectSignedUrl(file.file_url),
        }))
      )
    }

    await deleteFromCache(`dailyscrum:one:${id}`)
    await deleteFromCache(`dailyscrums:user:${userId}`)
    if (scrum.UserProject?.project_id) {
      await deleteFromCache(`dailyscrums:project:${scrum.UserProject.project_id}`)
    }
    await deleteFromCache(`dailyscrums:all`)

    const files = await Promise.all(
      (scrum.FilesUploads || []).map(async (file) => ({
        ...file.toJSON(),
        url: await getObjectSignedUrl(file.file_url),
      }))
    )

    res.status(200).json({
      message: "Daily Scrum updated",
      scrum: { ...scrum.toJSON(), files },
      uploadedFiles,
    })
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message })
  }
}

exports.deleteDailyScrum = async (req, res) => {
  try {
    const { id } = req.params

    const dailyScrum = await DailyScrum.findByPk(id, {
      include: [{ model: FilesUpload, as: "FileUploads" }],
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

    res.status(200).json({
      message: "Daily scrum post deleted successfully!",
      status: 200,
    })
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    })
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
      include: [{ model: FilesUpload, as: "FileUploads" }]
    })

    if (!dailyScrum) {
      return res.status(404).json({ message: 'Daily scrum post not found' })
    }

    const fileToDelete = dailyScrum.FileUploads.find(f => f.file_url === fileName)
    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found in this scrum post' })
    }

    // Delete from storage (S3 or local)
    await deleteFile(fileName)

    // Delete from DB
    await fileToDelete.destroy()

    // Clear Redis cache
    await deleteFromCache(`dailyscrum:one:${id}`)
    await deleteFromCache(`dailyscrums:all`)
    await deleteFromCache(`dailyscrums:user:${dailyScrum.UserProject?.user_id}`)
    await deleteFromCache(`dailyscrums:project:${dailyScrum.UserProject?.project_id}`)

    res.status(200).json({ message: "File deleted successfully" })

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    })
  }
}