import { Geist } from "next/font/google";

const geist = Geist({ 
  subsets: ["latin"], 
  variable: "--font-geist",
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const fontVariables = geist.variable;
