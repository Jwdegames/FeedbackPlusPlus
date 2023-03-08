const mongoose = require("mongoose");

const TestsResultsTemplate = new mongoose.Schema({
    // username field (non-unique)
    username: {
      type: String,
      required: [true, "Please provide a username!"],
      unique: false,
    },
    // id of assignment (non-unique)
    assignment_id: {
      type: String,
      required: [true, "Please provide an assignment id!"],
      unique: false
    },
    // Number of test cases passed field (non-unique)
    testCasesPassed: {
      type: [Boolean],
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