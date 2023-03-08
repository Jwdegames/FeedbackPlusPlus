const express = require('express');
const {NodeVM} = require("vm2");
const { updateTestResults } = require('./Database');
// express.use(json);
const router = express.Router();
const fs = require('fs')
var maxTC = 9;
var maxNormalTC = 5;
var maxRandomTC = 2;
var maxCustomTC = 2;
var maxRunTime = 2000;
var pyProgDict = {}
var pyProgSolnDict = {}

router.post('/getNumTestCases', function(req, res) {
    let tcArray = [maxTC, maxNormalTC, maxRandomTC, maxCustomTC];
    res.send(JSON.stringify(tcArray));
});

/**
 * Checks security of file by preventing running of unallowed imports and opening of files
 */
function checkImports(fileTXT, allowedImports) {
    // Replace allowed imports with safe feature
    for (let i = 0; i < allowedImports.length; i++) {
       fileTXT = fileTXT.replaceAll(allowedImports[i], "SAFE");
    }
    if (fileTXT.indexOf("import") != -1) {
        console.log("Import violation detected!");
        return "IMPORT VIOLATION - Only following imports allowed: " + allowedImports;
    }
    // Check regex open<space>+\(
    if (fileTXT.match(/open *\(/)) {
        console.log("Open violation detected!");
        return "OPEN VIOLATION - No files may be opened!";
    }
    if (fileTXT.match(/= *open/)) {
        console.log("Open violation detected!");
        return "OPEN VIOLATION - Open may not be assigned to a variable!";
    }
    if (fileTXT.indexOf("__builtins__") != -1) {
        console.log("builtins violation detected!");
        return "BUILTINS VIOLATION - __builtins__ may not be modified!";
    }
    // All clear
    return "";
}

/**
 * Generates a random test case
 */
function generateRandomTC(tcIndex) {
    let tcInput = "";
    let ops = ["+", "-", "*", "/", "^", "%"];
    if (tcIndex % 2 == 0) {
        // Even test cases -> generate test cases with no fail conditions
        let numLines = Math.floor(Math.random() * 11 + 5);
        for (let i = 0; i < numLines; i++) {
            let numCount = Math.floor(Math.random() * 6 + 2);
            let numOps = 0;
            // Make up the numbers
            for (let j = 0; j < numCount; j++) {
                tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                if (j > numOps) {
                    // Add operators randomly
                    let includeOps = Math.random() > 0.5;
                    if (includeOps) {
                        tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                        numOps++;
                    }

                }
            }
            // Add operators as need be
            for (let k = numOps; k < numCount - 1; k++) {
                tcInput += ops[Math.floor(Math.random() * 6)] + " ";
            }
            // Remove the space at the end
            tcInput = tcInput.slice(0, tcInput.length - 1);
            // Add a new line
            tcInput += "\n";
        }
        // Remove the new line character at the end
        tcInput = tcInput.slice(0, tcInput.length - 1);
    } else {
        // Odd test cases -> include fail conditions
        let numRepeats = Math.floor(Math.random() * 6 + 2);
        let numLines = numRepeats * 7;
        let lineTypes = [];
        // Generate the case of what each line will be 
        for (let lT_idx = 0; lT_idx < numLines; lT_idx++) {
            if (lT_idx < numLines / 7) {
                lineTypes.push("Normal");
            } else if (lT_idx < 2 * numLines / 7) {
                lineTypes.push("FAIL::LEFTOVER");
            } else if (lT_idx < 3 * numLines / 7)  {
                lineTypes.push("FAIL::MISSING");
            } else if (lT_idx < 4 * numLines / 7) {
                lineTypes.push("FAIL::DIV0");
            } else if (lT_idx < 5 * numLines / 7) {
                lineTypes.push("FAIL::POW0NEG");
            } else if (lT_idx < 6 * numLines / 7) {
                lineTypes.push("FAIL:POWLARGE");
            } else {
                lineTypes.push("FAIL:MOD0")
            }
        }

        // Shuffle the array
        for (let l_idx = numLines - 1; l_idx > 0; l_idx--) {
            var r_idx = Math.floor(Math.random() * (l_idx + 1));
            // Swap the elements
            [lineTypes[r_idx], lineTypes[l_idx]] = [lineTypes[l_idx], lineTypes[r_idx]];
        }

        for (let i = 0; i < numLines; i++) {
            let lineType = lineTypes[i];
            let numCount;
            let numOps;
            let includeOps;
            let tcTemp;
            let includeError;
            switch(lineType) {
                case "Normal":
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    // Make up the numbers
                    for (let j = 0; j < numCount; j++) {
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                        if (j > numOps) {
                            // Add operators randomly
                            includeOps = Math.random() > 0.5;
                            if (includeOps) {
                                tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }
                        }
                    }
                    // Add operators as need be
                    for (let k = numOps; k < numCount - 1; k++) {
                        tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                    }
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
                case "FAIL::LEFTOVER":
                    // Handle cases where there are leftover numbers in the stack
                    // This is caused by not having enough operators
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    let maxOps = Math.floor(Math.random() * (numCount - 1));
                    // Make up the numbers
                    for (let j = 0; j < numCount; j++) {
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                        if (j > numOps && numOps < maxOps) {
                            // Add operators randomly
                            includeOps = Math.random() > 0.5;
                            if (includeOps) {
                                tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }
                        }
                    }
                    // Add operators as need be
                    for (let k = numOps; k < maxOps; k++) {
                        tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                    }
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
                case "FAIL::MISSING":
                    // Handle cases where there are integers missing when an operation needs to be performed
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    // Make up the numbers
                    for (let j = 0; j < numCount; j++) {
                        if (j >= 0) {
                            // Add operators randomly
                            includeOps = Math.random() > (1 - j/numCount);
                            if (includeOps) {
                                tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }

                        }
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                    }
                    // Add operators as need be
                    for (let k = numOps; k < numCount; k++) {
                        tcInput += ops[Math.floor(Math.random() * 6)] + " ";
                    }
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
                case "FAIL:DIV0":
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    tcTemp = "";
                    // Make up the numbers
                    includeError = false;
                    for (let j = 0; j < numCount; j++) {
                        if (!includeError && j < numCount - 2) {
                            includeError = Math.random() > (1 - j/numCount);
                            if (includeError) {
                                tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                                tcInput += "0 ";
                                tcInput += "/ ";
                                numOps++;
                                j++;
                                continue;
                            }
                        }
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                        if (j > numOps) {
                            // Add operators randomly
                            includeOps = Math.random() > 0.5;
                            if (includeOps) {
                                tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }
                        }
                    }
                    // Add operators as need be
                    for (let k = numOps; k < numCount - 1; k++) {
                        tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                    }

                    // Add error if not done so
                    if (!includeError) {
                        tcTemp = tcTemp + "0 / ";
                    }

                    tcInput += tcTemp;
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
                case "FAIL::POW0NEG":
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    tcTemp = "";
                    // Make up the numbers
                    includeError = false;
                    for (let j = 0; j < numCount; j++) {
                        if (!includeError && j < numCount - 2) {
                            includeError = Math.random() > (1 - j/numCount);
                            if (includeError) {
                                tcInput += "0 ";
                                tcInput += (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 901 + 100) + " ";
                                tcInput += "^ ";
                                numOps++;
                                j++;
                                continue;
                            }
                        }
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                        if (j > numOps) {
                            // Add operators randomly
                            includeOps = Math.random() > 0.5;
                            if (includeOps) {
                                tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }
                        }
                    }
                    // Add operators as need be
                    for (let k = numOps; k < numCount - 1; k++) {
                        tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                    }

                    // Add error if not done so
                    if (!includeError) {
                        tcTemp = "0 " + (-1 * Math.floor(Math.random() * 901 + 100)) + " ^ " + tcTemp;
                    }

                    tcInput += tcTemp;
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
                case "FAIL::POWLARGE":
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    tcTemp = "";
                    // Make up the numbers
                    includeError = false;
                    for (let j = 0; j < numCount; j++) {
                        if (!includeError && j < numCount - 2) {
                            includeError = Math.random() > (1 - j/numCount);
                            if (includeError) {
                                tcInput += (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 901 + 100) + " ";
                                tcInput += (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 901 + 100) + " ";
                                tcInput += "^ ";
                                numOps++;
                                j++;
                                continue;
                            }
                        }
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                        if (j > numOps) {
                            // Add operators randomly
                            includeOps = Math.random() > 0.5;
                            if (includeOps) {
                                tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }
                        }
                    }
                    // Add operators as need be
                    for (let k = numOps; k < numCount - 1; k++) {
                        tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                    }

                    // Add error if not done so
                    if (!includeError) {
                        tcTemp = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 901 + 100) + " ^ " + tcTemp;
                        tcTemp = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 901 + 100) + " " + tcTemp;
                    }

                    tcInput += tcTemp;
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
                case "FAIL:MOD0":
                    numCount = Math.floor(Math.random() * 6 + 2);
                    numOps = 0;
                    tcTemp = "";
                    // Make up the numbers
                    includeError = false;
                    for (let j = 0; j < numCount; j++) {
                        if (!includeError && j < numCount - 2) {
                            includeError = Math.random() > (1 - j/numCount);
                            if (includeError) {
                                tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                                tcInput += "0 ";
                                tcInput += "% ";
                                numOps++;
                                j++;
                                continue;
                            }
                        }
                        tcInput += Math.floor(Math.random() * 2001 - 1000) + " ";
                        if (j > numOps) {
                            // Add operators randomly
                            includeOps = Math.random() > 0.5;
                            if (includeOps) {
                                tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                                numOps++;
                            }
                        }
                    }
                    // Add operators as need be
                    for (let k = numOps; k < numCount - 1; k++) {
                        tcTemp += ops[Math.floor(Math.random() * 6)] + " ";
                    }

                    // Add error if not done so
                    if (!includeError) {
                        tcTemp = tcTemp + "0 % ";
                    }

                    tcInput += tcTemp;
                    // Remove the space at the end
                    tcInput = tcInput.slice(0, tcInput.length - 1);
                    // Add a new line
                    tcInput += "\n";
                    break;
            }
        }
        // Remove the new line character at the end
        tcInput = tcInput.slice(0, tcInput.length - 1);
    }
    return tcInput;
}

