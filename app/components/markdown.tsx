import { marked } from 'marked';
import type { Token } from 'marked';
import type { Tokens } from 'marked';
import { CodeBlock } from './ui';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from './preprocessMath';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const renderer = new marked.Renderer();
  
  const CODE_BLOCK_REGEX = /^```(\w+)?\n([\s\S]*?)```$/;
renderer.code = ({ text, lang }) => {
  // Special case for math blocks
  if (lang === 'math') {
    const humanReadable = preprocessMath(text);
    return `<div class="math-block my-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
      ${humanReadable}
    </div>`;
  }

  return `<div class="code-block-wrapper">
    <CodeBlock language="${lang || 'text'}" code="${text.replace(/"/g, '&quot;')}" />
  </div>`;
};

// Add enhanced text processing
renderer.text = (text) => {
  return preprocessMath(text.text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
};

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

  function renderMathExpression(text: string, displayMode = false): string {
    try {
      // Process the expression for human-readable output
      const processed = preprocessMath(text);
      
      // For display mode, wrap in a styled div
      if (displayMode) {
        return `
          <div class="math-block bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
            ${processed}
          </div>
        `;
      }
      
      // For inline mode, wrap in a styled span
      return `<span class="math-inline">${processed}</span>`;
    } catch (error) {
      console.error('Math rendering error:', error);
      return `<span class="text-red-500">${text}</span>`;
    }
  }

  // Add these math-specific regex patterns
  const MATH_PATTERNS = {
    inline: /\$([^\$]+)\$/g,
    block: /\$\$([^$]+)\$\$/g,
    latex: /\\[a-zA-Z]+\{[^}]+\}/g,
  };

  // Enhanced inline math handling
  renderer.text = (token: Tokens.Text) => {
    let text = token.text;
    
    // Handle math expressions
    text = text.replace(/\$([^$]+)\$/g, (_, math) => {
      return renderMathExpression(math, false);
    });
    
    // Handle display math
    text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      return renderMathExpression(math, true);
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
      className="prose dark:prose-invert max-w-none math-content select-text"
      dangerouslySetInnerHTML={{ __html: marked(content) }} 
    />
  );
}