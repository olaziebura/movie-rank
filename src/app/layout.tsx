import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Topbar } from "@/components/Topbar";
import { auth0 } from "@/lib/auth/auth0";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#1F2937",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "MovieRank | Movie Ratings & Rankings",
  description: "Discover, rate, and rank your favorite movies with MovieRank",
  keywords: ["movies", "ratings", "film rankings", "cinema", "movie reviews"],
  authors: [{ name: "MovieRank Team" }],
  openGraph: {
    title: "MovieRank | Movie Ratings & Rankings",
    description: "Discover, rate, and rank your favorite movies with MovieRank",
    url: "https://movierank.example.com",
    siteName: "MovieRank",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MovieRank Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieRank | Movie Ratings & Rankings",
    description: "Discover, rate, and rank your favorite movies",
    images: ["/twitter-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();

  return (
    <html lang="en">
      <body className="antialiased">
        <Topbar session={session} />
        <div>
          {children}
          <footer className="bg-neutral-600 text-white py-4">
            <div className="container mx-auto text-center">
              <p>
                &copy; {new Date().getFullYear()} MovieRank. All rights
                reserved.
              </p>
            </div>
          </footer>
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
