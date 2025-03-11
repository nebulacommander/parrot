import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";


export function AnimatedLogo() {
  const { user } = useUser();
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Function to get user's local time using browser APIs
    const getUserTime = async () => {
      try {
        // Attempt to get user's timezone and time
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: 'numeric',
          hour12: false
        });
        
        const hour = parseInt(formatter.format(new Date()));
        
        if (hour >= 0 && hour < 12) {
          setGreeting("Good Morning");
        } else if (hour >= 12 && hour < 17) {
          setGreeting("Good Afternoon");
        } else if (hour >= 17 && hour < 24) {
          setGreeting("Good Evening");
        }
        
        // Special case for midnight
        if (hour === 0) {
          setGreeting("Happy Midnight, It's a new day");
        }
      } catch (error) {
        console.error("Error getting time:", error);
        setGreeting("Hello"); // Fallback greeting
      }
    };

    getUserTime();
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      getUserTime();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-gradient tracking-tight">
        {greeting}, {user?.firstName || 'Friend'}
      </h1>
      <p className="text-lg text-neutral-500 dark:text-neutral-400 animate-fade-in">
        Let&apos;s have a great conversation!
      </p>
    </div>
  );
}
