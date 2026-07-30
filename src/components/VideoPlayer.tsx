"use client";

import { useState } from "react";

interface VideoPlayerProps {
  posterText: string;
  videoUrl?: string;
}

export default function VideoPlayer({ posterText, videoUrl }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper to extract YouTube embed URL if applicable
  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube Shorts or Watch links
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }

    return null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  // 1. If videoUrl exists and user clicks play for YouTube embed
  if (videoUrl && embedUrl && isPlaying) {
    return (
      <div className="video-player animate-fade-in" style={{ overflow: "hidden" }}>
        <iframe
          src={embedUrl}
          title={posterText}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  // 2. If Direct HTML5 Video File exists and playing
  if (videoUrl && !embedUrl && isPlaying) {
    return (
      <div className="video-player animate-fade-in">
        <video src={videoUrl} controls autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  // 3. Has videoUrl: Show playable thumbnail card
  if (videoUrl) {
    return (
      <div className="video-player animate-fade-in" style={{ cursor: "pointer" }} onClick={() => setIsPlaying(true)}>
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url('/logo.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <div className="video-play-btn">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "rgba(0, 0, 0, 0.75)",
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-brand-gold)",
              border: "1px solid rgba(223, 138, 39, 0.3)",
            }}
          >
            {posterText || "شاهد فيديو الوصفة الاحترافي"}
          </div>
        </div>
      </div>
    );
  }

  // 4. No videoUrl: Professional "Coming Soon / Info" Banner (No fake progress bar)
  return (
    <div
      className="video-player animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(28, 20, 13, 0.95) 0%, rgba(12, 10, 8, 0.98) 100%)",
        border: "1px dashed rgba(223, 138, 39, 0.35)",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        textAlign: "center",
        gap: "0.6rem",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(223, 138, 39, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-brand-gold)",
          fontSize: "1.5rem",
        }}
      >
        🎥
      </div>
      <h4 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
        فيديو التتبيل والطهي قريباً
      </h4>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", margin: 0, maxWidth: "280px", lineHeight: 1.4 }}>
        جاري تصوير خطوات تحضير هذه الوصفة مع شيف المركزية لإتاحة الفيديو قريباً.
      </p>
    </div>
  );
}
