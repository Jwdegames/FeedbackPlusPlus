// const { json } = require("express");testout

var textFromFileLoaded;
var fileTableDat;
var fileName;
var tcCount;
var normalTCCount;
var randomTCCount;
var customTCCount;
var tcDone = 0;
var tcResults;
var tcStatuses;
var tcPassed;
var uIN = "0";
var userName;
var currTCIdx; 
var currTC = "1";
var currCustomTC;
var customTCInputs = {};
var noDebug = false;
var runningDebug = false;
var runningTC = false;
var runningViz = false;
var showingDebugger = false;
var enabledDebugger = false;
var showingVisualizer = false;
var vizPlayMode = false;
var vizPlaySpeed = 1;
var playIntervalID = undefined;
var hasInitViz = false;
var breakpoints = {};
var savedBP = {};
var canSetBP = false;
var highlightedLineNum = 0;
var globalDebugLines = "";
var gDLLen = 0;
var totalJVD; 

var signInEnabled = true;

// Debug variables
var cLineParts;
var varData;
var currPart;
var jsonVarData;
var globalJVD;
var localJVD;
var fileEvent;


/**
 * Disables the file selector, run test cases button, debug/visualizier togglez, logout button, and settings button
 */
function disableGeneralComponents() {
    document.querySelector("#run-tests").disabled = true;
    document.querySelector("#logout-section").disabled = true;
    document.querySelector("#toggle-dv").disabled = true;
    document.querySelector("#submissionFile").disabled = true;
    document.querySelector("#file-upload-button").disabled = true;
}

/**
 * Enables the file selector, run test cases button, debug/visualizier toggle, logout button, and settings button
 */
function enableGeneralComponents() {

    document.querySelector("#run-tests").disabled = false;
    document.querySelector("#logout-section").disabled = false;
    document.querySelector("#toggle-dv").disabled = false;
    document.querySelector("#submissionFile").disabled = false;
    document.querySelector("#file-upload-button").disabled = false;
}

function runTestCase(index) {
    let tcNumStr = (index + 1) + ""
    console.log("Executing post " + tcNumStr);
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            tcResults[index] = data;
            let dataLines = tcResults[index].split("\n");
            let flag = dataLines[dataLines.length - 1];
            if (flag == "SUCCESS") {
                tcStatuses[index] = "PASS";
            } else {
                tcStatuses[index] = "FAIL";
            }

            runTestCase(index + 1);
        }
    );
}

function makeTestCaseTable() {
    var tcTable = "<table id ='tc-table-area' class = 'table table-hover table-light auto' style='width:400px;'>";
    tcTable += "<tbody id = 'tc-table-tbody'><tr><th class = 'th-tc-num'>Test Case #</th>";
    tcTable += "<th>Pass / Fail</th><th>View / Debug Test Case</th></tr>";
    for (let i = 0; i < tcCount; i++) {
        tcTable += "<tr><td class = 'td-tc-num'>"+(i + 1);
        if (i + 1 > normalTCCount + randomTCCount) {
            // Make the button to edit the custom test case
            tcTable += "<input type = 'submit' class = 'btn btn-primary btn-block' id = 'tcCustomEdit"+(i+1)+"' value = 'Edit' onclick = 'editCustomTC("+(i + 1)+")'></input>";
        }
        tcTable += "</td>";
        if (tcStatuses[i] == "PASS") {
            tcTable += "<td id = 'td-tc-pf-" + (i + 1) + "' class = 'td-tc-pf' style = 'color:green'><b>"+tcStatuses[i]+"</b></td>"
        } else {
            tcTable += "<td id = 'td-tc-pf-" + (i + 1) + "' class = 'td-tc-pf' style = 'color:red'><b>"+tcStatuses[i]+"</b></td>"
        }
        tcTable += "<td class = 'td-tc-view'><div class ='form-group'><div class = 'row no-gutters'>";
        tcTable += "<div class = 'col-sm-6'><input type='submit' class='btn btn-primary btn-block' id='tc"+(i + 1)+"' value='View' onclick='makeTestCaseOutput("+(i)+")'></div>"
        tcTable += "<div class = 'col-sm-6'><input type='submit' class='btn btn-primary btn-block' id='tcd"+(i + 1)+"' value='Debug' onclick='debug("+(i + 1)+")'></div>"
        tcTable += "<div class = 'col-sm-12'><input type='submit' class='btn btn-primary btn-block' id='tcv"+(i + 1)+"' value='Visualize' onclick='visualize("+(i + 1)+")'></div>"
        tcTable += "</td></tr>"
    }
    tcTable += "</tbody>"
    $("#tc-table").html(tcTable);
}

function makeTestCaseOutput(tcIndex) {
    let tcOut;
    currTCIdx = tcIndex;
    tcOut = "<div class='form-group shadow-textarea' style=''>";
    tcOut += "<label for='exampleFormControlTextarea6' class ='text-center' style='text-decoration:underline; font-weight:bold; display:block;'>Test Case " + (tcIndex + 1) +" </label>"
    tcOut += "<div contenteditable='false' class='form-control z-depth-1' id='tc-out-area' style='width:400px; height:300px' readonly>";
    let splitTCR = tcResults[tcIndex].split("\n");
    for (let i = 0; i < splitTCR.length; i++) {
        tcOut += "<p class = 'tc-out-line'>"+splitTCR[i]+"</p>";
    }
    tcOut += "</textarea></div><br>";
    $("#tc-output").html(tcOut);

}

function checkCompletion() {
    tcDone += 1;
    if (tcDone == tcCount) {
        console.log("Test Cases Complete!");
        makeTestCaseTable();
        makeTestCaseOutput(0);
        document.querySelector("#run-tests").disabled = false;
        // Show the buttons
        if (!noDebug) {
            debug("1");
        }
        runningTC = false;
        // tryEnableFileInput();
        // Get the number of test cases passed
        tcPassed = 0;
        for (let i = 0; i < tcCount; i++) {
            if (tcStatuses[i] == "PASS") {
                tcPassed += 1;
            }
        }
        console.log("Test cases passed: " + tcPassed + "/" + tcCount);
        // enableDebugButtons();
        // enableVizButtons();
        if (showingVisualizer) {
            toggleVisualizerVis();
        }
        if (!showingDebugger) {
            toggleDebuggerVis();
        }
        $("#toggle-dv").css("display", "");
        document.querySelector("#toggle-dv").innerHTML = "Switch to Visualizer";
        hasInitViz = false;
    }

}



function runTestCases(numTC) {
    // We need to generate the number of test cases
    tcResults = []
    tcStatuses = []
    noDebug = false;

    disableDebugButtons();
    disableVizButtons();
    for (let i = 0; i < numTC; i++) {
        // tcResults.push(0);
        // tcStatuses.push(0);
    }
    console.log("Initial post complete");
    let ajaxurl = "/Autograder/sendGradeRequest";
    console.log(numTC);
    for (let i = 0; i < numTC; i++) {
        let tcNumStr = (i + 1) + ""
        console.log("Executing post " + tcNumStr);
        let tcInput = "";
        if (i in customTCInputs) {
            tcInput = customTCInputs[i];
        }
        $.post(ajaxurl,
            {
                test: "hi",
                fileText: textFromFileLoaded,
                userID: uIN,
                userName: userName,
                tcNum: tcNumStr,
                tcInput: tcInput,
            },
            function(data, status) {
                console.log("STATUS:" + status);
                console.log(data);
                tcResults[i] = data;
                let dataLines = tcResults[i].split("\n");
                let flag = dataLines[dataLines.length - 1];
                if (flag == "SUCCESS") {
                    tcStatuses[i] = "PASS";
                } else {
                    tcStatuses[i] = "FAIL";
                    if (flag.indexOf("VIOLATION") != -1) {
                        noDebug = true;
                    }
                }
                checkCompletion();
            }
        );
    }

}

