// const { json } = require("express");testout

var textFromFileLoaded;
var fileTableDat;
var fileName;
var tcCount;
var tcDone = 0;
var tcResults;
var tcStatuses;
var tcPassed;
var uIN = "0";
var userName;
var currTCIdx; 
var noDebug = false;
var runningDebug = false;
var runningTC = false;


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
        tcTable += "<tr><td class = 'td-tc-num'>"+(i + 1)+"</td>";
        if (tcStatuses[i] == "PASS") {
            tcTable += "<td class = 'td-tc-pf' style = 'color:green'><b>"+tcStatuses[i]+"</b></td>"
        } else {
            tcTable += "<td class = 'td-tc-pf' style = 'color:red'><b>"+tcStatuses[i]+"</b></td>"
        }
        tcTable += "<td class = 'td-tc-view'><div class ='form-group'>";
        tcTable += "<input type='submit' class='btn btn-primary btn-block' id='tc"+(i + 1)+"' value='View' onclick='makeTestCaseOutput("+(i)+")'>"
        tcTable += "<input type='submit' class='btn btn-primary btn-block' id='tcd"+(i + 1)+"' value='Debug' onclick='debug("+(i + 1)+")'></div></td></tr>"
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
        tryEnableFileInput();
        // Get the number of test cases passed
        tcPassed = 0;
        for (let i = 0; i < tcCount; i++) {
            if (tcStatuses[i] == "PASS") {
                tcPassed += 1;
            }
        }
        console.log("Test cases passed: " + tcPassed + "/" + tcCount);
        let ajaxurl = "/Database/updateTestResults";
        $.post(ajaxurl,
            {
                test: "hi",
                fileCode: textFromFileLoaded,
                userID: uIN,
                username: userName,
                testCasesPassed: tcPassed,
            },
            function(data, status) {
                console.log("STATUS:" + status);
                console.log(data);
            });
    }

}



function runTestCases(numTC) {
    // We need to generate the number of test cases
    tcResults = []
    tcStatuses = []
    noDebug = false;
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
    document.querySelector("#run-debug").disabled = true;
    document.querySelector("#run-debug-NL").disabled = true;
    document.querySelector("#run-debug-NS").disabled = true;
    for (let i = 0; i < tcCount; i++) {
        document.querySelector("#tcd" + (i + 1)).disabled = true;
    }
}

function enableDebugButtons() {
    document.querySelector("#run-debug").disabled = false;
    document.querySelector("#run-debug-NL").disabled = false;
    document.querySelector("#run-debug-NS").disabled = false;
    for (let i = 0; i < tcCount; i++) {
        document.querySelector("#tcd" + (i + 1)).disabled = false;
    }
}

function debug(tcNumStr) {
    runningDebug = true;
    suspendDebug();
    disableDebugButtons();
    document.getElementById("submissionFile").disabled = true;
    var ajaxurl = "/Debugger/debug";
    console.log("Sending debug post");

    // let tcNumStr = (currTCIdx + 1) + "";
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
            debugGLN([data],tcNumStr);
        }
    );
}

/**
 * Gets next line in debugger
 */
function debugNL() {
    runningDebug = true;
    // disable debug buttons
    disableDebugButtons();
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
    // disable debug buttons
    disableDebugButtons();
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
 * Finds the line number from pdb list . 
 */

function findLNFromData(data) {
    let lNum = 0;
    let lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let cLine = lines[i];
        let cLineTrim = cLine.trim();
        cLineParts = cLineTrim.slice(cLineTrim.indexOf(" ")).trim();
        console.log(cLineParts);
        if (cLineParts.length >= 2 && cLineParts.slice(0, 2) == "->") {
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
        excludedKeys = ["__builtins__", "var182764"]
        if (!(excludedKeys.includes(key))) {
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
    $("#run-debug").css("display","");
    $("#run-debug-NL").css("display","");
    $("#run-debug-NS").css("display","");
    if (ended) {
        document.querySelector("#run-debug").disabled = false;
        document.querySelector("#run-debug-NL").disabled = true;
        document.querySelector("#run-debug-NS").disabled = true;
        for (let i = 0; i < tcCount; i++) {
            document.querySelector("#tcd" + (i + 1)).disabled = false;
        }
    } else {
        enableDebugButtons();
    }
    runningDebug = false;
    tryEnableFileInput();
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
    document.querySelector("#run-tests").disabled = true;
    document.getElementById("submissionFile").disabled = true;
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
            numTC = parseInt(data);
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
        $("#run-debug").css("display","none");
        $("#run-debug-NL").css("display","none");
        $("#run-debug-NS").css("display","none");
        // Display the data in the file

        var fileReader = new FileReader();
        fileName = fileToLoad.name;
        fileReader.onload = function(fileLoadedEvent){
            textFromFileLoaded = fileLoadedEvent.target.result;
            // console.log(textFromFileLoaded);
            fileTableDat = "<div class='form-group shadow-textarea' style='margin-left:50px'>";
            fileTableDat += "<label for='exampleFormControlTextarea6' style='text-decoration:underline; font-weight:bold;'>Your file:</label>"
            fileTableDat += "<div contenteditable='false' class='form-control z-depth-1' id='submission-contents' readonly>";
            fileLines = textFromFileLoaded.split("\n");
            for (let i = 0; i < fileLines.length; i++) {
                // console.log(fileLines[i]);
                let newContent = htmlSpacesBeginning(fileLines[i])
                // console.log("New content: " + newContent);
                // console.log("New file line: " + "<p class = 'file-line'><span class = 'file-line-index'>" + (i + 1) + "</span>&nbsp" + newContent + "</p>");
                fileTableDat += "<p class = 'file-line' id = 'file-line" + (i + 1) + "'><span class = 'file-line-index'>" + (i + 1) + "</span>&nbsp" + newContent + "</p>";
            }
            fileTableDat += "</textarea></div><br>";
            // fileTableDat += '<div class="md-form" style="margin-left:0px"><i class="fas fa-pencil-alt prefix"></i><label for="form10">Send a message:</label><textarea id="gmsg-send" class="md-textarea form-control" rows="3" cols="75" onkeypress="if(event.keyCode == 13) {sendGlobalMsg();}"></textarea></div></div>';
            // document.getElementById("file-table").value = textFromFileLoaded;
            // console.log(fileTableDat);

            $("#file-table").html(fileTableDat);
            $("#run-tests").css("display","");
            console.log("Applied html");
        };

        fileReader.readAsText(fileToLoad, "UTF-8");
    }

}

// Attempts to enable file input - needs to not be running test cases and needs to not be running debugger
function tryEnableFileInput() {
    if (!runningDebug && !runningTC) {
        document.getElementById("submissionFile").disabled = false;
    }
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
    $("#autograder").css("display","none");
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