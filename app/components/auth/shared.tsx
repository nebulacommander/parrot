'use client'

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";

export const BrandLogo = () => (
  <Link href="/" className="flex items-center gap-2.5 text-foreground">
    <BrainCircuit className="h-6 w-6 sm:h-7 sm:w-7" />
    <span className="font-outfit text-xl sm:text-2xl font-bold">
      Orbe
    </span>
  </Link>
);

export const AuthContainer = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background/90 to-background -z-10" />
      
      {/* Accent Gradients */}
      <div 
        className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] -z-10"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)'
            : 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)'
        }}
      />
      <div 
        className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] -z-10"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)'
            : 'radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)'
        }}
      />
      
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-8 left-8"
      >
        <BrandLogo />
      </motion.div>
      
      {/* Main Content */}
      <div className="w-full sm:w-[440px] px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
};

export const OAuthButton = ({
  icon,
  label,
  onClick,
  className
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.005 }}
    whileTap={{ scale: 0.995 }}
    onClick={onClick}
    className={cn(`
      group relative w-full flex items-center justify-center gap-3
      px-5 py-3 rounded-lg
      text-sm font-medium
      bg-card/50 hover:bg-card/80
      border border-border/50 hover:border-border
      shadow-sm hover:shadow
      transition-all duration-200
      backdrop-blur-sm
    `, className)}
  >
    {/* Icon wrapper */}
    <span className="transition-transform duration-200 group-hover:scale-110">
      {icon}
    </span>
    
    {/* Label */}
    <span className="text-foreground/90">
      {label}
    </span>
  </motion.button>
);