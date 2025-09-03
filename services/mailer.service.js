require('dotenv').config()

const nodemailer = require("nodemailer")
const { transporterConfig } = require("../configs/mail.config.js")

const transporter = nodemailer.createTransport(transporterConfig)

exports.sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: "daily-scrum <noreply@yourdomain.com>",
      to,
      subject,
      html,
    })
    console.log(`Email sent to ${to}: ${info.messageId}`)
    return info
  } catch (err) {
    console.error(`Email failed to send to ${to}:`, err.message)
    return null
  }
}