require('dotenv').config()

const nodemailer = require("nodemailer")
const { transporterConfig } = require("../configs/mail.config.js")

const transporter = nodemailer.createTransport(transporterConfig)

exports.sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: "daily-scrum",
    to,
    subject,
    html,
  })
}