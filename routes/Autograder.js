const express = require('express');
const {NodeVM} = require("vm2");
// express.use(json);
const router = express.Router();
const fs = require('fs')
var maxTestCase = 5;

router.post('/getNumTestCases', function(req, res) {
    res.send(maxTestCase+"");
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
    if (fileTXT.indexOf("open(") != -1) {
        console.log("Open violation detected!");
        return "OPEN VIOLATION - No files may be opened!";
    }
    if (fileTXT.indexOf("__builtins__") != -1) {
        console.log("builtins violation detected!");
        return "BUILTINS VIOLATION - __builtins__ may not be modified!";
    }
    // All clear
    return "";
}

router.post('/sendGradeRequest', function(req, res)  {
    console.log("Grade requested");
    // res.send("Test");
    // let submission = req.data;
    // console.log(req.body);
    let securityCheck = checkImports(req.body.fileText, ['import sys']);
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
        }
        fs.writeFileSync('tmp/test-submission-'+req.body.userID+'.py', req.body.fileText);
        // file written successfully
      } catch (err) {
        console.error(err);
      }
    // console.log(req);
    console.log("Test");
    const {spawn} = require('child_process');
    var testCase;
    let tcIndex = req.body.tcNum;
    // for (let tcIndex = 1; tcIndex < maxTestCase + 1; tcIndex++) {
    try {
        testCase = fs.readFileSync("test-case-"+tcIndex+".txt", 'utf8');
        console.log(testCase);
    } catch (err) {
        console.log(err)
        // res.write("ERROR");
    }
    //const pyProg = spawn('python', ['Grading/RPN_Calculator_Soln.py', testCase]);
    var testOut;
    var testIn;
    const vm = new NodeVM({require: {builtin: ['child_process']}});
    console.log("Spawned");
    const pyProg = spawn('python', ['tmp/test-submission-'+req.body.userID+'.py', testCase]);
    pyProg.stdout.on('data', function(data) {
        try {
            dataStr = data.toString()
            // console.log("DATA:" + dataStr);
            success = true;
            testOut = fs.readFileSync("test-case-"+tcIndex+"-out.txt", 'utf8');
            testIn = fs.readFileSync("test-case-"+tcIndex+".txt", 'utf8');
            let data1 = dataStr.split("\n");
            let data2 = testOut.split("\n");
            // Check to make sure test case output and student output are exactly the same
            for(let i = 0; i < data2.length; i++) {
                if (i >= data1.length) {
                    success = false;
                    console.log("Data lengths different!");
                    break;
                }
                if (data1[i].trim() != data2[i].trim()) {
                    console.log("Data mismatch!");
                    console.log("DATA1: " + data1[i]);
                    console.log("DATA2: " + data2[i]);
                    success = false;
                    break;
                }
            }
            // console.log("DATA 1:" + data1);
            // console.log("testOUT 1:" + data2);
            // console.log(data1 == data2);
        } catch (err) {
            console.log(err)
            // res.write("ERROR");
        }
        if (success) {
            console.log("Passed test case");
            if (data == null) {
                console.log("NULL DATA");
                data = "NULL";
            }
            else {
                dataStr = data.toString();
            }
            res.write("INPUT:\n")
            res.write(testIn);
            res.write("\nEXPECTED:\n")
            res.write(testOut);
            res.write("\n\nOUTPUT:\n")
            res.write(data);
            res.end('\nSUCCESS');
            pyProg.kill();
        } else {
            console.log("Failed test case");
            if (data == null) {
                console.log("NULL DATA");
                data = "NULL";
            }
            else {
                dataStr = data.toString();
            }
            res.write("INPUT:\n")
            res.write(testIn);
            res.write("\nEXPECTED:\n")
            res.write(testOut);
            res.write("\n\nOUTPUT:\n")
            res.write(data);
            res.end('\nFAIL');
            pyProg.kill();
        }
    });
    pyProg.stderr.on('data', function(data) {
        console.log("Error on out");
        if (data == null) {
            console.log("NULL DATA");
            data = "NULL";
        }
        else {
            dataStr = data.toString();
        }
        testOut = fs.readFileSync("test-case-"+tcIndex+"-out.txt", 'utf8');
        testIn = fs.readFileSync("test-case-"+tcIndex+".txt", 'utf8');
        res.write("INPUT:\n")
        res.write(testIn);
        res.write("\nEXPECTED:\n")
        res.write(testOut);
        res.write("\n\nOUTPUT:\n")
        res.write(data);
        res.end('\nFAILED TO EXECUTE');
        pyProg.kill();
        // res.send("FAILED:" + dataStr);
        // res.end('end');
    });
    
    // }
});

module.exports = router;