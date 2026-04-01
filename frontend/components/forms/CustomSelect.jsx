"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange?.(val);
    setOpen(false);
  };

  return (
    <div className={`cs-root ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`cs-trigger ${open ? "open" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`cs-label ${selected ? "" : "placeholder"}`}>
          {selected?.label || placeholder}
        </span>
        <svg className="cs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="cs-menu" role="listbox">
          {options.length === 0 ? (
            <div className="cs-empty">No options</div>
          ) : (
            options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  className={`cs-item ${active ? "active" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={active}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}

      <style jsx>{`
        .cs-root {
          position: relative;
          width: 100%;
        }
        .cs-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 9px;
          background: #0c0c0f;
          border: 1px solid #1e1e24;
          color: #f0f0f3;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: border-color .15s;
        }
        .cs-trigger:focus-visible {
          outline: none;
          border-color: #6EE7B740;
        }
        .cs-trigger:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .cs-label.placeholder {
          color: #3a3a48;
        }
        .cs-chevron {
          width: 16px;
          height: 16px;
          color: #6EE7B7;
          flex-shrink: 0;
          transition: transform .15s;
        }
        .cs-trigger.open .cs-chevron {
          transform: rotate(180deg);
        }
        .cs-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
          z-index: 50;
          max-height: 220px;
          overflow-y: auto;
        }
        .cs-item {
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #f0f0f3;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
        }
        .cs-item:hover {
          background: #17171b;
        }
        .cs-item.active {
          background: rgba(110,231,183,.12);
          color: #6EE7B7;
        }
        .cs-empty {
          padding: 8px 10px;
          color: #5c5c6e;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

