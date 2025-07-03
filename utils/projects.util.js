const { UserProject, User } = require("../models");

const memberInclude = () => ({
  model: UserProject,
  include: {
    model: User,
    attributes: ["id", "firstname", "lastname", "email"],
  },
});

const responseWithMembers = (project) => {
  const members =
    project.UserProjects?.map((link) => ({
      id: link.User.id,
      firstname: link.User.firstname,
      lastname: link.User.lastname,
      email: link.User.email,
      position: link.position,
      scrum_point: link.scrum_point,
    })) || [];

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    deadline_date: project.deadline_date,
    scrum_time: project.scrum_time,
    created_at: project.created_at,
    members,
  };
};

module.exports = { memberInclude, responseWithMembers };
