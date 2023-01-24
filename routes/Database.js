
const { request } = require('express');
const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");

if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}

function connect() {
    try {
        // Connect to the MongoDB cluster
        console.log(process.env.MONGODB_URI);
        mongoose.connect(
            process.env.MONGODB_URI,
        { useNewUrlParser: true, useUnifiedTopology: true},
        /*() => {
            console.log("Mongoose is connected");
            // res.send("Connection successful!");
        }*/
        ).then(() => {
            console.log("Successfully connected to MongoDB Atlas!");
          })
          .catch((error) => {
            console.log("Unable to connect to MongoDB Atlas!");
            console.error(error);
          });;

    } catch (e) {
        console.log("could not connect");
        // res.send("Connection failed!");
    }
}


const User = require("./UserTemplate");
const TestResults = require("./TestsResultsTemplate");
const TestsResultsTemplate = require('./TestsResultsTemplate');
connect();


router.post("/connect", function(req, res) {
    try {
        // Connect to the MongoDB cluster
         mongoose.connect(
          process.env.MONGODB_URI,
          { useNewUrlParser: true, useUnifiedTopology: true },
          () => {
            console.log("Mongoose is connected");
            res.send("Connection successful!");
        }
        );
    
      } catch (e) {
        console.log("could not connect");
        res.send("Connection failed!");
      }
    
});

router.post("/register", function(req, res) {
    try {
        const newUser = new User({
            username: req.body.username,
            password: req.body.password,
        });
        const newTestResults = new TestsResultsTemplate({
            username: req.body.username,
            testCasesPassed: 0,
            fileCode: "<blank>",
        });
        newTestResults.save().then((result) => {
            console.log("Made new tests results template!");
            console.log(result);

        }).catch((error) => {
            console.log("Error making test results:");
            console.log(error);
        });
        console.log("New User: " + newUser);
        // Save new user to the database
        newUser.save().then((result) => {
            console.log("New user made!");
            console.log(result);

            res.write("Registration Result (Success!):\n");
            res.write(String(result));
            res.write("\nNew ID:\n");
            res.write(String(newUser._id));
            res.end("\n");
        })

        .catch((error) => {
            // Display the error
            console.log("New user error:");
            console.log(error);

            res.write("New User error:\n");
            res.write(String(error));
            res.end("\n");
        })
    } catch (e) {
        console.log("registration failed");
        console.log(e);
        res.write("Registration failed:\n");
        res.write(String(e));
        res.end("\n");
    }
});

router.post("/login", function(req, res) {
    try {
        // Debug Login requests
        // console.log(JSON.stringify(object, null, 4));
        User.findOne({ username: req.body.username}).then((user) => {
            if (req.body.password != null) {
                if (user != null) {
                    if (req.body.password == user.password) {
                        res.write("Login Result (Success!):\n");
                        res.write("N/A");
                        res.write("\nID:\n");
                        res.write(String(user._id));
                        res.end("\n");
                    } else {
                        console.log("Invalid password");
                        res.send("Invalid password!");
                    }
                } else {
                    console.log("We somehow got a null User?");
                    res.send("Can't have null User!");
                }
            } else {
                console.log("We somehow got a null password?");
                res.send("Can't have null password!");
            }
        })

        .catch((error) => {
            // Display the error
            console.log("Login error:");
            console.log(error);

            res.write("Login error:\n");
            res.write(String(error));
            res.end("\n");
        })
    } catch (e) {
        console.log("login failed");
        console.log(e);
        res.write("Login failed:\n");
        res.write(String(e));
        res.end("\n");
    }
});


router.post("/updateTestResults", function(req, res) {
    try {
        var query = {'username': req.body.username};
        if (req.body != null) {
            if (req.body.fileCode == "") {
                // Prevent blank string from being used
                req.body.fileCode = "<blank>";
            }
        } else {
            res.send("No Res Body!");
        }
        TestResults.findOneAndUpdate(query, {testCasesPassed: req.body.testCasesPassed, fileCode: req.body.fileCode}, {upsert: true}, function(err, doc) {
            if (err) {
                console.log("Failed to update test results");
                console.log(err);
                return res.send("Database Test Result Update Fail!");
            }
            console.log("Updated test results");
            return res.send('Updated Test Results.');
        });
    } catch (e) {
        console.log("update test results failed");
        console.log(e);
        res.write("Update Test Results failed:\n");
        res.write(String(e));
        res.end("\n");
    }
});
module.exports = router;