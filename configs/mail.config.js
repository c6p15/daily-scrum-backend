require('dotenv').config()

exports.transporterConfig = {
    service: "gmail",
    auth: {
      user: process.env.google_sender_email,
      pass: process.env.google_sender_password,
    },
  }