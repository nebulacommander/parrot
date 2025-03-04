import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { CodeBlock } from './ui';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const renderer = new marked.Renderer();
  
  // Custom code block renderer to use our Prism-powered CodeBlock
  renderer.code = ({ text, lang, escaped }) => {
    if (lang === 'math' || text.match(MATH_PATTERNS.block)) {
      try {
        return `<div class="math-block my-4 flex justify-center overflow-x-auto">
          ${katex.renderToString(text, {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: true,
            macros: {
              "\\RR": "\\mathbb{R}",
              "\\NN": "\\mathbb{N}",
              "\\ZZ": "\\mathbb{Z}",
              "\\boxed": "\\bbox[border: 1px solid]{#1}",
              "\\abs": "\\left|#1\\right|",
              "\\norm": "\\left\\|#1\\right\\|",
              "\\deriv": "\\frac{d}{d#1}",
              "\\partderiv": "\\frac{\\partial}{\\partial #1}"
            }
          })}</div>`;
      } catch (error) {
        console.error('KaTeX error:', error);
        return `<pre class="text-red-500">Error rendering math: ${(error as Error).message}</pre>`;
      }
    }
    return `<div class="my-4">
      ${CodeBlock({ code: text, language: lang || 'text' })}
    </div>`;
  }

  // Add inline math renderer
  const oldInlineCode = renderer.codespan;
  renderer.codespan = ({ text }: { text: string }) => {
    if (typeof text === 'string' && text.startsWith('$') && text.endsWith('$')) {
      try {
        return katex.renderToString(text.slice(1, -1), {
          displayMode: false,
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX error:', error);
        return `<span class="text-red-500">Error: ${(error as Error).message}</span>`;
      }
    }
    return oldInlineCode.call(renderer, { text, type: 'codespan', raw: `\`${text}\`` });
  };

  // Fix table cell rendering
  renderer.tablecell = (token) => {
    const type = token.header ? 'th' : 'td';
    const alignClass = token.align 
      ? ` text-${token.align}` 
      : '';
    const baseClass = token.header
      ? 'bg-neutral-50 dark:bg-neutral-900 font-semibold'
      : 'border-neutral-200 dark:border-neutral-800';
    
    return `<${type} class="p-2 ${baseClass}${alignClass}">${content}</${type}>`;
  };

  renderer.table = (token: Tokens.Table) => {
    // Process inline markdown in header cells
    const headerRow = token.header
      .map(cell => `<th class="p-2 bg-neutral-50 dark:bg-neutral-900 font-semibold">
        ${marked.parseInline(cell.text)}
      </th>`)
      .join('');
      
    // Process inline markdown in body cells
    const bodyRows = token.rows
      .map(row => 
        `<tr class="border-t border-neutral-200 dark:border-neutral-800">
          ${row.map(cell => `<td class="p-2">${marked.parseInline(cell.text)}</td>`).join('')}
        </tr>`
      )
      .join('');

    return `
      <div class="my-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
            ${bodyRows}
          </tbody>
        </table>
      </div>
    `;
  };

  // Add these math-specific regex patterns
  const MATH_PATTERNS = {
    inline: /\$([^\$]+)\$/g,
    block: /\$\$([^$]+)\$\$/g,
    latex: /\\[a-zA-Z]+\{[^}]+\}/g,
  };

  // Enhanced inline math handling
  renderer.text = (token: Tokens.Escape | Tokens.Text) => {
    let text = token.text;
    // Handle inline math with $ signs
    text = text.replace(MATH_PATTERNS.inline, (match, latex) => {
      try {
        return katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false,
          strict: false
        });
      } catch (error) {
        console.error('KaTeX inline error:', error);
        return match;
      }
    });

    // Handle LaTeX commands outside math mode
    text = text.replace(MATH_PATTERNS.latex, (match) => {
      try {
        return katex.renderToString(match, {
          displayMode: false,
          throwOnError: false
        });
      } catch (error) {
        return match;
      }
    });

    return text;
  };

  // Custom heading renderer with proper spacing and sizing  
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map(t => (t as any).text || '').join('');
    const sizes: Record<number, string> = {
      1: 'text-3xl',
      2: 'text-2xl', 
      3: 'text-xl',
      4: 'text-lg',
      5: 'text-base',
      6: 'text-sm'
    };
    return `
      <h${depth} class="font-bold ${sizes[depth]} my-4">
        ${text}
      </h${depth}>
    `;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
  });

  return (
    <div 
      className="prose dark:prose-invert max-w-none math-content"
      dangerouslySetInnerHTML={{ __html: marked(content) }} 
    />
  );
}