function disableDebugButtons() {
    enabledDebugger = false;
    document.querySelector("#run-debug").disabled = true;
    document.querySelector("#run-debug-NL").disabled = true;
    document.querySelector("#run-debug-NS").disabled = true;
    document.querySelector("#run-debug-PB").disabled = true;
    document.querySelector("#run-debug-SB").disabled = true;
    document.querySelector("#run-debug-LB").disabled = true;
    document.querySelector("#run-debug-CB").disabled = true;
    for (let i = 0; i < tcCount; i++) {
        let tcd = document.querySelector("#tcd" + (i + 1))
        if (tcd != null) {
            tcd.disabled = true;
        }
    }
}

function showDebugButtons() {
    // Display debug buttons
    $("#run-debug").css("display","");
    $("#run-debug-NL").css("display","");
    $("#run-debug-NS").css("display","");
    $("#run-debug-PB").css("display","");
    $("#run-debug-BPL").css("display","");
    $("#run-debug-SB").css("display","");
    $("#run-debug-LB").css("display","");
    $("#run-debug-CB").css("display","");
}

function hideDebugButtons() {
    // Hide debug buttons
    $("#run-debug").css("display","none");
    $("#run-debug-NL").css("display","none");
    $("#run-debug-NS").css("display","none");
    $("#run-debug-PB").css("display","none");
    $("#run-debug-BPL").css("display","none");
    $("#run-debug-SB").css("display","none");
    $("#run-debug-LB").css("display","none");
    $("#run-debug-CB").css("display","none");
}

function enableDebugButtons() {
    enabledDebugger = true;
    document.querySelector("#run-debug").disabled = false;
    document.querySelector("#run-debug-NL").disabled = false;
    document.querySelector("#run-debug-NS").disabled = false;
    document.querySelector("#run-debug-PB").disabled = false;
    document.querySelector("#run-debug-SB").disabled = false;
    document.querySelector("#run-debug-LB").disabled = false;
    document.querySelector("#run-debug-CB").disabled = false;
    for (let i = 0; i < tcCount; i++) {
        document.querySelector("#tcd" + (i + 1)).disabled = false;
    }
}

/**
 * Enables the debug buttons in the test case table.
 */
function enableTCDebugButtons() {
    for (let i = 0; i < tcCount; i++) {
        document.querySelector("#tcd" + (i + 1)).disabled = false;
    }
}

/**
 * Disables the debug buttons in the test case table.
 */
function disableTCDebugButtons() {
    for (let i = 0; i < tcCount; i++) {
        let tcd = document.querySelector("#tcd" + (i + 1))
        if (tcd != null) {
            tcd.disabled = true;
        }
    }
}

/**
 * Toggles the visibility of the debugger
 */
function toggleDebuggerVis() {
    if (showingDebugger) {
        $("#debugger").css("display","none");
    } else {
        $("#debugger").css("display","");
    }
    showingDebugger = !showingDebugger;
}

/**
 * Resets the debugger with the current test case
 */
function debugReset() {
    debug(currTC);
}

function debug(tcNumStr) {
    runningDebug = true;
    canSetBP = false;
    currTC = tcNumStr;
    suspendDebug();
    disableDebugButtons();
    disableVizButtons();
    clearBP(false);
    if (showingVisualizer) {
        toggleVisualizerVis();
    } 
    if (!showingDebugger) {
        toggleDebuggerVis();
    }
    disableGeneralComponents();
    document.getElementById("submissionFile").disabled = true;
    document.querySelector("#toggle-dv").innerHTML = "Switch to Visualizer";
    var ajaxurl = "/Debugger/debug";
    console.log("Sending debug post");

    // let tcNumStr = (currTCIdx + 1) + "";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            tcInput: getTCInput(tcNumStr),
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            debugGLN([data],tcNumStr);
        }
    );
}

/**
 * Gets next line in debugger
 */
function debugNL() {
    runningDebug = true;
    canSetBP = false;
    // disable debug buttons
    disableDebugButtons();
    disableVizButtons();
    disableGeneralComponents();
    document.getElementById("submissionFile").disabled = true;
    var ajaxurl = "/Debugger/sendDebugMSG";
    console.log("Sending debug post");
    let tcNumStr = (currTCIdx + 1) + "";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            message: "next"
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            dataArray = [data];
            debugGLN(dataArray, tcNumStr);
        }
    );
}

/**
 * Gets next step in debugger
 */
 function debugNS() {
    runningDebug = true;
    canSetBP = false;
    // disable debug buttons
    disableDebugButtons();
    disableVizButtons();
    disableGeneralComponents();
    document.getElementById("submissionFile").disabled = true;
    var ajaxurl = "/Debugger/sendDebugMSG";
    console.log("Sending debug post");
    let tcNumStr = (currTCIdx + 1) + "";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            message: "step"
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            dataArray = [data];
            debugGLN(dataArray, tcNumStr);
        }
    );
}

/**
 * Continues the debugger until the next breakpoint
 */
function debugPB() {
    runningDebug = true;
    // disable debug buttons
    disableDebugButtons();
    disableVizButtons();
    disableGeneralComponents();
    var ajaxurl = "/Debugger/sendDebugMSG";
    console.log("Sending debug post");
    let tcNumStr = (currTCIdx + 1) + "";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            message: "playUntilBreak"
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            if (data.indexOf("ERROR: INFINITE LOOP") != -1) {
                console.log("Infinite loop error");
                enableGeneralComponents();
                enableTCVizButtons();
                document.querySelector("#run-debug").disabled = false;
            } else {
                dataArray = [data];
                debugGLN(dataArray, tcNumStr);
            }
        }
    );
}

/**
 * Continues the debugger to the end, ignoring breakpoints
 */
function debugP() {
    runningDebug = true;
    // disable debug buttons
    disableDebugButtons();
    disableVizButtons();
    disableGeneralComponents();
    var ajaxurl = "/Debugger/sendDebugMSG";
    console.log("Sending debug post");
    let tcNumStr = (currTCIdx + 1) + "";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            message: "play"
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            dataArray = [data];
            debugGLN(dataArray, tcNumStr);
        }
    );
}

/**
 * Finds the line number from pdb list . 
 */

function findLNFromData(data) {
    let lNum = 0;
    let lines = data.split("\n");
    // console.log(lines);
    for (let i = 0; i < lines.length; i++) {
        let cLine = lines[i];
        let cLineTrim = cLine.trim();
        cLineParts = cLineTrim.slice(cLineTrim.indexOf(" ")).trim();
        // console.log(cLineParts);
        if (cLineParts.length >= 2 && cLineParts.indexOf("->\t") != -1) {
            lNum = cLineTrim.slice(0, cLineTrim.indexOf(" "));
            break;
        }
        /* console.log(cLineParts);
        if (cLineParts.length >= 5 && cLineParts[4].length >= 2 && cLineParts[4].slice(0, 2) == "->") {
            lNum = i + 1;
            break;
        }*/
    }
    return lNum;
}

/**
 * Gets line number of current debug line
 */
function debugGLN(prevData, tcNumStr) {
    var ajaxurl = "/Debugger/sendDebugMSG";
    console.log("Getting debug line number");
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            message: "getLines"
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            lineNum = findLNFromData(data);
            console.log("Line Num: " + lineNum);
            prevData.push(lineNum);
            debugVars(prevData, tcNumStr);
        }
    );
}

/**
 * Turns the variables into a json like data structure from python globals()
 * @param {*} data A string of data separated by commas
 */
