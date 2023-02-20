# class RPN_Calculator:
#     def __init__(self):
#         self.reset()


#     def reset(self):
#         '''Resets the fail flags and stack'''
#         self.stack = []
#         self.failPop = False
#         self.failSyntax = False

#     def pop(self):
#         '''Returns false if size of stack less than 2. Otherwise returns a tuple containing the top two numbers on
#         the stack, where the leftmost number is the top number on the stack'''
#         if len(self.stack) < 2:
#             return False
#         return (self.stack.pop(), self.stack.pop())

#     def failCondition(self):
#         '''Outputs a fail message if a fail flag was set. Otherwise outputs None.'''
#         if self.failPop == True:
#             return "Calculation failed. Not enough numbers in stack when operation requested."
#         elif self.failSyntax == True:
#             return "Calculation failed. There are extra numbers in the stack."
#         else:
#             return None

def rpn_calculate(inputString):
    '''Does RPN Calculation on a string'''
    # self.reset()
    rpn_stack = []
    items = inputString.split(" ")
    for item in items:
        if item == "+" or item == "-" or item == "*" or item == "/" or item == "^" or item == "%":
            if (len(rpn_stack) < 2):
                return "Calculation failed. Not enough numbers in stack when operation requested."
            num1 = rpn_stack.pop()
            num2 = rpn_stack.pop()
            if item == "+":
                opResult = num1 + num2
            elif item == "-":
                opResult = num1 - num2
            elif item == "*":
                opResult = num1 * num2
            elif item == "/":
                if num2 == 0:
                    return "Calculation failed. Can't divide by 0."
                opResult = num1 // num2
            elif item == "^":
                if num1 == 0 and num2 < 0:
                    return "Calculation failed. Can't raise 0 to a negative power."
                if abs(num1) >= 100 or abs(num2) >= 100:
                    return "Calculation failed. num1 and/or num2 are too big to perform the power operation."
                opResult = math.floor(pow(num1, num2))
            else:
                if num2 == 0:
                    return "Calculation failed. Can't divide by 0."
                # Note: JS has remainder operator, not modulo operator. Below implements modulo operator
                opResult = num1 % num2
            rpn_stack.append(opResult)
            # print(self.stack)
        else:
            rpn_stack.append(int(item))
    if (len(rpn_stack) != 1):
        return "Calculation failed. There are extra numbers in the stack."
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