// Handles grading for random and custom test cases
function continueGrading(req, res, tcIndex, tcInput, tcOutput) {
    const {spawn} = require('child_process');
    const pyProg = spawn('python', ['tmp/test-submission-'+req.body.userID+'.py', tcInput]);
    let userOut = ""
    pyProg.stdout.on('data', function(data) {
        try {
            
            //dataStr = data.toString()
            userOut += data;
        } catch (err) {
            console.log(err)
            userOut += err;
            res.write("ERROR:" + err);
        }
    });
    pyProg.stderr.on('data', function(data) {
        userOut += data;
    });
    pyProg.on('close', function(code) {
        // Strip the extra character which comes from user output

        console.log("User exit code: " + code);
        res.write("INPUT:\n")
        res.write(tcInput);
        res.write("\nEXPECTED:\n")
        res.write(tcOutput);
        res.write("\nOUTPUT:\n")
        res.write(userOut);
        reqSend = {}
        reqSend.body = {};
        reqSend.body.userID = req.body.userID;
        reqSend.body.username = req.body.userName;
        reqSend.body.fileCode = req.body.fileTXT;
        reqSend.body.tcNum = tcIndex - 1;
        if (userOut === tcOutput) {
            reqSend.body.passed = true;
            res.end('\nSUCCESS');

        } else {
            // console.log("TC " + tcIndex + " User output: " + Array.from(userOut));
            // console.log("TC " + tcIndex + " output: " + Array.from(tcOutput));
            reqSend.body.passed = false;
            res.end('\nFAIL');
        }
        updateTestResults(reqSend);
        // console.log("Test case " + tcIndex + " graded!");
    });

    // Stop execution if max time reached
    setTimeout(() => {
        userOut += "\nTIMEOUT ERROR";
        pyProg.kill();
    }, maxRunTime);
}

