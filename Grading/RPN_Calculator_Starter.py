def rpn_calculate(inputString):
    '''Does RPN Calculation on a string'''
    '''
        // Initialize the stack
        // Loop through the string; string is composed of several items separated by spaces 
            // If the current item is an operation (+, -, *, /, ^, or %) then 
                // Ensure at least two numbers are in the stack
                    // Return an error message if the above condition is not true
                // Pop two numbers from the stack
                // Perform the operation on the two numbers
                    // Return an error message if invalid operation (ex: divide by 0) occurs
                // Push the result of that operation to the top of the stack
            // If the current item is a number, then push it onto the stack 
        // Check if there is only 1 item left in the stack
            // If so, return that item
            // Otherwise, return a message indicating that there is more than 1
            // item in the stack
    
    '''
    return "The answer is -1"

# DO NOT MODIFY THE BELOW
import sys
import math
if len(sys.argv) < 2:
    print("RPN Calculator")
    print("Enter nothing to quit")
    usrStr = input("Please enter requested calculation: ")
    # rpnc = RPN_Calculator()
    while usrStr != "" :
        result = rpn_calculate(usrStr.strip())
        print(result)
        usrStr = input("Please enter requested calculation: ")

    print("farvel!")
else:
    usrStr = sys.argv[1]
    if usrStr == "":
        exit()
    # /print("usrStr:", usrStr)
    usrStrList = usrStr.split("\n")
    resultStr = ""
    # rpnc = RPN_Calculator()
    for strItem in usrStrList:
        result = rpn_calculate(strItem.strip())
        resultStr += result + "\n"
    # Results must be printed all at once
    print(resultStr[:-1])
    sys.stdout.flush()
