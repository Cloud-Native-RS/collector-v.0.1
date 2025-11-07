"use client";

import dynamic from "next/dynamic";

// Lazy load heavy Calendar component
const EventCalendarApp = dynamic(() => import("./components/event-calendar-app"), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-sm text-muted-foreground">Loading calendar...</div>
    </div>
  ),
  ssr: false
});

export default function CalendarClient() {
  return <EventCalendarApp />;
}
