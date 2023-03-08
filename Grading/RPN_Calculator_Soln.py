def rpn_calculate(inputString):
    '''Does RPN Calculation on a string'''
    # Initialize the stack
    rpn_stack = []
    # Loop through the string; string is composed of several items separated by spaces 
    items = inputString.split(" ")
    for item in items:
        # If the current item is an operation (+, -, *, /, ^, or %) then 
        if item == "+" or item == "-" or item == "*" or item == "/" or item == "^" or item == "%":
            # Ensure at least two numbers are in the stack
            if (len(rpn_stack) < 2):
                # Return an error message if the above condition is not true
                return "Calculation failed. Not enough numbers in stack when operation requested."
            # Pop two numbers from the stack
            num2 = rpn_stack.pop()
            num1 = rpn_stack.pop()
            # Perform the operation on the two numbers
            # Return an error message if invalid operation (ex: divide by 0) occurs
            if item == "+":
                opResult = num1 + num2
            elif item == "-":
                opResult = num1 - num2
            elif item == "*":
                opResult = num1 * num2
            elif item == "/":
                # Handle divide by 0 error
                if num2 == 0:
                    return "Calculation failed. Can't divide by 0."
                opResult = num1 // num2
            elif item == "^":
                # Prevent exponentiating 0 to a negative power (because this is essentially division by 0)
                if num1 == 0 and num2 < 0:
                    return "Calculation failed. Can't raise 0 to a negative power."
                # Prevent numbers too large in magnitude from being exponentiated -> takes too long.
                if abs(num1) >= 100 or abs(num2) >= 100:
                    return "Calculation failed. num1 and/or num2 are too big to perform the power operation."
                opResult = math.floor(pow(num1, num2))
            else:
                # Handle divide by 0 error
                if num2 == 0:
                    return "Calculation failed. Can't divide by 0."
                # Note: JS has remainder operator, not modulo operator. Below implements modulo operator
                opResult = num1 % num2
            # Push the result of that operation to the top of the stack
            rpn_stack.append(opResult)
        else:
            # If the current item is a number, then push it onto the stack 
            rpn_stack.append(int(item))
    # Check if there is only 1 item left in the stack
    if (len(rpn_stack) != 1):
        # Otherwise, return a message indicating that there is more than 1
        # item in the stack
        return "Calculation failed. There are extra numbers in the stack."
    # If so, return that item
    return "The answer is " + str(rpn_stack[0])


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