function getVarsJsonOld(data) {
    console.log("Cleaning data");
    varData = data;
    let varJsonSection = varData.slice(1, -15);
    let vJS = varJsonSection;
    // Go through and loop through the data
    // while (varJsonSection.indexOf(":") != 0) {
        // Scan if open bracket needed
    // }
    let startIndex = 0;
    let endIndex;
    let inBrackets = false;
    let findingKey = true;
    let bracketStack = [];
    jsonVarData = {};
    let jsonKey = "";
    for (let i = 0; i < vJS.length; i++) {
        if (findingKey === true) {
            // Handle finding key
                if (vJS[i] == ":") {
                    endIndex = i - 1;
                    jsonKey = vJS.slice(startIndex, endIndex + 1).replaceAll("'","").replaceAll("\"","").trim();
                    startIndex = i + 1;
                    // console.log("new key: " + jsonKey);
                    // We found key -> find value now
                    findingKey = false;
                }
        } else {
            if (inBrackets === false) {
                if (vJS[i] == ",") {
                    endIndex = i - 1;
                    let jsonVal = vJS.slice(startIndex, endIndex + 1);
                    jsonVarData[jsonKey] = jsonVal;
                    startIndex = i + 1;
                    // console.log("new value: " + jsonVal);
                    // We found value -> find new key
                    findingKey = true;
                } else if (vJS[i] == "{") {
                    // console.log("Bracket mode entered!");
                    inBrackets = true;
                    bracketStack.push("{");
                }
            } else {
                // Parse the brackets
                if (vJS[i] == "{") {
                    bracketStack.push("{");
                } else if (vJS[i] == "}") {
                    bracketStack.pop();
                }
                if (bracketStack.length == 0) {
                    inBrackets = false;
                    // console.log("Bracket mode deactivated");
                }
            }
        }
    }
    // The rest of the data is the value for the last key
    endIndex = varData.length - 1;
    let jsonVal = vJS.slice(startIndex, endIndex + 1);
    jsonVarData[jsonKey] = jsonVal;
    return jsonVarData;
}

/**
 * Turns the variables into a json like data structure from python globals()
 * @param {*} data A string of data separated by commas
 */
 function getVarsJson(data, mode) {
    console.log("Cleaning data");
    varData = data;
    // varJsonSelection
    let vJS;
    if (mode == 1) {
        vJS = varData.slice(1, -15);
    } else if (mode == 2) {
        vJS = varData;
    }
    let vJSParts = vJS.split("|:<end:|")
    jsonVarData = {};
    // Go through and separate the data
    for (let i = 0; i < vJSParts.length - 1; i++) {
        currPart = vJSParts[i];
        let varIndex = currPart.indexOf("|:>var:|");
        let valueIndex = currPart.indexOf("|:>value:|");
        let typeIndex = currPart.indexOf("|:>type:|");
        let key = currPart.slice(varIndex + 9, valueIndex).trim();
        if (key == "var1491625") {
            // This is the made up var for looping through local -> we don't need it.
            continue;
        }
        let value = currPart.slice(valueIndex + 10, typeIndex).trim();
        let type = currPart.slice(typeIndex + 9).trim();
        let currObj = {};
        currObj["value"] = value;
        currObj["type"] = type;
        console.log(currObj);
        jsonVarData[key] = currObj;
        // jsonVarData[currPart] = 0;
    }

    return jsonVarData;
}

/**
 * Gets variable contents
 */
 function debugVars(prevData, tcNumStr) {
    // Use this command : [\"|:>var:| {} |:>value:| {} |:>type:| {} |:<end:|\".format(i, globals()[i], type((globals()[i]))) for i in list(globals().keys())]\n 
    // For locals: 
    // var1491625 = []
    // for i in dir(): var1491625.append(\"|:>var:| {} |:>value:| {} |:>type:| {} |:<end:|\".format(i, locals()[i], type(locals()[i])))\n
    // p var1491625
    // It will create neat separations between variables, their types, and values. This removes the need for parsing {}.
    var ajaxurl = "/Debugger/sendDebugMSG";
    console.log("Getting debug vars");
    // Enter interactive mode first
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            message: "printGlobals"
        },
        function(data, status) {
            console.log("STATUS GET GLOBAL VARS:" + status);
            // Get the variable info
            globalJVD = getVarsJson(data, 1);
            prevData.push(globalJVD);
            $.post(ajaxurl,
                {
                    test: "hi",
                    fileText: textFromFileLoaded,
                    userID: uIN,
                    tcNum: tcNumStr,
                    message: "initLocals"
                },
                function(data, status) {
                    console.log("STATUS SET LOCALS:" + status);
                    $.post(ajaxurl,
                        {
                            test: "hi",
                            fileText: textFromFileLoaded,
                            userID: uIN,
                            tcNum: tcNumStr,
                            message: "setLocals"
                        },
                        function(data, status) {
                            console.log("STATUS APPEND LOCAL VARS:" + status);
                            // Get the variable info
                            $.post(ajaxurl,
                                {
                                    test: "hi",
                                    fileText: textFromFileLoaded,
                                    userID: uIN,
                                    tcNum: tcNumStr,
                                    message: "printLocals"
                                },
                                function(data, status) {
                                    console.log("STATUS GET LOCAL VARS:" + status);
                                    // console.log("Local data: " + data);
                                    // Get the variable info
                                    localJVD = getVarsJson(data, 1);
                                    prevData.push(localJVD);
                                    processDebugInfo(prevData, tcNumStr);
                                }
                            );                                
                        }
                    );                    
                }
            );
        }
    );

}


function updateTotalJVD(globalJVD, localJVD) {
    // Update global variables
    for (var prop in globalJVD) {
        if (Object.prototype.hasOwnProperty.call(globalJVD, prop)) {
            // Update totalJVD
            totalJVD[prop] = globalJVD[prop];
        }
    }
    // Update local variables
    for (var prop in localJVD) {
        if (Object.prototype.hasOwnProperty.call(localJVD, prop)) {
            // Update totalJVD
            totalJVD[prop] = localJVD[prop];
        }
    }
    return totalJVD;
}

/**
 * Processes debug information and updates appropriate GUI elements
 * @param {*} data Debug data array
 * @param {*} tcNumStr test case #
 */
function processDebugInfo(data, tcNumStr) {
    // Data components:
    // 0 - output
    // 1 - line number
    // 2 - global variables
    // 3 - local variables
    let output = data[0];
    let lineNum = data[1];
    let globalJVD = data[2];
    let localJVD = data[3];
    let ended = false;
    // Highlight the line that's being focused and move the scroll to the appropriate location
    $("#file-line"+highlightedLineNum).css("background-color", "");
    if (lineNum == 0) {
        console.log("Reached [EOF]");
        ended = true;
    } else{
        console.log("First line: " + output.split("\n")[0]);
    }
    if (!ended && lineNum != 0) {
        $("#file-line"+lineNum).css("background-color", "green");
        let offset = -$("#submission-contents").offset().top + $("#file-line"+lineNum).offset().top - 7 +$("#submission-contents").scrollTop();
        $("#submission-contents").scrollTop(offset); 
    }

    highlightedLineNum = lineNum;

    // Display the output of the debug command
    let debugOutputDat;
    debugOutputDat = "<div class='form-group shadow-textarea' style='height:285px;'>";
    debugOutputDat += "<div contenteditable='false' class='form-control z-depth-1' id='debug-contents' readonly>";
    debugLines = output.split("\n");
    let prevGDLLen = gDLLen;
    // Ignore last line - it just says DEBUG or FAILED TO EXECUTE
    for (let i = 0; i < debugLines.length - 1; i++) {
        console.log(debugLines[i]);
        let newContent = htmlSpacesBeginning(debugLines[i]);
        gDLIdx = i + 1 + prevGDLLen;
        gDLLen += 1;
        globalDebugLines += "<p class = 'debug-line' id = 'debug-line" + gDLIdx + "'><span class = 'debug-line-index'>" + gDLIdx + "</span>&nbsp" + newContent + "</p>";
    }
    debugOutputDat += globalDebugLines;
    debugOutputDat += "</textarea></div><br>";

    $("#debug-output").html(debugOutputDat);
    let debugContents = $("#debug-contents");
    debugContents.scrollTop(debugContents.prop("scrollHeight"));

    // Make debug variable table
    updateTotalJVD(globalJVD, localJVD);
    var debugTable = "<table id ='debug-table-area' class = 'table table-hover table-light auto'>";
    debugTable += "<tbody id = 'debug-table-tbody'><tr><td class = 'th-debug-name'>Variable Name</td>"
    debugTable += "<td class = 'th-debug-type'>Type</td><td class = 'th-debug-value'>Value</tr>";
    Object.keys(totalJVD).forEach(function(key, index) {
        // Don't do the excluded keys
        excludedKeys = ["__builtins__", "__name__", "__file__", "var182764", "pe:|", "ype:|", "pe:| <class \\'list\\'>", "pe:| <class \\\\\\'list\\\\\\'>", "ype:| <class \\'list\\'>"]
        if (!(excludedKeys.includes(key))) {
            console.log("Adding key:" + key );
            debugTable += "<tr><td class = 'td-debug-name'>"+key+"</td>";
            let cutKey = totalJVD[key].type.slice(1,-1);
            let cutKeyStartIdx = cutKey.indexOf("'");
            let cutKeyStart = cutKey.slice(cutKeyStartIdx + 1);
            cutKey = cutKeyStart.slice(0, cutKeyStart.indexOf("'"));
            debugTable += "<td class = 'td-debug-type'>"+cutKey+"</td>";
            debugTable += "<td class = 'td-debug-value'>"+totalJVD[key].value+"</td></tr>";
        }
    });
    debugTable += "</tbody>";
    $("#debug-table").html(debugTable);
    let debugTableBody = $("#debug-table-tbody");
    debugTableBody.scrollTop(debugTableBody.prop("scrollHeight"));

    // Enable debug buttons
    showDebugButtons();
    if (ended) {
        disableDebugButtons();
        // But enable the reset button
        document.querySelector("#run-debug").disabled = false;
    } else {
        // Enable the debugger
        if (!showingDebugger) {
            toggleDebuggerVis();
        }
        enableDebugButtons();
    }
    runningDebug = false;
    tryEnableFileInput();
    enableVizButtons();
    enableGeneralComponents();
    canSetBP = true;
}

