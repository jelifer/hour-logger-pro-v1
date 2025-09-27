import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hour Logger Pro",
  description: "Track your hours efficiently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
