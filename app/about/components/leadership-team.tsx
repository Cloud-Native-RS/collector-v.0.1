"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const teamMembers = [
  {
    name: "Rob Price",
    role: "Founder & CEO",
    image: "/images/avatar-placeholder.jpg",
  },
  {
    name: "Sarah Chen",
    role: "Chief Technology Officer",
    image: "/images/avatar-placeholder.jpg",
  },
  {
    name: "Michael Torres",
    role: "Head of Operations",
    image: "/images/avatar-placeholder.jpg",
  },
  {
    name: "Emily Johnson",
    role: "Director of Strategy",
    image: "/images/avatar-placeholder.jpg",
  },
];

export function LeadershipTeam() {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-16">
        <h2 className="text-4xl lg:text-5xl font-bold mb-16">
          Leadership Team
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {teamMembers.map((member, index) => (
            <div key={index} className="relative">
              <Card className="p-8 h-full flex flex-col items-center text-center space-y-6 border-0 bg-transparent">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={member.image} alt={member.name} />
                  <AvatarFallback className="text-2xl">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-muted-foreground">{member.role}</p>
                </div>
              </Card>
              {index < teamMembers.length - 1 && (
                <Separator
                  orientation="vertical"
                  className="hidden lg:block absolute top-0 right-0 h-full w-px"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}