/**
 * Suspends debugging operations
 */
function suspendDebug() {
    // Reset the debug output
    globalDebugLines = "";
    gDLLen = 0;

    totalJVD = {};
}

function autograde() {
    canSetBP = false;
    document.querySelector("#run-tests").disabled = true;
    document.getElementById("submissionFile").disabled = true;
    disableGeneralComponents();
    if (showingVisualizer) {
        toggleVisualizerVis();
    }
    tcDone = 0;
    runningTC = true;
    console.log("Running test cases");
    var ajaxurl = "/Autograder/getNumTestCases";
    var sendDat = {test: 'hi', fileText: 'test'};
    jsonData = JSON.stringify(sendDat);
    console.log("Sending data: " + sendDat);
    /*$.ajax({type:'POST', url:ajaxurl, jsonData, contentType: "application/json; charset=utf-8" ,success:function(response){
        console.log("RESPONSE: " + response);
    }});*/
    let numTC = 0;
    $.post(ajaxurl,
        {},
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            //numTC = parseInt(data);
            let tcArray = JSON.parse(data);
            let numTC = parseInt(tcArray[0], 10);
            normalTCCount = parseInt(tcArray[1], 10);
            randomTCCount = parseInt(tcArray[2], 10);
            customTCCount = parseInt(tcArray[3], 10);
            tcCount = numTC;
            runTestCases(numTC);
            
        }

    );

    /*
    let myFunc = async () => {
        console.log("Sending request");
        // Fetch the Cost of living
        await Axios.post("/Autograder/sendGradeRequest", {
            seriesid: 'CUUR' + props.input3 +'SA0',
            startyear: '2008',
            endyear: '2022',})
        .then((response) => {
            console.log(response);
            setCostOfLiving(Object.values(response.data.Results.series[0].data));
        })
        .catch((err) => {
            console.log(err);
        })
    }
    myFunc();
    */
}

function htmlSpacesBeginning(content) {
    // Replaces spaces at beginning with &nbsp twice for html tags
    var splitIndex = 0;
    // console.log(content)
    for (let i = 0; i < content.length; i++) {
        if (content.charCodeAt(i) != 32) {
            splitIndex = i;
            break;
        }
    }
    // let newContent =  "<pre>" + content.slice(0, splitIndex) + "</pre>" + content.slice(splitIndex);
    let newContent = ""
    for (let j = 0; j < splitIndex; j++) {
        newContent += "&nbsp&nbsp";
    }
    newContent += content.slice(splitIndex);
    // console.log(splitIndex + " New content: " + newContent);
    return newContent;
}

function displayFileData(event) {
    var fileToLoad = document.getElementById("submissionFile").files[0];
    if (fileToLoad != null) {
        // Close debug buttons
        fileEvent = event;
        suspendDebug();
        disableDebugButtons();
        document.querySelector("#toggle-dv").disabled = true;
        disableVizButtons();
        // Display the data in the file

        var fileReader = new FileReader();
        fileName = fileToLoad.name;
        fileReader.onload = function(fileLoadedEvent){
            console.log("New file loaded");
            textFromFileLoaded = fileLoadedEvent.target.result;
            breakpoints = {};
            // console.log(textFromFileLoaded);
            fileTableDat = "<div class='form-group shadow-textarea' style='margin-left:50px'>";
            fileTableDat += "<label for='file-submission-label' style='text-decoration:underline; font-weight:bold;'>Your file:</label>"
            fileTableDat += "<div id = 'file-submission-wrapper'>";
            fileTableDat += "<div contenteditable='false' class='form-control z-depth-1' id='submission-contents' readonly>";

            fileLines = textFromFileLoaded.split("\n");
            for (let i = 0; i < fileLines.length; i++) {
                // console.log(fileLines[i]);
                let newContent = htmlSpacesBeginning(fileLines[i])
                // console.log("New content: " + newContent);
                // console.log("New file line: " + "<p class = 'file-line'><span class = 'file-line-index'>" + (i + 1) + "</span>&nbsp" + newContent + "</p>");
                fileTableDat += "<div class = 'file-line-div' onclick = 'toggleBP(" + (i + 1) + ")'><div id = 'bp-" + (i + 1) + "' class = 'breakpoint'>&#x25CF;</div>"
                fileTableDat += "<p class = 'file-line' id = 'file-line" + (i + 1) + "'><span class = 'file-line-index'>" + (i + 1) + "</span>&nbsp" + newContent + "</p>";
                fileTableDat += "</div>"
            }
            fileTableDat += "</textarea></div></div><br>";
            // fileTableDat += '<div class="md-form" style="margin-left:0px"><i class="fas fa-pencil-alt prefix"></i><label for="form10">Send a message:</label><textarea id="gmsg-send" class="md-textarea form-control" rows="3" cols="75" onkeypress="if(event.keyCode == 13) {sendGlobalMsg();}"></textarea></div></div>';
            // document.getElementById("file-table").value = textFromFileLoaded;
            // console.log(fileTableDat);

            $("#file-table").html(fileTableDat);
            $("#run-tests").css("display","");
            console.log("Applied html");

            // Disable everything but the run test cases command 
            disableDebugButtons();
            disableVizButtons();

        };

        fileReader.readAsText(fileToLoad, "UTF-8");
    }
    // Reset the file loader
    document.getElementById("submissionFile").value = "";

}


/**
 * loads breakpoints
 */
function debugLB() {
    let keys = Object.keys(breakpoints);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        $("#bp-" + key).css("display", "");
        // Tell the debugger to kill it
    }
    var ajaxurl = "/Debugger/sendDebugMSG";
    $.post(ajaxurl,
        {
            test: "hi",
            userID: uIN,
            tcNum: currTC,
            message: "clearBreaks", 
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            console.log("Setting breakpoints:")
            breakpoints = JSON.parse(JSON.stringify(savedBP));
            let keys2 = Object.keys(breakpoints);
            for (let i2 = 0; i2 < keys2.length; i2++) {
                let key2 = keys2[i2]
                if (breakpoints[key2]) {
                    // Enable the breakpoint if it's set to true
                    $("#bp-" + key2).css("display", "inline");
                    var ajaxurl = "/Debugger/sendDebugMSG";
                    $.post(ajaxurl,
                        {
                            test: "hi",
                            fileText: textFromFileLoaded,
                            userID: uIN,
                            tcNum: currTC,
                            message: "setBreak", 
                            bpNum: key2,
                        },
                        function(data, status) {
                            console.log("STATUS:" + status);
                            console.log(data);
                        }
                    );
                }
            }
        }
    );

}


