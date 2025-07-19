import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// NOTE: We no longer need the <Script> component from next/script

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
    <html lang="en">
      <head>
        {/* We still need the Mapbox CSS file. */}
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        {children}
        {/* The JavaScript libraries are now bundled with the app, so we no longer need <Script> tags here. */}
      </body>
    </html>
  );
}
