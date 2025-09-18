const { Post, UserProject, User, FileUpload, Project } = require('../models')
const { getObjectSignedUrl } = require('../services/storage.service')

async function resolveProfilePic(pic) {
  if (!pic) return null
  if (pic.startsWith("http")) return pic
  return await getObjectSignedUrl(pic)
}

const formatUserFromScrum = async (userProject) => {
  const user = userProject.User

  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    profile_pic: await resolveProfilePic(user.profile_pic),
    position: userProject.position,
    scrum_point: userProject.scrum_point,
  }
}

const formatPost = async (scrum) => {
  const files = await Promise.all(
    (scrum.FileUploads || []).map(async (file) => {
      return {
        id: file.id,
        daily_scrum_id: file.daily_scrum_id,
        file_url: await getObjectSignedUrl(file.file_url),
        file_name: file.file_name,
        mime_type: file.mime_type,
        file_size: file.file_size,
        created_at: file.created_at,
      }
    })
  )

  return {
    id: scrum.id,
    type: scrum.type,
    today_task: scrum.today_task,
    problem: scrum.problem,
    tomorrow_task: scrum.tomorrow_task,
    good: scrum.good,
    bad: scrum.bad,
    try: scrum.try,
    next_sprint: scrum.next_sprint,
    user_project_id: scrum.user_project_id,
    created_at: scrum.created_at,
    user: await formatUserFromScrum(scrum.UserProject),
    files,
  }
}

module.exports = { formatPost, resolveProfilePic }