/**
 * Saves the breakpoints
 */
function debugSB() {
    savedBP = JSON.parse(JSON.stringify(breakpoints));
}

/**
 * Clears breakpoints
 */
function clearBP(tellDebugger) {
    let keys = Object.keys(breakpoints);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        $("#bp-" + key).css("display", "");
        // Tell the debugger to kill it
    }
    if (tellDebugger) {
        var ajaxurl = "/Debugger/sendDebugMSG";
        $.post(ajaxurl,
            {
                test: "hi",
                userID: uIN,
                tcNum: currTC,
                message: "clearBreaks", 
            },
            function(data, status) {
                console.log("STATUS:" + status);
                console.log(data);
            }
        );
    }
    breakpoints = {};
}

/**
 * Toggles the breakpoint on the fileline
 */
function toggleBP(fileLineIdx) {
    let addBP = true;
    if (!canSetBP || !enabledDebugger) {
        // Return if we are not permitted to set breakpoints
        return;
    }
    if (fileLineIdx in breakpoints) {
        let bpCondition = breakpoints[fileLineIdx];
        if (bpCondition) {
            // We are currently showing breakpoint, remove it
            $("#bp-" + fileLineIdx).css("display", "");
            addBP = false;
        } else {
            // We are not currently showing breakpoint, show it
            $("#bp-" + fileLineIdx).css("display", "inline");
        }
        breakpoints[fileLineIdx] = !bpCondition 
    } else {
        breakpoints[fileLineIdx] = true;
        // Display the breakpoint
        $("#bp-" + fileLineIdx).css("display", "inline");
    }
    let bpCMD = "setBreak";
    if (!addBP) {
        bpCMD = "removeBreak";
    }
    // Tell debugger to add/clear breakpoint
    var ajaxurl = "/Debugger/sendDebugMSG";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: currTC,
            message: bpCMD, 
            bpNum: fileLineIdx,
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
        }
    );
}

// Attempts to enable file input - needs to not be running test cases and needs to not be running debugger
function tryEnableFileInput() {
    if (!runningDebug && !runningTC) {
        document.getElementById("submissionFile").disabled = false;
    }
}

function editCustomTC(tcID) {
    $("#autograder").css("display","none");
    $("#edit-tc").css("display", "");
    currCustomTC = tcID;
    if (tcID in customTCInputs) {
        // If we have a previous tc input, use it
        document.querySelector("#edit-tc-textarea").value = customTCInputs[tcID];
    }
}

/**
 * Cancels the custom test case editor
 */
function cancelCustomTC() {
    $("#autograder").css("display","");
    $("#edit-tc").css("display", "none");
}

/**
 * Saves the current custom test case and closes the test case editor
 */
function saveCustomTC() {

    noDebug = false;
    // console.log("Initial post complete");
    let ajaxurl = "/Autograder/sendGradeRequest";
    // console.log(numTC);

    // let tcNumStr = (i + 1) + "";
    // console.log("Executing post " + tcNumStr);
    let tcInput = "";
    customTCInputs[currCustomTC] = document.querySelector("#edit-tc-textarea").value;
    if (currCustomTC in customTCInputs) {
        tcInput = customTCInputs[currCustomTC];
    }
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: currCustomTC,
            tcInput: tcInput,
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            tcResults[currCustomTC - 1] = data;
            let dataLines = tcResults[currCustomTC - 1].split("\n");
            let flag = dataLines[dataLines.length - 1];
            if (flag == "SUCCESS") {
                tcStatuses[currCustomTC - 1] = "PASS";
                $("#td-tc-pf-" + currCustomTC).css("color", "green");
            } else {
                tcStatuses[currCustomTC - 1] = "FAIL";
                if (flag.indexOf("VIOLATION") != -1) {
                    noDebug = true;
                }
                $("#td-tc-pf-" + currCustomTC).css("color", "red");

            }
            // Update test status
            document.querySelector("#td-tc-pf-" + currCustomTC).innerHTML = "<b>" + tcStatuses[currCustomTC - 1]  + "</b>";
            $("#autograder").css("display","");
            $("#edit-tc").css("display", "none");
            // Show the results of the test case
        }
    );

}



// #########################
// Login / Logout Section
function logout() {
    console.log("Logging out");
    /*var ajaxurl = "/Database/connect";
    $.post(ajaxurl,
        {},
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
        }

    );*/
    // Hide components
    $("#autograder").css("display","none");
    $("#toggle-dv").css("display","none");
    document.querySelector("#tc-table").innerHTML = "";
    document.querySelector("#tc-output").innerHTML = "";
    $("#debugger").css("display","none");
    $("#visualizer").css("display","none");
    // Remove credentials
    localStorage.removeItem("userName");
    localStorage.removeItem("uIN");
    toggleSignInButtons();
    
}

// Displays sign in form
function signIn() {
    console.log("Sign in!");
    $("#main-content").css("display","none");
    $("#login-form").css("display","");
}

// Displays regular content.
function exitSignIn() {
    console.log("Exit sign in!");
    $("#main-content").css("display","");
    $("#login-form").css("display","none");
}

// Signs the user up.
function signUp() {
    console.log("Registering!");
    var ajaxurl = "/Database/register";
    let user = $("#user-box").val();
    let pass = $("#pass-box").val();
    console.log("User is: " + user + " and pass is: " + pass);
    $.post(ajaxurl,
        {
            test: "hi",
            username: user,
            password: pass,

        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            let dataLines = data.split("\n");
            let flag = dataLines[0];
            console.log(dataLines);
            $("#invalid-user").css("display","none");
            $("#invalid-pass").css("display","none");
            if (flag == "Registration Result (Success!):") {
                // Exit registration - we are all good to go!
                $("#user-taken").css("display","none");
                $("#autograder").css("display","");
                uIN = dataLines[dataLines.length - 2];
                userName = user;
                // Remove invalid message from boxes
                if ($("#user-box").hasClass("is-invalid")) {
                    $("#user-box").removeClass("is-invalid");
                }
                if ($("#pass-box").hasClass("is-invalid")) {
                    $("#pass-box").removeClass("is-invalid");
                }
                storeCreds();
                exitSignIn();
                toggleSignInButtons();
            } else {
                console.log("Showing user taken");
                $("#user-taken").css("display","");
                // Display the invalid message
                if (!$("#user-box").hasClass("is-invalid")) {
                    $("#user-box").addClass("is-invalid");
                }
                // Remove invalid message from other box
                if ($("#pass-box").hasClass("is-invalid")) {
                    $("#pass-box").removeClass("is-invalid");
                }
                
            }

        }
    );
}

/**
 * Stores username and userid after successful login / registration
 * Reduces the need for signing in again unless logout occurs 
 */
function storeCreds() {
    localStorage.setItem('userName', userName);
    localStorage.setItem('uIN', uIN);
}

// Logs the user in.
function logIn() {
    console.log("Registering!");
    var ajaxurl = "/Database/login";
    let user = $("#user-box").val();
    let pass = $("#pass-box").val();
    console.log("User is: " + user + " and pass is: " + pass);
    $.post(ajaxurl,
        {
            test: "hi",
            username: user,
            password: pass,

        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            let dataLines = data.split("\n");
            let flag = dataLines[0];
            console.log(dataLines);
            $("#user-taken").css("display","none");
            if (flag == "Login Result (Success!):") {
                // We are all good -> exit sign in
                $("#invalid-user").css("display","none");
                $("#invalid-pass").css("display","none");
                $("#autograder").css("display","");
                // Remove invalid message from boxes
                if ($("#user-box").hasClass("is-invalid")) {
                    $("#user-box").removeClass("is-invalid");
                }
                if ($("#pass-box").hasClass("is-invalid")) {
                    $("#pass-box").removeClass("is-invalid");
                }
                // Assign the uIN
                uIN = dataLines[dataLines.length - 2];
                userName = user;
                storeCreds();
                exitSignIn();
                toggleSignInButtons();
            } else {
                if (data.includes("Invalid password")) {
                    console.log("Showing invalid password");
                    $("#invalid-user").css("display","none");
                    $("#invalid-pass").css("display","");
                    // Display the invalid message
                    if (!$("#pass-box").hasClass("is-invalid")) {
                        $("#pass-box").addClass("is-invalid");
                    }
                    // Remove invalid message from other box
                    if ($("#user-box").hasClass("is-invalid")) {
                        $("#user-box").removeClass("is-invalid");
                    }
                } else {
                    console.log("Showing invalid username");
                    $("#invalid-user").css("display","");
                    $("#invalid-pass").css("display","none");
                    // Display the invalid message
                    if (!$("#user-box").hasClass("is-invalid")) {
                        $("#user-box").addClass("is-invalid");
                    }
                    // Remove invalid message from other box
                    if ($("#pass-box").hasClass("is-invalid")) {
                        $("#pass-box").removeClass("is-invalid");
                    }
                }
            }
        }
    );
}

