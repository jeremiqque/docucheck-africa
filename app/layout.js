import localFont from "next/font/local";
import "./globals.css";

// PP Neue Corp Compact — headings & display
const compact = localFont({
  src: [
    { path: "./fonts/PPNeueCorp-Compact-Ultralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/PPNeueCorp-Compact-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/PPNeueCorp-Compact-Ultrabold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-compact",
  display: "swap",
});

// PP Neue Corp Normal — body & UI text
const normal = localFont({
  src: [
    { path: "./fonts/PPNeueCorp-Normal-Ultralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/PPNeueCorp-Normal-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/PPNeueCorp-Normal-Ultrabold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-normal",
  display: "swap",
});

export const metadata = {
  title: "DocuCheck Africa",
  description:
    "AI-assisted pre- and post-construction compliance management for the African built environment.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${compact.variable} ${normal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
