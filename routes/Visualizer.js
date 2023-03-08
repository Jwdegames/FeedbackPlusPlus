const express = require('express');
const {NodeVM} = require("vm2");
// express.use(json);
const router = express.Router();
const fs = require('fs')
var maxTestCase = 5;


function generateVCMDs(tcInput, fileToRun) {
    let generalTXTSize = 18;
    console.log("The tcInput is " + tcInput);
    let tcILines = tcInput.split("\n");
    console.log("The tcILines are now " + tcILines);
    // Initialize lists for the visualization commands and their descriptions
    let vCMDList = []
    let vDescriptorList = []
    let rpn_stack = [];
    for (let tcIdx = 0; tcIdx < tcILines.length; tcIdx++) {
        let tcILine = tcILines[tcIdx];
        // Initialize variables
        // Gen Stack
            // 1st arg: Variable name
            // 2nd arg: Starting input (each item separated by spaces)
            // 3rd arg: Start x
            // 4th arg: Start y
            // 5th arg: Element spacing
            // 6th arg: Text Size
        vCMDList.push("GEN_STACK::CALC::" + tcILine + "::50::100::20::" + generalTXTSize);
        vDescriptorList.push("The calculator receives the input " + tcILine);

        vCMDList.push("GEN_STACK::RPN::::50::150::20::" + generalTXTSize);
        vDescriptorList.push("The calculator initializes the rpn stack");


        // Init Var
            // 1st arg: Variable name
            // 2nd arg: Starting input 
            // 3rd arg: Start x
            // 4th arg: Start y
            // 6th arg: Text Size
        vCMDList.push("INIT_VAR::op::0::30::250::" + generalTXTSize);
        vDescriptorList.push("The calculator initializes the variable op to 0");

        vCMDList.push("INIT_VAR::num1::0::30::270::" + generalTXTSize);
        vDescriptorList.push("The calculator initializes the variable num1 to 0");

        vCMDList.push("INIT_VAR::num2::0::30::290::" + generalTXTSize);
        vDescriptorList.push("The calculator initializes the variable num2 to 0");

        vCMDList.push("INIT_VAR::op_result::0::30::310::" + generalTXTSize);
        vDescriptorList.push("The calculator initializes the variable op_result to 0");

        console.log("The next tcILine is " + tcILine);
        tcIList = tcILine.split(" ")

        rpn_stack = []
        // Go through each item in the input, and generate the neccessary visualization commands
        let failed = false;
        let stackExists = false;
        for (let tcItemIdx = 0; tcItemIdx < tcIList.length; tcItemIdx++) {
            tcItem = tcIList[tcItemIdx];
            // console.log("The next tcItem is " + tcItem + " with a length of " + tcItem.length);
            if (tcItem == "+" || tcItem == "-" || tcItem == "*" || tcItem == "/" || tcItem == "^" || tcItem == "%") {
                console.log("Operation will be performed if possible");
                if (rpn_stack.length < 2) {
                    vCMDList.push("STACK_HIGHLIGHT_ERROR_1::CALC");
                    vDescriptorList.push("ERROR: Not enough items in the stack to perform next operation! There are currently " + rpn_stack.length + "/2 required stack items");
                    vCMDList.push("RESULT_ERROR");
                    vDescriptorList.push("ERROR: Not enough items in the stack to perform next operation! There are currently " + rpn_stack.length + "/2 required stack items");
                    vCMDList.push("ENDGROUP");
                    vDescriptorList.push("");
                    failed = true;
                    break;
                }

                // Highlight the operator
                vCMDList.push("STACK_NEXT_HIGHLIGHT::CALC");
                vDescriptorList.push("The calculator reads in the operator " + tcItem);
                vCMDList.push("STACK_PUSH::RPN::" + tcItem);
                vDescriptorList.push("The calculator pushes the operator " + tcItem + " onto the stack");

                let num2 = rpn_stack.pop()
                let num1 = rpn_stack.pop()
                vCMDList.push("STACK_NEXT_RPOP::RPN");
                vDescriptorList.push("The calculator pops " + tcItem + " from the stack.");
                vCMDList.push("UPDATE_VAR::op::" + tcItem);
                vDescriptorList.push("The calculator updates the operator variable to " + tcItem);
                vCMDList.push("STACK_NEXT_RPOP::RPN");
                vDescriptorList.push("The calculator pops from the stack the number " + num2);
                vCMDList.push("UPDATE_VAR::num2::" + num2);
                vDescriptorList.push("The calculator updates the num2 variable to " + num2);
                vCMDList.push("STACK_NEXT_RPOP::RPN");
                vDescriptorList.push("The calculator pops from the stack the number " + num1);
                vCMDList.push("UPDATE_VAR::num1::" + num1);
                vDescriptorList.push("The calculator updates the num1 variable to " + num1);

                // Store the values!
                // Insert commands here
                let breakLoop = false;
                let opResult = 0;
                // Perform the operation
                switch(tcItem) {
                    case "+":
                        opResult = num1 + num2
                        break;
                    case "-":
                        opResult = num1 - num2
                        break;
                    case "*":
                        opResult = num1 * num2
                        break;
                    case "/":
                        if (num2 == 0) {
                            vCMDList.push("STACK_HIGHLIGHT_ERROR_0::CALC");
                            vDescriptorList.push("ERROR: Can't divide by 0");
                            vCMDList.push("RESULT_ERROR");
                            vDescriptorList.push("ERROR: Can't divide by 0");
                            vCMDList.push("ENDGROUP");
                            vDescriptorList.push("");
                            breakLoop = true;
                            failed = true;
                            break;
                        }

                        opResult = Math.floor(num1 / num2)
                        break;
                    case "^":
                        if (num1 == 0 && num2 < 0) {
                            vCMDList.push("STACK_HIGHLIGHT_ERROR_0::CALC");
                            vDescriptorList.push("ERROR: Can't raise 0 to a negative power");
                            vCMDList.push("RESULT_ERROR");
                            vDescriptorList.push("ERROR: Can't raise 0 to a negative power");
                            vCMDList.push("ENDGROUP");
                            vDescriptorList.push("");
                            breakLoop = true;
                            failed = true;
                            break;
                        }
                        if (Math.abs(num1) > 100 || Math.abs(num2) > 100) {
                            vCMDList.push("STACK_HIGHLIGHT_ERROR_0::CALC");
                            vDescriptorList.push("ERROR: num1 or num2 is too large to perform the power operation");
                            vCMDList.push("RESULT_ERROR");
                            vDescriptorList.push("ERROR: num1 or num2 is too large to perform the power operation");
                            vCMDList.push("ENDGROUP");
                            vDescriptorList.push("");
                            breakLoop = true;
                            failed = true;
                            break;
                        }
                        opResult = Math.floor(Math.pow(num1, num2));
                        break;
                    case "%":
                        if (num2 == 0) {
                            vCMDList.push("STACK_HIGHLIGHT_ERROR_0::CALC");
                            vDescriptorList.push("ERROR: Can't divide by 0");
                            vCMDList.push("RESULT_ERROR");
                            vDescriptorList.push("ERROR: Can't divide by 0");
                            vCMDList.push("ENDGROUP");
                            vDescriptorList.push("");
                            breakLoop = true;
                            failed = true;
                            break;
                        }
                        opResult = ((num1 % num2) + num2) % num2;
                        break;
                    }
                if (breakLoop) {
                    break;
                }
                vCMDList.push("UPDATE_VAR::op_result::" + opResult);
                let vTXT = "The calculator performs the operation " + num1 + " " + tcItem + " " + num2 + ", and stores it in op_result, which is now " + opResult;
                vDescriptorList.push(vTXT);
                vCMDList.push("STACK_PUSH::RPN::" + opResult);
                vDescriptorList.push("The calculator pushes " + opResult + "  onto the stack.");
                rpn_stack.push(opResult)
            } else {
                let nextNum = parseInt(tcItem, 10);
                if (isNaN(nextNum)) {
                    vCMDList.push("STACK_HIGHLIGHT_ERROR_1::CALC");
                    vDescriptorList.push("ERROR: The calculator can only operate on valid base 10 numbers! " + tcItem + " is not a valid base 10 number!");
                    vCMDList.push("RESULT_ERROR");
                    vDescriptorList.push("ERROR: The calculator can only operate on valid base 10 numbers! "  + tcItem + " is not a valid base 10 number!");
                    vCMDList.push("ENDGROUP");
                    vDescriptorList.push("");
                    failed = true;
                    break;
                } else {
                    // Add number to the stack
                    vCMDList.push("STACK_NEXT_HIGHLIGHT::CALC");
                    vDescriptorList.push("The calculator reads in the number " + nextNum);
                    vCMDList.push("STACK_PUSH::RPN::" + nextNum);
                    vDescriptorList.push("The calculator pushes " + nextNum + " onto the stack.");
                    rpn_stack.push(nextNum);
                }
            }

        }
        console.log("Failed: " + failed);
        // Do this if we didn't encounter a failure before
        if (!failed) {
            // Ensure stack is empty
            if (rpn_stack.length == 1) {
                vCMDList.push("STACK_NEXT_HIGHLIGHT::RPN");
                vDescriptorList.push("The calculator outputs the number " + rpn_stack[0]);
            } else {
                vCMDList.push("STACK_HIGHLIGHT_ERROR+::RPN::1");
                vDescriptorList.push("ERROR: There should be only 1 number in the stack at the end!");
                vCMDList.push("RESULT_ERROR");
                vDescriptorList.push("ERROR: There should be only 1 number in the stack at the end!");
            }

            // Tell the visualizer to reset
            vCMDList.push("ENDGROUP");
            vDescriptorList.push("");
        }
    }
    let vObject = {
        'vCMDList' : vCMDList,
        'vDescriptorList': vDescriptorList
    };
    return vObject;
}

router.post('/sendVisualizeRequest', function(req, res)  {
    let tcInput = req.body.tcInput;

    console.log("tc input is " + tcInput);
    // Go through the test case input, and generate the p5.js visualize commands
    // JSON Stringify the array and send it back to the client.
    let vObject = generateVCMDs(tcInput, "");
    let jsonV = JSON.stringify(vObject);
    res.send(jsonV);
});

module.exports = router;