// Toggles the login and sign out buttons
function toggleSignInButtons() {
    if (signInEnabled) {
        console.log("Displaying logout");
        $("#signup-section").css("display","none");
        $("#logout-section").css("display","");

    } else {
        console.log("Displaying sign in");
        $("#signup-section").css("display","");
        $("#logout-section").css("display","none");
    }
    signInEnabled = !signInEnabled;
}


/**
 * VISUALIZATION
 * 
 * 
 * 
 * 
 * 
 * VISUALIZATION
 */


function disableVizButtons() {
    document.querySelector("#run-viz").disabled = true;
    document.querySelector("#run-viz-forward").disabled = true;
    document.querySelector("#run-viz-back").disabled = true;
    document.querySelector("#run-viz-play").disabled = true;
    for (let i = 0; i < tcCount; i++) {
        let tcv = document.querySelector("#tcv" + (i + 1))
        if (tcv != null) {
            tcv.disabled = true;
        }
    }
}

function enableVizButtons() {
    document.querySelector("#run-viz").disabled = false;
    document.querySelector("#run-viz-forward").disabled = false;
    document.querySelector("#run-viz-back").disabled = false;
    document.querySelector("#run-viz-play").disabled = false;
    for (let i = 0; i < tcCount; i++) {
        let tcv = document.querySelector("#tcv" + (i + 1));
        if (tcv != null) {
            tcv.disabled = false;
        }
    }
}

/**
 * Enables the debug buttons in the test case table.
 */
function enableTCVizButtons() {
    for (let i = 0; i < tcCount; i++) {
        let tcv = document.querySelector("#tcv" + (i + 1));
        if (tcv != null) {
            tcv.disabled = false;
        }
    }
}

/**
 * Disables the debug buttons in the test case table.
 */
function disableTCVizButtons() {
    for (let i = 0; i < tcCount; i++) {
        let tcv = document.querySelector("#tcv" + (i + 1));
        if (tcv != null) {
            tcv.disabled = true;
        }
    }
}

function showVizButtons() {
    $("#run-viz").css("display", "");
    $("#run-viz-forward").css("display", "");
    $("#run-viz-back").css("display", "");
    $("#run-viz-play").css("display", "");
}

function hideVizButtons() {
    $("#run-viz").css("display", "none");
    $("#run-viz-forward").css("display", "none");
    $("#run-viz-back").css("display", "none");
    $("#run-viz-play").css("display", "none");
}

function toggleVisualizerVis() {
    if (showingVisualizer) {
        $("#visualizer").css("display","none");
    } else {
        $("#visualizer").css("display","");
    }
    showingVisualizer = !showingVisualizer;
}

/**
 * Gets the input of a test case
 */
function getTCInput(tcNumStr) {
    let tcParts = tcResults[tcNumStr - 1].split("\nEXPECTED");
    let tcInput = tcParts[0].substring(7,);
    return tcInput;
}


/*
* Performs a visualization of the algorithm using P5.JS
*/
function visualize(tcNumStr) {
    runningViz = true;
    currTC = tcNumStr;
    hasInitViz = true;
    suspendDebug();
    disableDebugButtons();
    document.getElementById("submissionFile").disabled = true;
    var ajaxurl = "/Visualizer/sendVisualizeRequest";
    console.log("Sending visualizer post");
    let tcInput = getTCInput(currTC);
    // Strip all carriage returns
    tcInput = tcInput.replace(/[\r]/g, '');
    console.log(tcInput);
    // let tcNumStr = (currTCIdx + 1) + "";
    $.post(ajaxurl,
        {
            test: "hi",
            fileText: textFromFileLoaded,
            userID: uIN,
            tcNum: tcNumStr,
            tcInput: tcInput
        },
        function(data, status) {
            console.log("STATUS:" + status);
            console.log(data);
            if (showingDebugger) {
                toggleDebuggerVis();
            }
            if (!showingVisualizer) {
                toggleVisualizerVis();
            }
            p5Obj.loadData(data);
            p5Obj.parseData();
            enableVizButtons();
            showVizButtons();
            visualizeReset();
            enableTCDebugButtons();
            document.querySelector("#toggle-dv").innerHTML = "Switch to Debugger";
        }
    );
}

/**
 * Holds information for a P5.JS Variable
 */

class P5Var {
    constructor(name, data, x, y, text_size, text_align, text_color) {
        this.name = name;
        this.data = data;
        this.x = parseInt(x, 10);
        this.y = parseInt(y, 10);
        this.text_size = parseInt(text_size, 10);
        this.cmds = {};
        this.drawCMDS = [];
        this.drawCMDS.push(["textAlign", text_align]);
        this.drawCMDS.push(["fill", text_color]);
        this.drawCMDS.push(["textSize", this.text_size]);
        this.drawCMDS.push(["text", this.displayStr(), this.x, this.y]);
        this.cmds["drawCMDS"] = this.drawCMDS;
    }

    // Returns the string to print to the visualizer
    displayStr() {
        return this.name + ": " + this.data; 
    }

    // Update the value
    updateVal(newData) {
        this.data = newData;
        this.drawCMDS[3] = ["text", this.displayStr(), this.x, this.y];
    }

    getDrawCMDS() {
        return this.drawCMDS;
    }

    getCMDS() {
        return this.cmds;
    }
}

/**
 * Holds information for a P5.JS Stack
 */
class P5Stack {
    constructor(stackData, x, y, spacing, text_size) { 
        this.stackData = stackData;
        if (this.stackData == "") {
            this.stackParts = [];
        } else {
            this.stackParts = stackData.split(" ");
            }
        this.x = parseInt(x, 10);
        this.y = parseInt(y, 10);
        this.spacing = parseInt(spacing, 10);
        this.text_size = parseInt(text_size, 10);
        this.resetVars();
    }

    resetVars() {
        this.highlights = Array(this.stackParts.length).fill(false);
        this.stackXPositions = [];
        this.highlightPointer = 0;
        this.drawCMDS = [];
        this.bgCMDS = [];
        this.cmds = {};
        this.cmds["drawCMDS"] = this.drawCMDS;
        this.cmds["bgCMDS"] = this.bgCMDS;
    }

    nextHighlight() {
        this.highlights[this.highlightPointer] = true;
        this.highlightPointer++;
        return this.highlightPointer - 1;
    }

    /**
     * Highlights the start index and all elements past the start index
     */
    highlightPost(start) {
        for (let i = start; i < this.stackParts.length; i++) {
            this.highlights[i] = true;
        }
    }

    /**
     * Removes all highlighted elements
     */
    popAllHighlight() {
        let newStackParts = []
        for (let i = 0; i < this.stackParts.length; i++) {
            if (this.highlights[i] != true) {
                newStackParts.push(this.stackParts[i]);
            }
        }
        this.stackParts = newStackParts;
        this.resetVars();

    }

    peek() {
        return this.stackParts[this.stackParts.length];
    }

    reverse() {
        this.stackParts.reverse();
        return this.stackParts;
    }

    pop() {
        return this.stackParts.pop();
    }

    push(elem) {
        this.stackParts.push(elem);
        return this.stackParts;
    }

    getStack() {
        return this.stackParts;
    }

    getDrawCMDS() {
        return this.drawCMDS;
    }

