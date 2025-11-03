"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { validateEmail, login } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Validate email
      if (!validateEmail(email)) {
        toast.error("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Attempt login
      const session = await login({ email, password });
      
      // Log login attempt
      const { logAuth, logAuthError, logAuthWarn } = await import('@/lib/auth/debug');
      logAuth('LoginForm: Login successful', { 
        hasSession: !!session,
        hasToken: !!session?.accessToken,
        tokenLength: session?.accessToken?.length || 0
      });

      if (!session) {
        logAuthError('LoginForm: No session returned');
        toast.error("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Token is already saved by login() function, verify it's persisted
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      logAuth('LoginForm: Token check after login()', {
        saved: !!savedToken,
        matches: savedToken === session.accessToken,
        localStorage: !!localStorage.getItem('token'),
        sessionStorage: !!sessionStorage.getItem('token')
      });
      
      if (!savedToken || savedToken !== session.accessToken) {
        logAuthWarn('LoginForm: Token mismatch, force saving');
        localStorage.setItem('token', session.accessToken);
        sessionStorage.setItem('token', session.accessToken);
        localStorage.setItem('user', JSON.stringify(session.user));
        localStorage.setItem('tenantId', session.user.tenantId || session.user.primaryTenantId || 'default-tenant');
      }
      
      // Store session data
      localStorage.setItem("auth_session", JSON.stringify(session));
      
      // Final verification before redirect
      const finalCheck = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!finalCheck || finalCheck !== session.accessToken) {
        logAuthError('LoginForm: Final check failed', {
          finalCheck: !!finalCheck,
          matches: finalCheck === session.accessToken
        });
        throw new Error('Failed to save authentication token');
      }
      
      logAuth('LoginForm: Before redirect', {
        token: finalCheck ? 'EXISTS' : 'MISSING',
        redirectPath: searchParams.get("redirect") || "/collector/dashboard"
      });
      
      toast.success("Welcome back!");
      
      // Wait 2 seconds to ensure token is saved, then redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check token one more time before redirect
      const preRedirectToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      logAuth('LoginForm: Pre-redirect check', {
        token: preRedirectToken ? 'EXISTS' : 'MISSING',
        tokenLength: preRedirectToken?.length || 0
      });
      
      if (!preRedirectToken) {
        logAuthError('LoginForm: Token lost before redirect!');
        throw new Error('Token was lost before redirect');
      }
      
      const redirectPath = searchParams.get("redirect") || "/collector/dashboard";
      logAuth('LoginForm: Redirecting', { redirectPath });
      window.location.href = decodeURIComponent(redirectPath);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid email or password");
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: "apple" | "google") => {
    // TODO: Implementirati social login
    console.log(`Login with ${provider}`);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  autoComplete="current-password"
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link 
                    href="/signup" 
                    className="underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="px-6 text-center text-xs text-muted-foreground space-y-3">
        <div className="space-y-1">
          <p className="font-semibold">Test Credentials:</p>
          <p>👑 Admin: admin@example.com / Admin123!</p>
          <p>👤 User 1: user@example.com / User123!</p>
          <p>👤 User 2: test@example.com / Test123!</p>
        </div>
        <div className="border-t pt-3">
          <p>
            By clicking continue, you agree to our{" "}
            <Link href="#" className="underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

