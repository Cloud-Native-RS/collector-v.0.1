"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SiteHeader } from "@/components/layout/header";

export default function CollectorLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Only check if we haven't already authenticated
    if (isAuthenticated === true) {
      return; // Already authenticated, don't check again
    }

    // Simple check - wait 500ms for localStorage to be ready
    const timer = setTimeout(() => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const hasToken = token && token.trim().length > 0;
      
      if (hasToken) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [mounted, pathname, router, isAuthenticated]);

  // Log render state (MUST be before any conditional returns - Rules of Hooks)
  useEffect(() => {
    if (mounted) {
      import('@/lib/auth/debug').then(({ logAuth }) => {
        logAuth('CollectorLayout: Render state', {
          mounted,
          isAuthenticated,
          pathname
        });
      });
    }
  }, [mounted, isAuthenticated, pathname]);

  // Log successful render (MUST be before any conditional returns - Rules of Hooks)
  useEffect(() => {
    if (isAuthenticated === true) {
      import('@/lib/auth/debug').then(({ logAuth }) => {
        logAuth('CollectorLayout: Rendering authenticated content', { pathname });
      });
    }
  }, [isAuthenticated, pathname]);

  // Log when SidebarProvider mounts (MUST be before any conditional returns - Rules of Hooks)
  useEffect(() => {
    if (isAuthenticated === true) {
      import('@/lib/auth/debug').then(({ logAuth }) => {
        logAuth('CollectorLayout: SidebarProvider will mount - user is authenticated');
      });
    }
  }, [isAuthenticated]);

  // Conditional returns - AFTER all hooks
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)"
        } as React.CSSProperties
      }>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main p-4 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

