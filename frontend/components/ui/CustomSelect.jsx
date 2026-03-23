"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  emptyLabel = "No options available",
  disabled = false,
  error = false,
  getValue,
  getLabel,
  getSubLabel,
  className = "",
  menuClassName = "",
  itemClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const valueFn = getValue || ((opt) => opt?.value ?? opt?.id ?? opt);
  const labelFn = getLabel || ((opt) => opt?.label ?? opt?.name ?? String(opt));

  const selected = options.find(
    (opt) => String(valueFn(opt)) === String(value)
  );
  const displayValue = selected ? labelFn(selected) : placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div className={`custom-dropdown ${className}`} ref={wrapperRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""} ${
          error ? "error" : ""
        } ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span
          className={`custom-dropdown-value ${
            selected ? "" : "placeholder"
          }`}
        >
          {displayValue}
        </span>
        <svg
          className={`custom-dropdown-arrow ${open ? "open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div className={`custom-dropdown-menu ${menuClassName}`}>
          {options.length > 0 ? (
            options.map((opt) => {
              const optValue = valueFn(opt);
              const isSelected = String(optValue) === String(value);
              const subLabel = getSubLabel ? getSubLabel(opt) : "";

              return (
                <div
                  key={String(optValue)}
                  className={`custom-dropdown-item ${
                    isSelected ? "selected" : ""
                  } ${itemClassName}`}
                  onClick={() => {
                    onChange?.(optValue, opt);
                    setOpen(false);
                  }}
                >
                  <div className="custom-dropdown-item-content">
                    <span>{labelFn(opt)}</span>
                    {subLabel ? (
                      <span className="custom-dropdown-sub">{subLabel}</span>
                    ) : null}
                  </div>
                  {isSelected && (
                    <svg
                      className="custom-dropdown-check"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })
          ) : (
            <div className="custom-dropdown-empty">{emptyLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
