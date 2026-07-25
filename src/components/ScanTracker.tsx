"use client";

import { useEffect } from "react";

interface ScanTrackerProps {
  productId: string;
}

export default function ScanTracker({ productId }: ScanTrackerProps) {
  useEffect(() => {
    if (!productId) return;

    // Session-based deduplication: Track customer entry ONCE per browser session per product/recipe
    const sessionKey = `markazia_visit_${productId}`;
    if (typeof window !== "undefined") {
      const alreadyTracked = sessionStorage.getItem(sessionKey);
      if (alreadyTracked) {
        return; // Skip duplicate tracking on page refreshes in the same session
      }
      sessionStorage.setItem(sessionKey, "true");
    }

    // Record customer visit/entry event
    fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product: productId }),
    }).catch((err) => console.error("Customer visit tracking network error:", err));
  }, [productId]);

  return null;
}
