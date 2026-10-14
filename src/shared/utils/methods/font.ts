import { Onest as Font } from "next/font/google";
import { siteConfig } from "@/shared/config/site";

const font = Font({
  subsets: ["latin"],
  variable: "--font-common",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal"],
});

const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.colors.primary },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  /** PWA / installed “app” feel: disables pinch-zoom (a11y tradeoff; intentional here). */
  maximumScale: 1,
  userScalable: false,
};

const className = `${font.variable} font-common antialiased`;

export { className, font, viewport };
