import type { Metadata } from "next";
// Replace the problematic Geist font with the standard Inter font from Google.
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script"; // Import the Next.js Script component

// Initialize the Inter font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cue Club SF",
  description: "The best pool bars in San Francisco",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The lang attribute is sufficient here. Font classes go on the body.
    <html lang="en">
      <head>
        {/* Add the Mapbox CSS file here. */}
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      {/* Apply the Inter font className to the body tag */}
      <body className={inter.className}>
        {children}

        {/* Add required third-party JS libraries here. Next.js handles React/ReactDOM automatically. */}
        <Script
          src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
