import { clientEnv } from "./env.client";

export const siteConfig = {
  // Site Identity
  name: "Lucsum",
  domain: "lucsum.com",
  description: "LUCSUM is a direct-to-consumer Indian streetwear label — oversized cotton tees, shipped across India.",

  // Contact Information
  contact: {
    email: "support@lucsum.com",
    supportEmail: "support@lucsum.com",
    noreplyEmail: "noreply@lucsum.com",
    phone: "+91 82728 10805",
    address: {
      line1: "2653 Radha Vihar",
      line2: "",
      city: "Saharanpur",
      state: "Uttar Pradesh",
      postalCode: "247001",
      country: "India",
    },
  },

  // URLs
  urls: {
    base: clientEnv.NEXT_PUBLIC_BASE_URL,
    website: "https://lucsum.com",
    support: "https://lucsum.com/support",
    help: "https://lucsum.com/help",
    returns: "https://lucsum.com/returns",
    shipping: "https://lucsum.com/shipping",
    terms: "https://lucsum.com/legal/terms",
    privacy: "https://lucsum.com/legal/privacy",
    unsubscribe: "https://lucsum.com/unsubscribe",
  },

  // Email Configuration
  email: {
    from: {
      name: "Lucsum",
      address: "noreply@lucsum.com",
    },
    support: {
      name: "Lucsum Support",
      address: "support@lucsum.com",
    },
    replyTo: "support@lucsum.com",
    footer: {
      company: "Lucsum",
      address: "2653 Radha Vihar, Saharanpur 247001, Uttar Pradesh, India",
      unsubscribe: "If you no longer wish to receive these emails, you can unsubscribe here.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  },

  // Social Media
  socialLinks: [
    {
      name: "Facebook",
      url: "https://facebook.com/lucsum",
      icon: "facebook",
    },
    {
      name: "Instagram",
      url: "https://instagram.com/lucsum",
      icon: "instagram",
    },
    {
      name: "Twitter",
      url: "https://twitter.com/lucsum",
      icon: "twitter",
    },
    {
      name: "LinkedIn",
      url: "https://linkedin.com/company/lucsum",
      icon: "linkedin",
    },
    {
      name: "YouTube",
      url: "https://youtube.com/@lucsum",
      icon: "youtube",
    },
  ],

  // Brand Colors
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
    background: "#f9fafb",
    text: "#111827",
    textMuted: "#6b7280",
  },

  // Business Info
  business: {
    hours: "Mon-Fri 9AM-6PM EST",
    freeShippingThreshold: 1000,
    returnPolicy: "30-day return window after delivery",
    paymentMethods: ["Razorpay", "UPI", "Cards", "Cash on delivery"],
  },

  // Legal
  legal: {
    companyName: "Lucsum",
    taxId: "",
    lastUpdated: "October 2026",
  },
};

// Legacy exports for backward compatibility
export const site = {
  name: siteConfig.name,
  address: `${siteConfig.contact.address.line1}, ${siteConfig.contact.address.city}, ${siteConfig.contact.address.state} ${siteConfig.contact.address.postalCode}`,
  phone: siteConfig.contact.phone,
  email: siteConfig.contact.email,
  description: siteConfig.description,
  url: clientEnv.NEXT_PUBLIC_BASE_URL,
  legalUpdate: siteConfig.legal.lastUpdated,
  apiTitle: `${siteConfig.name} API`,
  apiVersion: "1.0.0",
  socialLinks: siteConfig.socialLinks.map((link) => link.url),
};

export type SiteConfig = typeof siteConfig;
