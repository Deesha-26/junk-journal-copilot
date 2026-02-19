import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Junk Journal Copilot",
  description:
    "Copilot that plans physical junk journal spreads using tape, layering, and writing prompts."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#fafafa",
          color: "#111",
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        }}
      >
        {children}
      </body>
    </html>
  );
}
