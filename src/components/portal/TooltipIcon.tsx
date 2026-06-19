"use client";

import { useState, useRef, useEffect, useId } from "react";

interface TooltipIconProps {
  text: string;
  label?: string;
}

export default function TooltipIcon({ text, label }: TooltipIconProps) {
  const [open, setOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Small grace period lets the pointer travel from the trigger onto the
  // tooltip itself, so the user can mouse over the content to read it
  // (WCAG 1.4.13 — content on hover must be "hoverable").
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const openNow = () => {
    cancelClose();
    setOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Esc dismisses without moving focus off the trigger (WCAG 1.4.13).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Clear any pending close on unmount.
  useEffect(() => () => cancelClose(), []);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          cancelClose();
          setOpen((o) => !o);
        }}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
        onFocus={openNow}
        onBlur={scheduleClose}
        aria-describedby={open ? tooltipId : undefined}
        aria-label={label ? `More info about ${label}` : "More info"}
        // The visual circle stays 16px to match the existing design, but the
        // `before:` pseudo-element extends the clickable/tappable area to a
        // 24x24 box (WCAG 2.5.8 Target Size). text-gray-700 on bg-gray-200 is
        // ~8.3:1, well above WCAG 1.4.3's 4.5:1 minimum for normal text.
        className="relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 before:content-[''] before:absolute before:inset-[-4px]"
      >
        ?
      </button>
      {open && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute z-50 left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-max min-w-[14rem] max-w-sm whitespace-normal leading-relaxed"
        >
          {text}
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px">
            <div className="border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </span>
  );
}
