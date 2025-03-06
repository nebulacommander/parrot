"use client";

import { useSignIn } from "@clerk/nextjs";
import { OAuthStrategy } from "@clerk/types";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { BsGithub, BsMicrosoft } from "react-icons/bs";
import Link from "next/link";
import { AuthContainer, OAuthButton } from "@/components/auth/shared";

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();

  const signInWith = (strategy: OAuthStrategy) => {
    if (!isLoaded) return;

    try {
      return signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/chat",
      });
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  return (
    <AuthContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            Welcome Back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground"
          >
            Sign in to your account to continue
          </motion.p>
        </div>

        {/* OAuth Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {[
            {
              icon: <FcGoogle className="w-5 h-5" />,
              label: "Continue with Google",
              strategy: "oauth_google",
            },
            {
              icon: <BsGithub className="w-5 h-5 text-foreground" />,
              label: "Continue with GitHub",
              strategy: "oauth_github",
            },
            {
              icon: <BsMicrosoft className="w-5 h-5 text-[#00a4ef]" />,
              label: "Continue with Microsoft",
              strategy: "oauth_microsoft",
            },
          ].map((provider, i) => (
            <OAuthButton
              key={provider.strategy}
              icon={provider.icon}
              label={provider.label}
              onClick={() => signInWith(provider.strategy as OAuthStrategy)}
            />
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary hover:text-primary/90 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </AuthContainer>
  );
}
