const express = require("express");
const {spawn} = require('child_process');
const app = express();
const mongoose = require("mongoose");
const path = require("path");
// Allow communication with React Application
const cors = require("cors");
app.use(cors());



// Have Node serve the files for our app
app.get('/', (req, res) => res.sendFile(__dirname + '/feedbackpp.html'))

var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Allows requests that have a body.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Server Output
const port = process.env.PORT || 1234;
app.listen(process.env.PORT || 1234, () => {
    console.log(`Server running on port ${port}`);
});

if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}

app.get(/^(.+)$/, function(req, res){ 
	console.log('static file require: ' + req.params);
	res.sendFile(__dirname + req.params[0]);
});


// Routes
const Autograder = require("./routes/Autograder.js");
app.use("/Autograder", Autograder);

const Debugger = require("./routes/Debugger.js");
app.use("/Debugger", Debugger);

const Database = require("./routes/Database.js");
app.use("/Database", Database);

const Visualizer = require("./routes/Visualizer.js");
app.use("/Visualizer", Visualizer);