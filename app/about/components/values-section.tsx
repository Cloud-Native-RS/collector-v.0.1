"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const values = [
  {
    title: "Innovation as Tradition",
    description: "We believe in continuously pushing the boundaries of what's possible. Our commitment to innovation isn't just a practice; it's a tradition that shapes our approach to solving problems and delivering solutions that not only meet but exceed the expectations of our clients.",
  },
  {
    title: "Empowerment Through Knowledge",
    description: "We empower our clients by demystifying technology and providing the knowledge and tools they need to succeed. By fostering an environment of learning and growth, we help businesses of all sizes harness the power of digital transformation to achieve their goals.",
  },
  {
    title: "Integrity in Every Interaction",
    description: "Integrity is the cornerstone of everything we do at Forecast. From our internal team dynamics to our client relationships, we uphold the highest standards of honesty and transparency, ensuring trust and respect are never compromised.",
  },
];

export function ValuesSection() {
  return (
    <section className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold mb-16 text-center">
            Our Values
          </h2>
          
          <div className="space-y-16">
            {values.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "grid lg:grid-cols-2 gap-8 lg:gap-16 items-start",
                  index % 2 === 1 && "lg:grid-flow-dense"
                )}
              >
                <div
                  className={cn(
                    "space-y-4",
                    index % 2 === 1 && "lg:col-start-2"
                  )}
                >
                  <h3 className="text-2xl lg:text-3xl font-semibold">
                    {value.title}
                  </h3>
                </div>
                <div
                  className={cn(
                    "space-y-4 text-muted-foreground leading-relaxed",
                    index % 2 === 1 && "lg:col-start-1 lg:row-start-1"
                  )}
                >
                  <p className="text-lg">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}






