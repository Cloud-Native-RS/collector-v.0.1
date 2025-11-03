import Link from "next/link";
import { GalleryVerticalEnd } from "lucide-react";

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link 
          href="/collector/dashboard" 
          className="flex items-center gap-2 self-center font-medium hover:opacity-80 transition-opacity"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Collector
        </Link>
        {children}
      </div>
    </div>
  );
}

