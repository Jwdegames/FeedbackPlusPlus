const express = require('express');
// express.use(json);
const router = express.Router();
const fs = require('fs')
var maxTestCase = 5;
var pyProg;
var debugResDict = {};
var pyProgDict = {}


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
    if (fileTXT.match(/open *\(/)) {
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

router.post('/debug', function(req, res)  {
    let securityCheck = checkImports(req.body.fileText, ['import sys', 'import math']);
    if (securityCheck != "") {
        console.log("security check failed");
        res.send(securityCheck);
        return;
    }
    console.log("Debug requested");
    // Close the current process:
    if (req.body.userID in pyProgDict) {
        console.log("Killing old debug process");
        pyProgDict[req.body.userID].kill();
    }
    // res.send("Test");
    // let submission = req.data;
    // console.log(req.body);
    try {
        if (req) {
            console.log("Req exists");
            console.log(req.body == undefined || req.body === undefined);
            console.log("Req body:" + Object.keys(req.body));
            console.log("Req test:" + req.body.test);
        }
        fs.writeFileSync('tmp/test-submission-'+req.body.userID+'-debug.py', req.body.fileText);
        // file written successfully
      } catch (err) {
        console.error(err);
      }
    // console.log(req);
    console.log("Test");
    const {spawn} = require('child_process');
    var testCase;
    let tcIndex = req.body.tcNum;
    debugResDict[req.body.userID] = res;
    // for (let tcIndex = 1; tcIndex < maxTestCase + 1; tcIndex++) {
    try {
         //testCase = fs.readFileSync("test-case-"+tcIndex+".txt", 'utf8');
        console.log(testCase);
    } catch (err) {
        console.log(err)
        // res.write("ERROR");
    }
    //const pyProg = spawn('python', ['Grading/RPN_Calculator_Soln.py', testCase]);
    var testOut;
    var testIn = req.body.tcInput;
    let pyProg = spawn('python', ['-m', 'pdb','tmp/test-submission-'+req.body.userID+'-debug.py', testIn, "debug"], {stdio: ["pipe", "pipe", "pipe"]});
    pyProgDict[req.body.userID] = pyProg;
    console.log("Spawned");
    try {
        pyProg.stdout.on('data', function(data) {
            console.log("Sending debug message results!");
            dataStr = data.toString()
            // console.log("DATA:" + dataStr);
            success = true;
            // console.log(dataStr);
            let tempRes = debugResDict[req.body.userID];
            // tempRes.write("OUTPUT:\n")
            tempRes.write(data);
            tempRes.end('\nDEBUG');
            
        });
        pyProg.stderr.on('data', function(data) {
            dataStr = data.toString()
            // console.log(dataStr);
            let tempRes = debugResDict[req.body.userID];
            tempRes.write("OUTPUT:\n")
            tempRes.write(data);
            tempRes.end('\nFAILED TO EXECUTE');
            // res.send("FAILED:" + dataStr);
            // res.end('end');
        });
        // }
    } catch (err) {
        console.log(err);
    }
    
});


router.post('/sendDebugMSG', function(req, res)  {
    // FOR SYNC ISSUES, ONLY CALL THIS ONE AT A TIME
    console.log("Sending debug message: " + req.body.message);
    let currPyProg = pyProgDict[req.body.userID];
    if (currPyProg == undefined || currPyProg === undefined) {
        res.send("ERROR: NO CHILD");
    }
    else {
        // Commands are necessary to prevent code injection
        let commands = ["next", "step", "getLines", "printGlobals", "initLocals", "setLocals", "printLocals", "setBreak", "removeBreak", "clearBreaks", "playUntilBreak", "play"];
        let commandMap = {
            next : "next\n",
            step : "step\n",
            getLines : "l .\n",
            printGlobals : "[\"|:>var:| {} |:>value:| {} |:>type:| {} |:<end:| \".format(i, globals()[i], type((globals()[i]))) for i in list(globals().keys())]\n",
            initLocals : "var1491625 = []\n",
            setLocals : "for var182764 in dir(): var1491625.append(\"|:>var:| {} |:>value:| {} |:>type:| {} |:<end:|\".format(var182764, locals()[var182764], type(locals()[var182764])))\n",
            printLocals : "p var1491625\n",
            setBreak: "b",
            removeBreak: "cl",
            clearBreaks: "cl\n",
            playUntilBreak: "continue\n",
            play: "c\n",
        };
        if (commands.includes(req.body.message)) {
        // WE CAN DO ONE REQUEST AT A TIME bc res needs to be set.
            debugResDict[req.body.userID] = res;
            let cmd = commandMap[req.body.message];
            // Modify command if need be
            if (cmd == "b") {
                console.log("Adding breakpoint at line: " + req.body.bpNum);
                cmd += " " + req.body.bpNum + "\n";
            } else if (cmd == "cl") {
                console.log("Adding breakpoint at line: " + req.body.bpNum);
                cmd += " " + "tmp/test-submission-"+req.body.userID+"-debug.py" + ":" + req.body.bpNum + "\n";
            }
            console.log("Writing command: " + cmd);
            currPyProg.stdin.write(cmd);
            if (cmd == "cl\n") {
                currPyProg.stdin.write("yes\n");
            }
        } else {
            console.log("Invalid command: " + req.body.message);
            res.send("ERROR: INVALID COMMAND");
        }
    }
});

module.exports = router;