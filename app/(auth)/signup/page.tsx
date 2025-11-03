import { SignupForm } from "@/components/auth/signup-form";
import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Sign Up",
    description: "Create a new account to access the dashboard. Use your email and password or sign up with Apple or Google.",
    canonical: "/signup"
  });
}

export default function SignupPage() {
  return <SignupForm />;
}

