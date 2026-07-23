"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface ScanTrackerProps {
  productId: string;
}

function ScanTrackerInner({ productId }: ScanTrackerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!productId) return;

    // ONLY log a scan if the visitor came directly from a physical QR code scan (URL contains ?source=qr)
    const source = searchParams ? searchParams.get("source") : null;
    if (source !== "qr") {
      return; // Normal page visit / refresh / link click -> DO NOT COUNT as a QR Scan!
    }

    // Session-based deduplication: Track scan event ONCE per browser session per product
    const sessionKey = `markazia_scan_${productId}`;
    if (typeof window !== "undefined") {
      const alreadyScanned = sessionStorage.getItem(sessionKey);
      if (alreadyScanned) {
        return; // Skip duplicate scan logging in same session
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
  }, [productId, searchParams]);

  return null;
}

export default function ScanTracker(props: ScanTrackerProps) {
  return (
    <Suspense fallback={null}>
      <ScanTrackerInner {...props} />
    </Suspense>
  );
}
