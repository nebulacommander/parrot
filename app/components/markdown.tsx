import { marked } from 'marked';
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

  // Custom table renderer with proper styling
  renderer.table = (token) => {
    return `
      <div class="my-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead class="bg-neutral-50 dark:bg-neutral-900">${token.header}</thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">${token.rows}</tbody>
        </table>
      </div>
    `;
  };

  // Custom heading renderer with proper spacing and sizing
  renderer.heading = ({ tokens, depth }) => {
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
        ${tokens.map(t => ('text' in t ? t.text : '')).join('')}
      </h${depth}>
    `;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true
  });

  return (
    <div 
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: marked(content) }} 
    />
  );
}