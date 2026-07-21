"use client";

import { useState } from "react";

interface RecipeStepsProps {
  items: string[];
  type: "ingredients" | "instructions";
}

export default function RecipeSteps({ items, type }: RecipeStepsProps) {
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedState((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, index) => {
        const isChecked = !!checkedState[index];
        return (
          <div
            key={index}
            onClick={() => toggleCheck(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCheck(index);
              }
            }}
            role="button"
            tabIndex={0}
            className={`check-item ${isChecked ? "checked" : ""}`}
            style={{
              padding: "0.85rem 0",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              outline: "none",
            }}
          >
            <div className="checkbox"></div>
            <div className="check-text" style={{ cursor: "pointer" }}>
              {type === "instructions" && (
                <span
                  style={{
                    fontWeight: 700,
                    color: isChecked ? "var(--color-text-muted)" : "var(--color-brand-gold)",
                    marginLeft: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  الخطوة {index + 1}:
                </span>
              )}
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
}
