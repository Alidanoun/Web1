"use client";

import { useEffect } from "react";

interface ScanTrackerProps {
  productId: string;
}

export default function ScanTracker({ productId }: ScanTrackerProps) {
  useEffect(() => {
    if (!productId) return;

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
