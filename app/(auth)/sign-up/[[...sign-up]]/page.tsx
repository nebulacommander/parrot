"use client";

import { IconBrain } from "@tabler/icons-react";
import { type Appearance } from '@clerk/types';
import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconBrandGithub, IconBrandGoogle, IconMail } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function SignUpForm() {
  const { signUp, isLoaded } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<"oauth" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleOAuthSignUp = async (provider: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;
    try {
      setIsLoading(true);
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/chat",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    try {
      setIsLoading(true);
      await signUp.create({
        emailAddress: email,
        password,
      });
      
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // Handle verification step
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md space-y-6 bg-background/60 backdrop-blur-xl rounded-2xl p-6 border shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred sign up method
        </p>
      </div>

      {!method ? (
        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full relative group hover:border-primary/50"
            onClick={() => handleOAuthSignUp("oauth_google")}
            disabled={isLoading}
          >
            <IconBrandGoogle className="h-5 w-5 mr-2 text-primary" />
            Continue with Google
            <motion.div
              className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100"
              initial={false}
              transition={{ duration: 0.3 }}
            />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full relative group hover:border-primary/50"
            onClick={() => handleOAuthSignUp("oauth_github")}
            disabled={isLoading}
          >
            <IconBrandGithub className="h-5 w-5 mr-2 text-primary" />
            Continue with GitHub
            <motion.div
              className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100"
              initial={false}
              transition={{ duration: 0.3 }}
            />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full relative group hover:border-primary/50"
            onClick={() => setMethod("email")}
            disabled={isLoading}
          >
            <IconMail className="h-5 w-5 mr-2 text-primary" />
            Continue with Email
            <motion.div
              className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100"
              initial={false}
              transition={{ duration: 0.3 }}
            />
          </Button>
        </div>
      ) : (
        <motion.form
          className="space-y-4"
          onSubmit={handleEmailSignUp}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-background/50"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up with Email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setMethod(null)}
            disabled={isLoading}
          >
            Back to all options
          </Button>
        </motion.form>
      )}

      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Button variant="link" className="p-0 h-auto font-normal" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </motion.div>
  );
}

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#0ea5e9', // This should match your primary color
    colorTextOnPrimaryBackground: '#ffffff',
    colorBackground: '#000000',
    colorInputBackground: '#18181b',
    colorInputText: '#ffffff',
    colorTextSecondary: '#71717a',
  },
  elements: {
    card: "bg-background/80 backdrop-blur border-border shadow-2xl",
    headerTitle: "text-foreground font-outfit",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: "bg-background/50 hover:bg-background/80 transition-colors duration-200",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    socialButtonsProviderIcon: "text-foreground",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    formFieldLabel: "text-foreground",
    formFieldInput: "bg-background/50 border-border text-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-200",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/90",
    identityPreviewText: "text-foreground",
    identityPreviewEditButtonIcon: "text-primary",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <motion.div 
          className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/30 blur-[128px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute left-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/30 blur-[128px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8 flex items-center gap-2"
      >
        <IconBrain className="h-8 w-8 text-primary" />
        <span className="font-outfit text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
          Orbe
        </span>
      </motion.div>

      {/* Sign Up Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10"
      >
        <SignUpForm />
      </motion.div>
    </div>
  );
}