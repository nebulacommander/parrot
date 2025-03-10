import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { MessageSquareText, PlusCircle, X } from "lucide-react";
import Link from "next/link";

interface ChatSidebarProps {
  onClose: () => void;
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  return (
    <Sidebar className="fixed inset-y-0 left-0 z-50 w-64 bg-[#f0f0f0] dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-semibold">Chats</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <Link 
            href="/new"
            className="flex w-full items-center gap-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 p-4 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            <PlusCircle size={16} />
            <span>New Chat</span>
          </Link>
        </div>
        <SidebarContent>
          <SidebarGroup>
            {/* Chat history would go here */}
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}