    getBGCMDS() {
        return this.bgCMDS;
    }

    getCMDS() {
        return this.cmds;
    }
}



/**
 * Resets the visualizer
 */
function visualizeReset() {
    // Clear interval if it exists
    if (playIntervalID != undefined) {
        clearInterval(playIntervalID);
        playIntervalID = undefined;
    }
    p5Obj.resetViz();
    enableVizButtons();
    enableTCDebugButtons();
    document.querySelector("#run-viz-speed-chooser").disabled = false;
    document.querySelector("#run-viz-back").disabled = true;
    enableGeneralComponents();
    
}

/**
 * Performs the next step in the visualization process
 */
function visualizeNext() {
    if (p5Obj.reachedEnd()) {
        // Prevent the button from being used if we have no more steps
        document.querySelector("#run-viz-forward").disabled = true;
    } else {
        p5Obj.processNextStep();
    }
    document.querySelector("#run-viz-back").disabled = false;
}

/**
 * Goes back one step in the visualizer
 */
function visualizePrev() {
    if (!p5Obj.started()) {
        document.querySelector("#run-viz-back").disabled = true;
    } else {
        p5Obj.undoStep();
    }
    document.querySelector("#run-viz-forward").disabled = false;
}

/**
 * Plays the visualizer at the specified speed.
 */
function visualizePlay() {
    if (vizPlayMode == false) {
        // Setup the buttons
        console.log("Playing visualizer");
        document.querySelector("#run-viz-forward").disabled = true;
        document.querySelector("#run-viz-back").disabled = true;
        disableTCDebugButtons();
        disableTCVizButtons();
        vizPlaySpeed = parseFloat($("#run-viz-speed-chooser option:selected").val());
        document.querySelector("#run-viz-speed-chooser").disabled = true;
        document.querySelector("#run-viz-play").innerHTML = "Stop";
        disableGeneralComponents();

        // Now actually run the visualizer
        playIntervalID = setInterval(visualizePlayStep, Math.floor(1000 * 1/vizPlaySpeed));
    } else {
        console.log("Stopping visualizer");
        clearInterval(playIntervalID);
        enableTCDebugButtons();
        enableTCVizButtons();
        document.querySelector("#run-viz-speed-chooser").disabled = false;
        document.querySelector("#run-viz-play").innerHTML = "Play";
        if (p5Obj.started()) {
            document.querySelector("#run-viz-back").disabled = false;
        }
        if (!p5Obj.reachedEnd()) {
            document.querySelector("#run-viz-forward").disabled = false;
        }
        enableGeneralComponents();

        playIntervalID = undefined;
    }
    vizPlayMode = !vizPlayMode;

}

/**
 * Runs the next step of the visualizer automatically, and checks to make sure it can go to the next step
 */
function visualizePlayStep() {
    if (!p5Obj.reachedEnd()) {
        p5Obj.processNextStep();
    } else {
        visualizePlay();
    }
}

// Toggles between the debugger and the visualizer
function toggleDV() {
    let toggleDVButton =  document.querySelector("#toggle-dv")
    let btn_text = toggleDVButton.innerHTML;
    if (btn_text == "Switch to Debugger") {
        toggleDVButton.innerHTML = "Switch to Visualizer";
        showDebugButtons();
        enableDebugButtons();
        $("#debugger").css("display","");
        $("#visualizer").css("display","none");
        showingDebugger = true;
        showingVisualizer = false;
    } else {
        toggleDVButton.innerHTML = "Switch to Debugger";
        if (!hasInitViz) {
            visualize(currTC);
        }
        showVizButtons();
        enableVizButtons();
        $("#debugger").css("display","none");
        $("#visualizer").css("display","");
        showingDebugger = false;
        showingVisualizer = true;
    }
}

