"use client";

import { useState } from "react";

interface VideoPlayerProps {
  posterText: string;
  videoUrl?: string;
}

export default function VideoPlayer({ posterText, videoUrl }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Helper to extract YouTube embed URL if applicable
  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube Shorts or Watch links
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }

    // Direct MP4 / WebM link
    return null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    // Simulate progress if using mock player
    if (!embedUrl && !videoUrl) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 100);
    }
  };

  // 1. If YouTube Embed Video URL exists and user clicked play
  if (videoUrl && embedUrl) {
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

  // 2. If Direct HTML5 Video File exists
  if (videoUrl && !embedUrl && isPlaying) {
    return (
      <div className="video-player animate-fade-in">
        <video src={videoUrl} controls autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  // 3. Fallback / Mock interactive player
  return (
    <div className="video-player animate-fade-in" style={{ cursor: "pointer" }} onClick={handlePlay}>
      {isPlaying ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle, #1c140d 0%, #080808 100%)",
            position: "relative",
          }}
        >
          {/* Simulated cooking video animations */}
          <div
            className="animate-float"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "3rem" }}>🥩🔥🍳</span>
            <p style={{ fontSize: "0.85rem", color: "var(--color-brand-gold)", fontWeight: 700 }}>
              جاري عرض فيديو الوصفة الاحترافي...
            </p>
          </div>

          {/* Pause Icon overlay */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "rgba(0,0,0,0.6)",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.7rem",
            }}
          >
            ❚❚ إيقاف مؤقت
          </div>

          {/* Video Progress Bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: "#333",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--color-brand-gold)",
                boxShadow: "0 0 8px var(--color-brand-gold)",
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {/* Logo background mockup */}
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('/logo.jpg')",
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
              background: "rgba(0, 0, 0, 0.7)",
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-brand-gold)",
              border: "1px solid rgba(223, 138, 39, 0.3)",
            }}
          >
            {posterText}
          </div>
        </div>
      )}
    </div>
  );
}
