/**
 * Configuration for mathematical expression formatting and rendering
 * Defines the rules and patterns for handling LaTeX and mathematical notations
 */
export const mathConfig = {
    // Delimiters configuration
    delimiters: {
      inline: ['$', '$'],
      display: ['$$', '$$'],
      mathBlock: '```math'
    },
    
    // LaTeX patterns and their corresponding formats
    patterns: {
      fractions: {
        simple: '\\frac{numerator}{denominator}',
        example: '\\frac{1}{2}'
      },
      powers: {
        simple: 'base^{exponent}',
        example: 'x^{2}'
      },
      roots: {
        simple: '\\sqrt{expression}',
        example: '\\sqrt{x}'
      },
      greek: {
        pattern: '\\alpha, \\beta, \\gamma',
        example: '\\alpha'
      }
    },
  
    // Advanced mathematical notation features
    features: {
      integrals: '\\int_{lower}^{upper}',
      summations: '\\sum_{i=1}^{n}',
      limits: '\\lim_{x \\to 0}',
      matrices: `\\begin{bmatrix} 
        a & b \\\\
        c & d 
      \\end{bmatrix}`,
      alignments: '\\begin{align} ... \\end{align}'
    },
  
    // Example templates for common mathematical expressions
    templates: {
      quadraticFormula: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
      derivative: '\\frac{d}{dx}(x^2) = 2x',
      integral: '\\int_{0}^{\\infty} e^{-x} dx = 1'
    }
  };
  
  /**
   * Configuration for KaTeX rendering options
   */
  export const katexConfig = {
    displayMode: false,
    throwOnError: false,
    strict: false,
    trust: true,
    macros: {
      "\\RR": "\\mathbb{R}",
      "\\NN": "\\mathbb{N}",
      "\\ZZ": "\\mathbb{Z}",
      "\\abs": "\\left|#1\\right|",
      "\\eval": "\\left.#1\\right|_{#2}"
    },
    maxSize: 10,
    maxExpand: 1000,
    fleqn: true
  };