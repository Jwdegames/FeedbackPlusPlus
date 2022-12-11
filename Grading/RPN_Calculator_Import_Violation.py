import os
class RPN_Calculator:
    def __init__(self):
        self.reset()


    def reset(self):
        '''Resets the fail flags and stack'''

    def pop(self):
        '''Returns False if size of stack less than 2. Otherwise returns a tuple containing the top two numbers on
        the stack, where the leftmost number is the top number on the stack'''
        return False

    def failCondition(self):
        '''Outputs a fail message if a fail flag was set. Otherwise outputs None.'''
        return None

    def calculate(self, inputString):
        '''Does RPN Calculation on a string'''
        '''
            // Reset the stack
            // Loop through the string; string is composed of several items separated by spaces 
                // If the current item is an operation (+, -, *, /, ^, or %) then 
                    // Pop two numbers from the stack
                    // If pop() returns False, then set failPop to true and return -1
                    // Otherwise, perform the operation on the two numbers
                    // Push the result of that operation to the top of the stack
                // If the current item is a number, then push it onto the stack 
            // Check if there is only 1 item left in the stack
            // If so, return that item
            // Otherwise, set failSyntax to true, and return -1
        
        '''
        return -1

# DO NOT MODIFY THE CODE BELOW
import sys
if len(sys.argv) < 2:
    print("RPN Calculator")
    print("Enter nothing to quit")
    usrStr = input("Please enter requested calculation: ")
    rpnc = RPN_Calculator()
    while usrStr != "" :
        result = rpnc.calculate(usrStr.strip())
        failStr = rpnc.failCondition()
        if failStr != None:
            print("FAILED:", failStr)
        else:
            print("The answer is", result)
        usrStr = input("Please enter requested calculation: ")

    print("farvel!")
else:
    usrStr = sys.argv[1]
    usrStrList = usrStr.split("\n")
    resultStr = ""
    rpnc = RPN_Calculator()
    for strItem in usrStrList:

        result = rpnc.calculate(strItem.strip())
        failStr = rpnc.failCondition()
        if failStr != None:
            # print("FAILED:", failStr)
            resultStr  += failStr + "\n"
        else:
            # print("The answer is", result)
            resultStr  += "The answer is " + str(result) + "\n"
    # Results must be printed all at once
    print(resultStr[:-1])
    sys.stdout.flush()