import localFont from "next/font/local";
import "./globals.css";

// PP Neue Corp Compact - headings & display
const compact = localFont({
  src: [
    { path: "./fonts/PPNeueCorp-Compact-Ultralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/PPNeueCorp-Compact-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/PPNeueCorp-Compact-Ultrabold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-compact",
  display: "swap",
});

// PP Neue Corp Normal - body & UI text
const normal = localFont({
  src: [
    { path: "./fonts/PPNeueCorp-Normal-Ultralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/PPNeueCorp-Normal-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/PPNeueCorp-Normal-Ultrabold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-normal",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://docucheck-africa.vercel.app";
const DESC =
  "Upload any construction compliance document and get a clear pass, warning, or fail verdict in under 30 seconds. Built for the rules in Nigeria, Ghana, and South Africa.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DocuCheck Africa — AI compliance for African construction",
    template: "%s · DocuCheck Africa",
  },
  description: DESC,
  keywords: [
    "construction compliance",
    "building permit verification",
    "Nigeria",
    "Ghana",
    "South Africa",
    "COREN",
    "NHBRC",
    "compliance software",
  ],
  openGraph: {
    title: "DocuCheck Africa — AI compliance for African construction",
    description: DESC,
    url: "/",
    siteName: "DocuCheck Africa",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DocuCheck Africa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuCheck Africa — AI compliance for African construction",
    description: DESC,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${compact.variable} ${normal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
