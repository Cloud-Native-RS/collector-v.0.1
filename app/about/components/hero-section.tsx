"use client";

import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
      {/* Decorative Circle */}
      <div className="absolute -right-1/4 -top-1/4 h-[1599px] w-[1599px] rounded-full bg-primary/5 blur-3xl" />
      
      <div className="relative container mx-auto px-4 lg:px-16 py-32 lg:py-48">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="block">Forecast stands for</span>
            <span className="block text-primary">business empowerment</span>
          </h1>
        </div>
      </div>
    </section>
  );
}






