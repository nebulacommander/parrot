import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { CodeBlock } from './ui';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const renderer = new marked.Renderer();
  
  // Custom code block renderer to use our Prism-powered CodeBlock
  renderer.code = ({ text, lang, escaped }) => {
    return `<div class="my-4">
      ${CodeBlock({ code: text, language: lang || 'text' })}
    </div>`;
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
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: marked(content) }} 
    />
  );
}