router.post('/sendGradeRequest', function(req, res)  {
    console.log("Grade requested");
    // res.send("Test");
    // let submission = req.data;
    // console.log(req.body);
    let securityCheck = checkImports(req.body.fileText, ['import sys', 'import math']);
    if (securityCheck != "") {
        console.log("security check failed");
        res.send(securityCheck);
        return;
    }
    try {
        if (req) {
            console.log("Req exists");
            console.log(req.body == undefined || req.body === undefined);
            console.log("Req body:" + Object.keys(req.body));
            console.log("Req test:" + req.body.test);
            console.log("Req userID:" + req.body.userID);
        }
        fs.writeFileSync('tmp/test-submission-'+req.body.userID+'.py', req.body.fileText);
        // file written successfully
      } catch (err) {
        console.error(err);
      }
    // console.log(req);
    console.log("Test");
    const {spawn} = require('child_process');
    var testCase = "";
    var testOut = "";
    var testError = "";
    var testIn = "";
    var userOut = "";
    let tcIndex = req.body.tcNum;
    if (tcIndex <= maxNormalTC) {
        // Handle normal test cases
        try {
            testCase = fs.readFileSync("test-case-"+tcIndex+".txt", 'utf8');
            // testOut = fs.readFileSync("test-case-"+tcIndex+"-out.txt", 'utf8');
            // console.log(testCase);

        } catch (err) {
            console.log(err)
            testError += err;
        }
    } else if (tcIndex <= maxNormalTC + maxRandomTC) {
        // Handle random test cases
        testCase = generateRandomTC(tcIndex);

    } else {
        if (req.body.tcInput != undefined) {
            testCase = req.body.tcInput;
        } else {
            testCase = "";
        }
    }
    // console.log("Generated test case " + tcIndex + ":" + testCase);
    const pyProgSoln = spawn('python', ['Grading/RPN_Calculator_Soln.py', testCase]);
    pyProgSolnDict[req.body.userID] = pyProgSoln;

    pyProgSoln.stdout.on('data', function(data) {
        testOut += data;
    });
    pyProgSoln.stderr.on('data', function(data) { 
        testError += data;
    });
    pyProgSoln.on('close', function(code) {
        console.log("Program ended with code " + code);
        continueGrading(req, res, tcIndex, testCase, testOut + testError);
    });

    // Stop execution if max time reached
    setTimeout(() => {
        testError += "\nTIMEOUT ERROR";
        pyProgSoln.kill();
    }, maxRunTime);

    // for (let tcIndex = 1; tcIndex < maxTC + 1; tcIndex++) {

    //const pyProg = spawn('python', ['Grading/RPN_Calculator_Soln.py', testCase]);

    //const vm = new NodeVM({require: {builtin: ['child_process']}});
    // console.log("Spawned");
    
    
    // }
});

module.exports = router;