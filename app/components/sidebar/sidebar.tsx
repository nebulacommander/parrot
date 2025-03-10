import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { MessageSquareText, PlusCircle } from "lucide-react";
import Link from "next/link";

export function ChatSidebar() {
  return (
    <Sidebar className="border-r border-border">
      <div className="flex h-full flex-col">
        <div className="p-4">
          <Link 
            href="/new"
            className="flex w-full items-center gap-2 rounded-lg border bg-background p-4 hover:bg-accent transition-colors"
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