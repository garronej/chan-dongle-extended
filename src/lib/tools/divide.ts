export function divide(maxLength: number, str: string): string[] {

    function callee(state: string[], rest: string): string[] {

        if( !rest ) return state;
        
        state.push(rest.substring(0, maxLength));

        return callee(state, rest.substring(maxLength, rest.length));

    }

    return callee([], str);

}
