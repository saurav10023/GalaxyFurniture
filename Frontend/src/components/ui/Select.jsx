// components/ui/Select.jsx
//
// A dependency-free, keyboard-accessible custom dropdown to replace native
// <select> elements, which render inconsistently across browsers (Safari's
// vs Chrome's vs mobile's native picker all look and behave differently)
// and can't be styled to match the rest of the design system.
//
// Usage:
//   <Select
//     value={sort}
//     onChange={(v) => updateParams({ sort: v }, { resetPage: false })}
//     options={sortOptions}              // [{ value, label }]
//   />
//
// Supports: click-to-open, click-outside-to-close, full keyboard nav
// (ArrowUp/Down, Enter, Escape, Home/End), disabled state, and a checkmark
// on the selected option. Renders as a real <button> + <ul role="listbox">
// so it stays screen-reader friendly without a component library.
//
// Theme: Galaxy Furniture Japandi (Card surface, Line borders, Moss focus,
// near-opaque cream glass for the dropdown list).

import { useEffect, useRef, useState } from "react";

const IconChevron = ({ open }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    width="14"
    height="14"
    className={`shrink-0 text-stone transition-transform duration-150 ${open ? "rotate-180" : ""}`}
  >
    <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheck = (props) => (
  <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...props}>
    <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

let idCounter = 0;

const Select = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  fullWidth = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [instanceId] = useState(() => `select-${idCounter++}`);

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => String(o.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [open, value, options]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[activeIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  const commit = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[activeIndex]) commit(options[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : ""} ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? instanceId : undefined}
        className={`inline-flex items-center justify-between gap-2 font-sans text-sm bg-card border rounded-xl px-3.5 py-2.5 text-ink transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 ${
          fullWidth ? "w-full" : ""
        } ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-linen border-line"
            : open
            ? "border-moss ring-2 ring-moss/20"
            : "border-line hover:border-clay/60"
        }`}
      >
        <span className={`truncate ${!selected ? "text-stone/70" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevron open={open} />
      </button>

      {open && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          id={instanceId}
          className="absolute z-30 mt-1.5 min-w-full w-max max-w-[280px] max-h-64 overflow-auto bg-card/95 backdrop-blur-xl border border-line rounded-2xl shadow-[0_12px_32px_-12px_rgba(42,37,31,0.25)] p-1.5"
        >
          {options.map((opt, i) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(opt)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors duration-100 ${
                  i === activeIndex ? "bg-linen" : ""
                } ${isSelected ? "text-ink font-medium" : "text-stone"}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <IconCheck className="text-moss shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;