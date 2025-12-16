import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduNexus API",
  description: "EduNexus Backend API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
