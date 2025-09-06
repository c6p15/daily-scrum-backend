const moment = require('moment')
const { Post, UserProject, FilesUpload, Project } = require("../models/index.js")
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js")
const { handleFilesUpload } = require('../services/fileUpload.service.js')
const { deleteFile } = require('../services/storage.service.js')
const { formatPost } = require('../utils/posts.util.js')

exports.getAllPosts = async (req, res) => {
  const { id: projectId } = req.params
  const cacheKey = `posts:project:${projectId}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.status(200).json({ message: "Fetch posts successfully!", status: 200, posts: cached })

    const posts = await Post.findAll({
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

    const formattedPosts = await Promise.all(posts.map(formatPost))

    await saveToCache(cacheKey, formattedPosts)

    res.status(200).json({
      message: "Fetch posts successfully!",
      status: 200,
      posts: formattedPosts,
    })
  } catch (err) {
    console.error("Get posts error:", err)
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.getPostById = async (req, res) => {
  const { id } = req.params
  const cacheKey = `posts:one:${id}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached)
      return res.status(200).json({
        message: "Fetch post successfully!",
        status: 200,
        post: cached,
      })

    const post = await Post.findByPk(id, {
      include: [
        { model: UserProject, include: ["Project", "User"] },
        { model: FilesUpload },
      ],
    })

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    const formattedPost = await formatPost(post)

    await saveToCache(cacheKey, formattedPost)

    res.status(200).json({
      message: "Fetch post successfully!",
      status: 200,
      post: formattedPost,
    })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.createPost = async (req, res) => {
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

    const post = await Post.create({
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
          post_id: post.id,
          file_url: fileName,
          mime_type: "image/webp",
          file_name: fileName,
        })
      }

      for (const fileName of uploaded.other) {
        const ext = fileName.split(".").pop()
        const mime = ext === "pdf" ? "application/pdf" : "application/octet-stream"

        fileEntries.push({
          post_id: post.id,
          file_url: fileName,
          mime_type: mime,
          file_name: fileName,
        })
      }

      await FilesUpload.bulkCreate(fileEntries)
    }

    const fullPost = await Post.findByPk(post.id, {
      include: [
        { model: FilesUpload },
        { model: UserProject, include: ["User"] },
      ],
    })

    const formattedPost = await formatPost(fullPost)

    await deleteFromCache(`posts:user:${userId}`)
    await deleteFromCache(`posts:project:${project_id}`)

    return res.status(201).json({
      message: "Create post successfully!",
      status: 201,
      post: formattedPost,
    })
  } catch (err) {
    return res.status(500).json({ error: "Create failed", details: err.message })
  }
}

exports.updatePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const {
    type,
    today_task,
    problem,
    tomorrow_task,
    good,
    bad,
    try: tryText,
    next_sprint,
  } = req.body

  try {
    const post = await Post.findByPk(id, {
      include: [
        { model: UserProject, include: ["Project", "User"] },
        { model: FilesUpload },
      ],
    })

    if (!post || post.UserProject.user_id !== userId) {
      return res.status(403).json({ error: "You can't edit this post" })
    }

    await post.update({
      type,
      today_task,
      problem,
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
          post_id: post.id,
          file_url: fileName,
          mime_type: "image/webp",
          file_name: fileName,
        })
      }

      for (const fileName of uploaded.other) {
        const ext = fileName.split(".").pop()
        const mime = ext === "pdf" ? "application/pdf" : `application/octet-stream`

        fileEntries.push({
          post_id: post.id,
          file_url: fileName,
          mime_type: mime,
          file_name: fileName,
        })
      }

      await FilesUpload.bulkCreate(fileEntries)
    }

    const updatedPost = await Post.findByPk(id, {
      include: [
        { model: FilesUpload },
        { model: UserProject, include: ["User"] },
      ],
    })

    const formattedPost = await formatPost(updatedPost)

    await deleteFromCache(`posts:one:${id}`)
    await deleteFromCache(`posts:user:${userId}`)
    if (post.UserProject?.project_id) {
      await deleteFromCache(`posts:project:${post.UserProject.project_id}`)
    }

    return res.status(200).json({
      message: "Update post successfully!",
      status: 200,
      post: formattedPost,
    })
  } catch (err) {
    return res.status(500).json({ error: "Update failed", details: err.message })
  }
}

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params

    const post = await Post.findByPk(id, {
      include: [
        { model: FilesUpload, as: "FileUploads" },
        { model: UserProject },
      ],
    })

    if (!post) return res.status(404).json({ message: "Not found" })

    const deletePromises = post.FileUploads.map(async (file) => {
      await deleteFile(file.file_url)
      await file.destroy()
    })
    await Promise.all(deletePromises)

    await post.destroy()

    await deleteFromCache(`posts:one:${id}`)
    await deleteFromCache(`posts:all`)
    await deleteFromCache(`posts:user:${post.user_project_id}`)
    await deleteFromCache(`posts:project:${post.UserProject?.project_id}`)

    res.status(200).json({ message: "Delete post successfully!", status: 200 })
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
    const post = await Post.findByPk(id, {
      include: [
        { model: FilesUpload, as: "FileUploads" },
        { model: UserProject },
      ],
    })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const fileToDelete = post.FileUploads.find(f => f.file_url === fileName)
    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found in this post' })
    }

    await deleteFile(fileName)
    await fileToDelete.destroy()

    await deleteFromCache(`posts:one:${id}`)
    await deleteFromCache(`posts:all`)
    await deleteFromCache(`posts:user:${post.UserProject?.user_id}`)
    await deleteFromCache(`posts:project:${post.UserProject?.project_id}`)

    res.status(200).json({ message: "File deleted successfully!", status: 200 })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
}