let s = p => {
    let x = 100;
    let y = 100;
    let xPad = 0;
    let yPad = 50;
    let pData = "";
    let parsedData = "";
    let step = 0;
    let maxStep = 0;
    let varDict = {};
    let currVar = "";
    let vizStates = [];
    let bg_color = [0, 0, 0];
    let txt_color = [255, 255, 255];
    let stroke_color = [255, 255, 255];
    let sub_color = [-255, -255, -255];
    let blend_mode = p.BLEND;
    let cmds = [];
    let currPDescription;
    let alert_color = [255, 0, 0];
    let alert_mode = false;
  
    p.setup = function() {
        console.log("Setting up canvas!");
        let pCanvas = p.createCanvas(2000, 2000);

        pCanvas.parent('viz-canvas-area');
        p.resetViz();
      // p.rect(x, y, 50, 50);
      // p.test()
    };

    /**
     * Resets the visualizer
     */
    p.resetViz = function() {
        p.background(bg_color);
        p.fill(txt_color);
        p.textSize(18);
        step = 0;
        maxStep = 0;
        vizStates = [];
        cmds = [];
        varDict = {};
        vizStates.push(p.get());
    }

    /**
     * Resets variables 
     */
    p.resetVars = function() {
        varDict = {};
        cmds = [];
    }

    p.test = function() {
        p.background(p.random(255));
    }

    p.printVarData = function() {
        console.log(varDict);
    }
    
    p.started = function() {
        return step > 0;
    };

    p.reachedEnd = function() {
        return parsedData.vCMDList.length == step;
    };

    p.draw = function() {
        p.noLoop();
        if (!alert_mode) {
            p.background(bg_color);
        } else {
            p.background(alert_color);
        }
        console.log("The commands are:");
        console.log(cmds)
        p.fill(txt_color);
        p.text(currPDescription, 10, 25, 568, 100);
        for (let idx = 0; idx < cmds.length; idx++) {
            let drawObj = cmds[idx];
            // console.log(drawObj);
            let localCMDS = drawObj.getCMDS();
            if (localCMDS.hasOwnProperty("bgCMDS")) {
                // Do the backgrounds
                let bgCMDS = localCMDS["bgCMDS"];
                for (let i = 0; i < bgCMDS.length; i++) {
                    let currCMD = bgCMDS[i];
                    p[currCMD[0]](...currCMD.slice(1));
                }
            }
            if (localCMDS.hasOwnProperty("drawCMDS")) {
                // Do the drawing
                let drawCMDS = localCMDS["drawCMDS"];
                // console.log(drawCMDS);
                for (let i = 0; i < drawCMDS.length; i++) {
                    let currCMD = drawCMDS[i];
                    // console.log(currCMD);
                    p[currCMD[0]](...currCMD.slice(1));
                }
            }
        }
    };

    p.eraseMode = function() {
        p.fill(bg_color);
        p.blendMode(p.BLEND);
    }

    p.loadData = function(data) {
        pData = data;
    };

    p.parseData = function() {
        parsedData = JSON.parse(pData);
    };

    // Draws a stack
    p.drawStack = function(newStack) {
        // Now need to display the stack
        let stackParts = newStack.getStack();
        let prevWidth = 0;
        let xPos = newStack.x;
        // p.textAlign(p.LEFT);
        // p.fill(txt_color);
        // p.textSize(newStack.text_size);
        let drawCMDS = newStack.getDrawCMDS();
        drawCMDS.push(["textAlign", p.LEFT]);
        drawCMDS.push(["fill", txt_color]);
        drawCMDS.push(["textSize", newStack.text_size]);
        for (let i = 0; i < stackParts.length; i++) {
            let stackPart = stackParts[i];
            // console.log("Writing: " + stackPart);


            // p.text(stackPart, xPos, newStack.y);
            drawCMDS.push(["text", stackPart, xPos, newStack.y]);
            newStack.stackXPositions.push(xPos);
            prevWidth = p.textWidth(stackPart);
            xPos += prevWidth + newStack.spacing;
            // p.rect(200, 200, 50, 50);
            // p.background(255);
        }
    }

    /**
     * Erases the stack visually 
     */
    p.eraseStack = function(stack) {

        let stackParts = stack.getStack();
        let prevWidth = 0;
        let xPos = stack.x;
        p.fill(bg_color);
        p.textAlign(p.LEFT);
        p.textSize(newStack.text_size);
        // Erase the stack
        for (let i = 0; i < stackParts.length; i++) {
            let stackPart = stackParts[i];
            // console.log("Writing: " + stackPart);

            p.text(stackPart, xPos, stack.y);
            prevWidth = p.textWidth(stackPart);
            xPos += prevWidth + stack.spacing;
            // p.rect(200, 200, 50, 50);
            // p.background(255);
        }
        p.fill(txt_color);
    }

    /**
     * Undoes a step in the visualizer
     */
    p.undoStep = function() {
        step--;
        p.background(bg_color);
        p.image(vizStates[step], 0, 0);
    };

    p.processNextStep = function() {
        let currPCommand = parsedData.vCMDList[step];
        currPDescription = parsedData.vDescriptorList[step];
        console.log("The current command is: " + currPCommand);
        console.log("The current description is: " + currPDescription);
        let pCMDParts = currPCommand.split("::");
        let pCMDType = pCMDParts[0];
        let currStack;
        let currStackItem;
        let currStackParts;
        let drawCMDS;
        let bgCMDS;
        let xPos;
        let hIdx;
        let hXPos;
        

        alert_mode = false;
        if (step == maxStep) {
            // Show the descriptive text
            p.fill(bg_color);
            p.rect(0, 0, 658, 30);
            p.fill(txt_color);
            p.noStroke();

            p.text(currPDescription, 10, 25);
            switch (pCMDType) {
                case "INIT_VAR":
                    // Set the variable
                    let newVar = new P5Var(pCMDParts[1], pCMDParts[2], pCMDParts[3], pCMDParts[4], pCMDParts[5], p.LEFT, txt_color);
                    varDict[pCMDParts[1]] = newVar;
                    
                    // Draw the variable
                    p.fill(txt_color);
                    // p.stroke(stroke_color);
                    p.textSize(newVar.text_size);
                    // p.text(newVar.displayStr(), newVar.x, newVar.y);
                    cmds.push(newVar);
                    break;
                case "UPDATE_VAR":
                    let currVar = varDict[pCMDParts[1]];
                    
                    // Erase the old variable
                    /* p.fill(bg_color);
                    // p.stroke(bg_color);
                    p.blendMode(p.DARKEST);
                    p.text(currVar.displayStr(), currVar.x, currVar.y);
                    p.fill(txt_color);
                    p.blendMode(blend_mode);
                    */
                    // p.stroke(stroke_color);
                    currVar.updateVal(pCMDParts[2]);
                    // p.text(currVar.displayStr(), currVar.x, currVar.y);
                    break;
                case "GEN_STACK":
                    // Generate a stack and store it in the var dictionary
                    let newStack = new P5Stack(pCMDParts[2], pCMDParts[3], pCMDParts[4], pCMDParts[5], pCMDParts[6]);
                    varDict[pCMDParts[1]] = newStack;
                    newStack.x += xPad;
                    newStack.y += yPad;


                    console.log(newStack);
                    p.drawStack(newStack);
                    cmds.push(newStack);
                    break;
                case "STACK_NEXT_HIGHLIGHT":
                    currStack = varDict[pCMDParts[1]];
                    hIdx = currStack.nextHighlight();
                    hXPos = currStack.stackXPositions[hIdx];
                    currStackItem = currStack.stackParts[hIdx];
                    
                    // p.blendMode(p.BLEND);
                    // p.fill([21, 71, 52]);
                    // p.stroke([21, 71, 52]);
                    bgCMDS = currStack.getBGCMDS();
                    bgCMDS.push(["fill", [21, 71, 52]]);
                    bgCMDS.push(["rect", hXPos - 3, currStack.y - 18, p.textWidth(currStackItem) + 5, 24]);
                    // p.rect(hXPos - 3, currStack.y - 18, p.textWidth(currStackItem) + 5, 24);
                    // p.blendMode(blend_mode);
                    // p.fill(txt_color);
                    // p.stroke(stroke_color);
                    // p.text(currStackItem, hXPos, currStack.y);
                    break;
                case "STACK_PUSH":
                    // Push the item onto the stack and draw the new element
                    currStack = varDict[pCMDParts[1]];
                    // p.textSize(currStack.text_size);
                    
                    // Draw the element
                    // p.fill(txt_color);
                    // p.stroke(stroke_color);
                    currStackParts = currStack.getStack();
                    if (currStackParts.length != 0) {
                        xPos = currStack.stackXPositions[currStack.stackXPositions.length - 1] + p.textWidth(currStackParts[currStackParts.length - 1]) + currStack.spacing;
                    } else {
                        xPos = currStack.x
                    }
                    drawCMDS = currStack.getDrawCMDS();
                    drawCMDS.push(["text", pCMDParts[2], xPos, currStack.y]);
                    // p.text(pCMDParts[2], xPos, currStack.y);

                    // Update the stack
                    currStackParts.push(pCMDParts[2]);
                    currStack.stackXPositions.push(xPos);
                    break;
                case "STACK_NEXT_RPOP":
                    // Pops the item from the right side of the stack (where items are pushed onto)
                    currStack = varDict[pCMDParts[1]];
                    // p.textSize(currStack.text_size);

                    // Draw the element
                    // p.fill(sub_color);
                    // p.stroke(bg_color);
                    currStackParts = currStack.getStack();
                    xPos = currStack.stackXPositions[currStack.stackXPositions.length - 1];
                    // p.text(currStackParts[currStackParts.length - 1], xPos, currStack.y);
                    drawCMDS = currStack.getDrawCMDS();
                    drawCMDS.pop();

                    // Update the stack and remove the element
                    currStackParts.pop();
                    currStack.stackXPositions.pop();
                    break;
                case "ENDGROUP":
                    // Reset all variables. 
                    if (currPDescription == "") {
                        currPDescription = "Resetting environment for next dataset"
                    }
                    p.resetVars();
                    break;
                case "STACK_HIGHLIGHT_ERROR_1":
                    currStack = varDict[pCMDParts[1]];
                    hIdx = currStack.nextHighlight();
                    hXPos = currStack.stackXPositions[hIdx];
                    currStackItem = currStack.stackParts[hIdx];
                    // Make a red highlight box
                    bgCMDS = currStack.getBGCMDS();
                    bgCMDS.push(["fill", [255, 0, 0]]);
                    bgCMDS.push(["rect", hXPos - 3, currStack.y - 18, p.textWidth(currStackItem) + 5, 24]);
                    break;
                case "RESULT_ERROR":
                    alert_mode = true;
                    break;
                case "STACK_HIGHLIGHT_ERROR+":
                    // Apply stack highlight error 1 to all elements beginning at the specified index
                    let specIdx = parseInt(pCMDParts[2], 10);
                    currStack = varDict[pCMDParts[1]];
                    currStackParts = currStack.getStack();
                    bgCMDS = currStack.getBGCMDS();
                    bgCMDS.push(["fill", [255, 0, 0]]);
                    for (let i = specIdx; i < currStackParts.length; i++) {
                        // Make a highlight error box.
                        hXPos = currStack.stackXPositions[i];
                        currStackItem = currStackParts[i];
                        bgCMDS.push(["rect", hXPos - 3, currStack.y - 18, p.textWidth(currStackItem) + 5, 24]);
                    }
                    break;
            }
            p.redraw();
            vizStates.push(p.get());
            maxStep++;
        } else {
            // Restore the step
            p.background(bg_color);
            p.image(vizStates[step], 0, 0);
        }
        step++;
        
    };

  };
  
  var p5Obj = new p5(s); // invoke p5.js



/**
 * STARTUP
 * 
 * 
 * 
 * 
 * 
 * STARTUP
 */

/**
 * Run functions on load
 */
window.onload = function(e) {

    // Attach upload functionality to button
    

    let user = localStorage.getItem("userName");
    let pin = localStorage.getItem("uIN");
    if (user != null && pin != null) {
        $("#autograder").css("display","");
        exitSignIn();
        toggleSignInButtons();
        userName = user;
        uIN = pin;
        console.log("Loaded credentials from local storage");
    }
}

