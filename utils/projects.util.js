const { UserProject, User } = require("../models")
const { getObjectSignedUrl } = require('../services/storage.service.js')

const memberInclude = () => ({
  model: UserProject,
  include: {
    model: User,
    attributes: ["id", "firstname", "lastname", "email", "profile_pic"],
  },
})

const responseWithMembers = async (project) => {
  const members =
    (await Promise.all(
      (project.UserProjects || []).map(async (link) => {
        const user = link.User;
        let profilePicUrl = null;
        if (user.profile_pic) {
          profilePicUrl = await getObjectSignedUrl(user.profile_pic);
        }
        return {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          profile_pic: profilePicUrl,
          position: link.position,
          scrum_point: link.scrum_point,
        };
      })
    )) || [];

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    deadline_date: project.deadline_date,
    scrum_time: project.scrum_time,
    created_at: project.created_at,
    members,
  };
};


module.exports = { memberInclude, responseWithMembers }
