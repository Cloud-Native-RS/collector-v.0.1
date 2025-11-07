"use client";

import dynamic from "next/dynamic";

// Lazy load heavy File Manager component
const FileManager = dynamic(() => import("./components/file-manager").then((mod) => ({ default: mod.FileManager })), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-sm text-muted-foreground">Loading file manager...</div>
    </div>
  ),
  ssr: false
});

export default function FileManagerClient() {
  return <FileManager />;
}
