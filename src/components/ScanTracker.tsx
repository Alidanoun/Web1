"use client";

import { useEffect } from "react";

interface ScanTrackerProps {
  productId: string;
}

export default function ScanTracker({ productId }: ScanTrackerProps) {
  useEffect(() => {
    if (!productId) return;

    // Session-based deduplication: Track scan event ONCE per browser session per product
    const sessionKey = `markazia_scan_${productId}`;
    if (typeof window !== "undefined") {
      const alreadyScanned = sessionStorage.getItem(sessionKey);
      if (alreadyScanned) {
        return; // Skip duplicate scan logging on refresh or admin navigation
      }
      sessionStorage.setItem(sessionKey, "true");
    }

    // Track scan event dynamically on client mount
    fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product: productId }),
    }).catch((err) => console.error("Scan tracker network error:", err));
  }, [productId]);

  return null;
}
