const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const { User } = require("../models/index.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.google_client_id,
      clientSecret: process.env.google_client_secret,
      callbackURL: process.env.google_callback_url,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const profilePic = profile.photos[0].value;

        let user = await User.findOne({ where: { email } });

        if (!user) {
          user = await User.create({
            firstname: fullName.split(" ")[0],
            lastname: fullName.split(" ").slice(1).join(" "),
            email,
            password: "", // or null
            profile_pic: profilePic,
          });
        }

        return done(null, user); // Send user object to the callback route
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport