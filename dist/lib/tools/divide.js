"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function divide(maxLength, str) {
    function callee(state, rest) {
        if (!rest)
            return state;
        state.push(rest.substring(0, maxLength));
        return callee(state, rest.substring(maxLength, rest.length));
    }
    return callee([], str);
}
exports.divide = divide;
//# sourceMappingURL=divide.js.map