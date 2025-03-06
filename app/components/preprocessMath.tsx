/**
 * Enhanced math preprocessing with human-readable output
 */
const MATH_PATTERNS = {
  power: /(\d+)\^(\d+)/g,
  fraction: /\\frac\{(\d+)\}\{(\d+)\}/g,
  boxed: /\\boxed\{([^}]+)\}/g,
  sqrt: /\\sqrt\{([^}]+)\}/g,
  greek: /\\([a-zA-Z]+)/g,
};

function preprocessMath(text: string): string {
  return text
    // Convert powers
    .replace(MATH_PATTERNS.power, '$1 raised to power $2')
    // Convert fractions
    .replace(MATH_PATTERNS.fraction, (_, num, den) => {
      const decimal = (parseInt(num) / parseInt(den)).toFixed(2);
      return `${num}/${den} (${decimal})`;
    })
    // Remove boxes
    .replace(MATH_PATTERNS.boxed, '$1')
    // Convert square roots
    .replace(MATH_PATTERNS.sqrt, 'square root of $1')
    // Convert Greek letters
    .replace(MATH_PATTERNS.greek, (_, letter) => {
      const greekNames: Record<string, string> = {
        alpha: 'alpha',
        beta: 'beta',
        theta: 'theta',
        gamma: 'gamma',
        delta: 'delta',
        epsilon: 'epsilon',
        zeta: 'zeta',
        eta: 'eta',
        iota: 'iota',
        kappa: 'kappa',
        lambda: 'lambda',
        mu: 'mu',
        nu: 'nu',
        xi: 'xi',
        pi: 'pi',
        rho: 'rho',
        sigma: 'sigma',
        tau: 'tau',
        upsilon: 'upsilon',
        phi: 'phi',
        chi: 'chi',
        psi: 'psi',
        omega: 'omega',
      };
      return greekNames[letter] || letter;
    });
}

/**
 * Process step-by-step calculations
 */
function processSteps(steps: string[]): string {
  return steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');
}

export { preprocessMath, processSteps };