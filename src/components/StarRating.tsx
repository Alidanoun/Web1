"use client";

import { useState } from "react";

interface StarRatingProps {
  product: string;
}

export default function StarRating({ product }: StarRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmitRating = async () => {
    if (rating === null) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, stars: rating, comment }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-gold-border" style={{ textAlign: "center" }}>
      {submitted ? (
        <div className="animate-fade-in" style={{ padding: "0.5rem 0" }}>
          <div
            style={{
              fontSize: "2.5rem",
              color: "var(--color-brand-gold)",
              marginBottom: "0.5rem",
            }}
          >
            ✓
          </div>
          <h4 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>شكرًا لتقييمك!</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            رأيك يهمنا ويساعدنا في تحسين وصفاتنا دائمًا.
          </p>
        </div>
      ) : (
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
            هل أعجبتك الوصفة؟
          </h4>
          
          {/* Star Icons Grid */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              direction: "ltr",
              marginBottom: "1rem",
            }}
          >
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isActive = (hover !== null ? hover : rating !== null ? rating : 0) >= starValue;
              return (
                <svg
                  key={starValue}
                  onClick={() => !loading && setRating(starValue)}
                  onMouseEnter={() => !loading && setHover(starValue)}
                  onMouseLeave={() => !loading && setHover(null)}
                  className={`star ${isActive ? "active" : ""} ${
                    rating === starValue ? "bounce" : ""
                  }`}
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              );
            })}
          </div>

          {/* Conditional Optional Feedback Textarea */}
          {rating !== null && (
            <div className="animate-fade-in" style={{ marginTop: "0.75rem" }}>
              <div className="form-group" style={{ textAlign: "right", marginBottom: "0.75rem" }}>
                <label className="form-label" style={{ fontSize: "0.82rem", marginBottom: "0.25rem", display: "block" }}>
                  اعطينا ملاحظاتك (اختياري):
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="أدخل ملاحظاتك أو اقتراحاتك هنا..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ resize: "vertical", fontSize: "0.82rem", padding: "0.5rem" }}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleSubmitRating}
                className="btn-gold"
                disabled={loading}
                style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", fontWeight: 700 }}
              >
                {loading ? "جاري الإرسال..." : "ارسل التقييم والملاحظات"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
