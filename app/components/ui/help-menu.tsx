import { useState } from 'react';
import { HelpCircle, Keyboard, FileText, Shield, Book, ChevronRight } from 'lucide-react';
import { Modal } from './modal';

interface HelpItem {
  id: string;
  icon: JSX.Element;
  label: string;
  content: JSX.Element;
}

export function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const helpItems: HelpItem[] = [
    {
      id: 'shortcuts',
      icon: <Keyboard className="w-4 h-4" />,
      label: 'Keyboard Shortcuts',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'Enter', action: 'Focus input' },
              { key: 'Esc', action: 'Clear input' },
              { key: 'Ctrl + Z', action: 'Toggle thinking' },
              { key: '↑/↓', action: 'Navigate history' },
            ].map(({ key, action }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{action}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'docs',
      icon: <Book className="w-4 h-4" />,
      label: 'Documentation',
      content: <div className="prose dark:prose-invert">Documentation content here...</div>
    },
    {
      id: 'terms',
      icon: <FileText className="w-4 h-4" />,
      label: 'Terms of Service',
      content: <div className="prose dark:prose-invert">Terms content here...</div>
    },
    {
      id: 'privacy',
      icon: <Shield className="w-4 h-4" />,
      label: 'Privacy Policy',
      content: <div className="prose dark:prose-invert">Privacy policy content here...</div>
    }
  ];

  return (
    <>
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-lg border border-neutral-200 dark:border-neutral-800"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>

        {isOpen && (
          <div className="absolute bottom-12 right-0 w-64 py-2 rounded-lg bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
            {helpItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModal(item.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="text-neutral-600 dark:text-neutral-400">{item.icon}</span>
                <span className="flex-1 text-sm text-left">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {helpItems.map((item) => (
        <Modal
          key={item.id}
          isOpen={activeModal === item.id}
          onClose={() => setActiveModal(null)}
          title={item.label}
        >
          {item.content}
        </Modal>
      ))}
    </>
  );
}
