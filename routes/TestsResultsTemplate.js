const mongoose = require("mongoose");

const TestsResultsTemplate = new mongoose.Schema({
    // username field (unique)
    username: {
      type: String,
      required: [true, "Please provide a username!"],
      unique: [true, "Username is taken!"],
    },
    // Number of test cases passed field (non-unique)
    testCasesPassed: {
      type: Number,
      required: [true, "Please write number of test cases passed!"],
      unique: false,
    },
    // File Code field (non-unique)
    fileCode: {
        type: String,
        required: [true, "Please write file code!"],
        unique: false,
    },
});

// Make it so other files can use this template.
module.exports = mongoose.model.TestsResults || mongoose.model("TestsResults", TestsResultsTemplate);