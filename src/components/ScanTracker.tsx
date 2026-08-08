"use client";

import { useEffect } from "react";

interface ScanTrackerProps {
  productId: string;
}

export default function ScanTracker({ productId }: ScanTrackerProps) {
  useEffect(() => {
    if (!productId) return;

    let source = "direct";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const srcParam = searchParams.get("source") || searchParams.get("src") || searchParams.get("qr") || searchParams.get("ref");
      if (srcParam && (srcParam.toLowerCase() === "qr" || srcParam === "1" || srcParam.toLowerCase() === "true")) {
        source = "qr";
        sessionStorage.setItem("markazia_scanned_qr", "true");
      } else if (sessionStorage.getItem("markazia_scanned_qr") === "true") {
        source = "qr";
      }

      // Session-based deduplication: Track entry ONCE per browser session per product/recipe
      const sessionKey = `markazia_visit_${productId}_${source}`;
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
      body: JSON.stringify({ product: productId, source }),
    }).catch((err) => console.error("Customer visit tracking network error:", err));
  }, [productId]);

  return null;
}
