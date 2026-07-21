"use client";

import { useState } from "react";
import { DonenessDetail } from "@/data/recipes";

interface DonenessProps {
  levels: DonenessDetail[];
}

export default function Doneness({ levels }: DonenessProps) {
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to Medium Rare (index 1)

  const current = levels[selectedIndex];

  // Colors for steak SVG filling depending on doneness level index
  const donenessColors = [
    "#b81d1d", // Rare: Deep blood red
    "#d33d3d", // Medium Rare: Warm red-pink
    "#b54a67", // Medium: Rich pinkish
    "#8c584c", // Medium Well: Brownish-pink
    "#593e38", // Well Done: Dark gray-brown
  ];

  return (
    <div className="doneness-container">
      <div className="doneness-tabs">
        {levels.map((level, index) => (
          <button
            key={index}
            className={`doneness-tab ${selectedIndex === index ? "active" : ""}`}
            onClick={() => setSelectedIndex(index)}
          >
            {level.level.split(" (")[0]} {/* Show short English title */}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--color-border)",
          borderRadius: "14px",
          padding: "1rem",
          transition: "all 0.3s ease",
        }}
      >
        {/* Dynamic Steak SVG */}
        <div style={{ position: "relative", width: "70px", height: "70px", flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            {/* Outer Fat Ribbon / Meat boundary */}
            <path
              d="M15,50 C15,25 35,15 60,15 C80,15 90,30 85,55 C80,80 50,85 30,85 C15,85 15,75 15,50 Z"
              fill="#222"
              stroke="#555"
              strokeWidth="2"
            />
            {/* Outer Marbling Fat border */}
            <path
              d="M18,50 C18,30 35,20 58,20 C75,20 83,32 79,53 C75,74 48,79 30,79 C20,79 18,70 18,50 Z"
              fill="#ebdcc5" /* Cream fat color */
            />
            {/* Center Meat (dynamically colored) */}
            <path
              d="M25,50 C25,35 40,26 55,26 C68,26 73,36 71,50 C68,66 45,71 32,71 C26,71 25,65 25,50 Z"
              fill={donenessColors[selectedIndex]}
              style={{ transition: "fill 0.4s ease" }}
            />
            {/* T-bone SVG */}
            <path
              d="M60,15 C60,35 55,45 45,55 C43,57 41,55 41,53 C45,43 45,35 40,18"
              fill="none"
              stroke="#f5f5f5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Little marble fat lines inside */}
            <path d="M35,35 Q40,38 42,32" fill="none" stroke="#ebdcc5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M32,60 Q38,58 35,52" fill="none" stroke="#ebdcc5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M55,62 Q60,57 63,62" fill="none" stroke="#ebdcc5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>

        {/* Doneness Details */}
        <div style={{ textAlign: "right", minWidth: 0, flex: 1 }}>
          <h4
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>{current.level}</span>
            <span
              style={{
                fontSize: "0.75rem",
                background: "rgba(223, 138, 39, 0.15)",
                color: "var(--color-brand-gold)",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px",
                fontWeight: 700,
                direction: "ltr",
              }}
            >
              {current.temp}
            </span>
          </h4>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-brand-gold)",
              fontWeight: 600,
              marginTop: "0.15rem",
              marginBottom: "0.25rem",
            }}
          >
            اللون: {current.color}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
            {current.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
