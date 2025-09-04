const {
  Comment,
  Post,
  Notification,
  User,
  UserProject,
  Project,
} = require("../models/index.js");
const {
  getFromCache,
  saveToCache,
  deleteFromCache,
} = require("../services/redis.service.js");
const { getObjectSignedUrl } = require("../services/storage.service.js");
const { sendMail } = require("../services/mailer.service.js");

exports.getAllComments = async (req, res) => {
  const { post_id } = req.params;
  const cacheKey = `comments:scrum:${post_id}`;

  try {
    const cached = await getFromCache(cacheKey);
    if (cached)
      return res.json({
        message: "Fetch comments successfully!",
        status: 200,
        comments: cached,
      });

    const comments = await Comment.findAll({
      where: { post_id },
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"],
      },
      order: [["created_at", "ASC"]],
    });

    for (const comment of comments) {
      const pic = comment.User?.profile_pic;
      if (pic) {
        comment.User.profile_pic = await getObjectSignedUrl(pic);
      }
    }

    await saveToCache(cacheKey, comments);
    res.status(200).json({
      message: "Fetch comments successfully!",
      status: 200,
      comments,
    });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.getCommentById = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findOne({
      where: { id },
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"],
      },
    });

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const pic = comment.User?.profile_pic;
    if (pic) {
      comment.User.profile_pic = await getObjectSignedUrl(pic);
    }

    res.status(200).json({
      message: "Fetch comment successfully!",
      status: 200,
      comment,
    });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
  }
};

exports.createComment = async (req, res) => {
  const { post_id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  try {
    const post = await Post.findByPk(post_id);
    if (!post) {
      return res.status(404).json({ error: "Daily scrum not found" });
    }

    const user = await User.findByPk(userId, {
      attributes: ["firstname", "lastname"],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newComment = await Comment.create({
      post_id,
      user_id: userId,
      comment,
    });

    await deleteFromCache(`comments:scrum:${post_id}`);

    const userProject = await UserProject.findByPk(post.user_project_id, {
      include: [
        { model: User, attributes: ["id", "firstname", "lastname", "email"] },
        { model: Project, attributes: ["id", "title"] },
      ],
    });

    const scrumOwner = userProject?.User;
    const projectTitle = userProject?.Project?.title || "your project";
    const projectId = userProject?.Project?.id || "your project";

    if (scrumOwner && scrumOwner.id !== userId) {
      const notification = await Notification.create({
        user_id: scrumOwner.id,
        message: `${user.firstname} ${user.lastname} แสดงความคิดเห็นใน scrum ของคุณที่ ${projectTitle}`,
        type: "new_comment",
        post_id,
        comment_id: newComment.id,
        project_id: userProject?.Project?.id || null,
      });

      await deleteFromCache(`notifications:user:${scrumOwner.id}`);

      if (global._io) {
        global._io
          .to(notification.user_id.toString())
          .emit("notification", notification.toJSON());
        global._io
          .to(notification.user_id.toString())
          .emit("notification:update");
      }

      if (scrumOwner.email) {
        sendMail({
          to: scrumOwner.email,
          subject: `ความคิดเห็นใน scrum ของคุณที่ ${projectTitle}`,
          html: `<p>${user.firstname} ${user.lastname} แสดงความคิดเห็นใน scrum ของคุณที่ ${projectTitle}</p>
           <p>${comment}</p>
           <p><a href="${process.env.FRONTEND_URL}/project/${projectId}">View Daily Scrum</a></p>`,
        }).catch((err) => {
          console.error(
            `Failed to send comment email to ${scrumOwner.email}:`,
            err.message
          );
        });
      }
    }

    const createdComment = await Comment.findByPk(newComment.id, {
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"],
      },
    });

    if (createdComment?.User?.profile_pic) {
      const pic = createdComment.User.profile_pic;
      createdComment.User.profile_pic = pic.startsWith("http")
        ? pic
        : await getObjectSignedUrl(pic);
    }

    res.status(201).json({
      message: "Create comment successfully!",
      status: 201,
      comment: createdComment,
    });
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message });
  }
};

exports.updateComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { comment } = req.body;

  try {
    const existingComment = await Comment.findByPk(id);

    if (!existingComment)
      return res.status(404).json({ error: "Comment not found" });
    if (existingComment.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    await existingComment.update({ comment });

    await deleteFromCache(`comments:scrum:${existingComment.post_id}`);

    const updatedComment = await Comment.findByPk(id, {
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"],
      },
    });

    if (updatedComment?.User?.profile_pic) {
      updatedComment.User.profile_pic = await getObjectSignedUrl(
        updatedComment.User.profile_pic
      );
    }

    res.status(200).json({
      message: "Update comment successfully!",
      status: 200,
      comment: updatedComment,
    });
  } catch (err) {
    res.status(500).json({
      error: "Update failed",
      details: err.message,
    });
  }
};

exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const comment = await Comment.findByPk(id);

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const postId = comment.post_id;

    await comment.destroy();
    await deleteFromCache(`comments:scrum:${postId}`);

    res.status(200).json({
      message: "Delete comment successfully!",
      status: 200,
    });
  } catch (err) {
    res.status(500).json({
      error: "Delete failed",
      details: err.message,
    });
  }
};
