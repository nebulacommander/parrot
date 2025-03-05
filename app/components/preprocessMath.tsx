function preprocessMath(text: string): string {
    const MATH_PATTERNS = {
        // Enhanced arithmetic pattern
        arithmeticExpression: /(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/g,
        simpleFraction: /(\d+)\s*\/\s*(\d+)(?!\d)/g, // Modified fraction pattern
        superscript: /(\w+)\^(\w+)/, 
        greek: /\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/i,
        sqrt: /sqrt\(([^)]+)\)/,
    };
  
    // Enhanced arithmetic evaluation
    function safeEvaluateExpression(match: string, num1: string, op: string, num2: string): string {
        const a = parseFloat(num1);
        const b = parseFloat(num2);
        
        if (isNaN(a) || isNaN(b)) return match;
        
        switch(op) {
            case '+': return `${(a + b).toFixed(2)}`; // Format to 2 decimal places
            case '-': return `${(a - b).toFixed(2)}`;
            case '*': return `${(a * b).toFixed(2)}`;
            case '/': return `\\frac{${a}}{${b}}`; // Return LaTeX fraction
            default: return match;
        }
    }
  
    // Step 1: Handle simple fractions first
    text = text.replace(MATH_PATTERNS.simpleFraction, (_, num, den) => {
        return `\\frac{${num}}{${den}}`;
    });
  
    // Step 2: Process arithmetic expressions
    text = text.replace(MATH_PATTERNS.arithmeticExpression, safeEvaluateExpression);
  
    // Step 3: Convert other mathematical notations
    text = text
        .replace(MATH_PATTERNS.superscript, '$${$1}^{$2}$$')
        .replace(MATH_PATTERNS.sqrt, '$$\\sqrt{$1}$$')
        .replace(MATH_PATTERNS.greek, (match) => {
            const greekMap: {[key: string]: string} = {
                'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma',
                // ... (rest of greek letters)
            };
            return `$$${greekMap[match.toLowerCase()] || match}$$`;
        });
  
    // Final cleanup: Ensure all fractions are properly wrapped
    text = text.replace(/\\frac{([^}]+)}{([^}]+)}/g, '$$\\frac{$1}{$2}$$');
  
    return text;
  }
  
  export { preprocessMath };