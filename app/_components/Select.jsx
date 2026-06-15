"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown01Icon } from "./icons";

/**
 * Design-system select. The menu is rendered in a portal (fixed-positioned)
 * so it floats above all content, is never clipped by a form/modal, and
 * flips upward when there isn't room below.
 *
 *   <Select label="Role" value={v} onChange={setV} options={[{value,label}]} />
 */
export default function Select({
  label,
  required = false,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const count = options.length || 1;
    const menuH = Math.min(260, count * 40 + 8);
    const spaceBelow = vh - r.bottom;
    const spaceAbove = r.top;
    // Open upward if there isn't room below, or the field sits in the lower
    // part of the screen (avoids covering buttons that follow it).
    const openUp = (spaceBelow < menuH + 24 || r.top > vh * 0.55) && spaceAbove > menuH + 24;
    const left = Math.max(8, Math.min(r.left, vw - r.width - 8));
    setCoords({
      left,
      width: r.width,
      top: r.bottom + 4,
      bottom: vh - r.top + 4,
      openUp,
      maxHeight: Math.max(140, (openUp ? spaceAbove : spaceBelow) - 16),
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    place();
    const reflow = () => place();
    function onDoc(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("scroll", reflow, true);
    window.addEventListener("resize", reflow);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", reflow, true);
      window.removeEventListener("resize", reflow);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  const menu =
    open && coords && mounted
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              ...(coords.openUp ? { bottom: coords.bottom } : { top: coords.top }),
            }}
            className="z-[80] overflow-auto rounded-md border border-cloud bg-paper py-1 shadow-[rgba(26,26,26,0.12)_0px_8px_24px]"
          >
            {options.length === 0 ? (
              <li className="px-3.5 py-2 text-sm text-slate">No options</li>
            ) : (
              options.map((o) => {
                const active = o.value === value;
                return (
                  <li key={o.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={`block w-full px-3.5 py-2 text-left text-sm transition-colors ${
                        active ? "bg-mist font-medium text-ink" : "text-graphite hover:bg-mist hover:text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body
        )
      : null;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-graphite">
          {label}
          {required && <span className="text-slate"> *</span>}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-sm border px-3.5 py-2.5 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? "border-ink bg-paper" : "border-cloud bg-mist hover:border-graphite"
        }`}
      >
        <span className={selected ? "truncate text-ink" : "truncate text-slate"}>
          {selected ? selected.label : placeholder}
        </span>
        <ArrowDown01Icon
          size={16}
          className={`shrink-0 text-slate transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </div>
  );
}
