import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referent",
  description: "Программа-референт с английского на базе ИИ. Я изучаю Next.js!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
