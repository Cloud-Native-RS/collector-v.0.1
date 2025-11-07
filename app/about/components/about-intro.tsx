"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutIntro() {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Video/Image Wrapper */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/50 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full h-20 w-20 bg-background/90 hover:bg-background shadow-lg group-hover:scale-110 transition-transform"
              >
                <Play className="h-8 w-8 ml-1 text-primary" fill="currentColor" />
              </Button>
            </div>
          </div>

          {/* About Quote Tile */}
          <Card className="p-12 lg:p-16 flex flex-col justify-center space-y-8">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                our purpose
              </span>
            </div>
            
            <blockquote className="text-2xl lg:text-3xl font-medium leading-relaxed text-foreground">
              "We empower businesses to thrive in a competitive market and achieve sustainable growth through tailored, forward-looking technology integration."
            </blockquote>

            <div className="flex items-center space-x-4 pt-8">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/images/avatar-placeholder.jpg" alt="Rob Price" />
                <AvatarFallback className="text-lg">RP</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">Rob Price</div>
                <div className="text-sm text-muted-foreground">Founder & CEO</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

