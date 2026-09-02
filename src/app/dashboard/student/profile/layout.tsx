import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    absolute: "Mentra — Profile",
  },
};

export default function StudentProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
