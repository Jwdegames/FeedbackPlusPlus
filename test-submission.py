class RPN_Calculator:
    def __init__(self):
        self.reset()


    def reset(self):
        '''Resets the fail flags and stack'''
        self.stack = []
        self.failPop = False
        self.failSyntax = False

    def pop(self):
        '''Returns false if size of stack less than 2. Otherwise returns a tuple containing the top two numbers on
        the stack, where the leftmost number is the top number on the stack'''
        if len(self.stack) < 2:
            return False
        return (self.stack.pop(), self.stack.pop())

    def failCondition(self):
        '''Outputs a fail message if a fail flag was set. Otherwise outputs None.'''
        if self.failPop == True:
            return "Calculation failed. Not enough numbers in stack when operation requested"
        elif self.failSyntax == True:
            return "Calculation failed. There are extra numbers in the stack.";
        else:
            return None

    def calculate(self, inputString):
        '''Does RPN Calculation on a string'''
        self.reset()
        items = inputString.split(" ")
        for item in items:
            if item == "+" or item == "-" or item == "*" or item == "/" or item == "^" or item == "%":
                popResult = self.pop()
                if (popResult == False):
                    self.failPop = True
                    return -1
                num1 = popResult[0]
                num2 = popResult[1]
                if item == "+":
                    opResult = num1 + num2
                elif item == "-":
                    opResult = num1 - num2
                elif item == "*":
                    opResult = num1 * num2
                elif item == "/":
                    opResult = num1 / num2
                elif item == "^":
                    opResult = pow(num1, num2)
                else:
                    opResult = num1 % num2
                self.stack.append(opResult)
                # print(self.stack)
            else:
                self.stack.append(int(item))
        if (len(self.stack) != 1):
            self.failSyntax = True
            return -1
        return self.stack[0]


# DO NOT MODIFY THE BELOW
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
    # /print("usrStr:", usrStr)
    usrStrList = usrStr.split("\n")
    for strItem in usrStrList:
        rpnc = RPN_Calculator()
        result = rpnc.calculate(strItem.strip())
        failStr = rpnc.failCondition()
        if failStr != None:
            print("FAILED:", failStr)
        else:
            print("The answer is", result)
        sys.stdout.flush()