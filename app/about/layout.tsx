import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Forecast",
  description: "Forecast stands for business empowerment. Learn about our mission, values, and leadership team.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}






