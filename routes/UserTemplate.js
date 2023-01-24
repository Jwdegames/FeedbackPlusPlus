const mongoose = require("mongoose");

const UserTemplate = new mongoose.Schema({
    // username field (unique)
    username: {
      type: String,
      required: [true, "Please provide a username!"],
      unique: [true, "Username is taken!"],
    },
    // Password field (non-unique)
    password: {
      type: String,
      required: [true, "Please provide a password!"],
      unique: false,
    },
});

// Make it so other files can use this template.
module.exports = mongoose.model.Users || mongoose.model("Users", UserTemplate);