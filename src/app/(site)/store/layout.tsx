import type React from "react";

/** PDP uses in-page breadcrumbs only; other store routes opt into `StoreSubNav`. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
