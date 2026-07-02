"use client";

/**
 * Reveal — scroll-triggered entrance animation for /owl pages.
 *
 * Uses IntersectionObserver to detect when an element enters the viewport,
 * then transitions it from the hidden state (opacity:0, translateY:12px)
 * to the visible state. Supports staggered delays via `delayIndex`.
 *
 * Design constraints:
 * - Never uses window.addEventListener('scroll')
 * - Respects prefers-reduced-motion: if reduced motion is preferred the
 *   element is rendered immediately in its final visible state with no
 *   transition or transform (achieved via the CSS .owl-reveal-visible class
 *   being applied synchronously on mount instead of after observation).
 * - Content is server-rendered; the client component only attaches the
 *   observer. SSR output is the element with class owl-reveal — hidden by CSS
 *   only when the .owl-js class is present on .owl-page (added pre-paint by an
 *   inline script in app/owl/layout.tsx), so content stays visible without JS.
 */

import React, { useEffect, useRef, ElementType, ComponentPropsWithoutRef } from "react";

type RevealOwnProps<E extends ElementType> = {
  /** Render as this HTML element or component. Default: "div". */
  as?: E;
  /** Additional class names applied to the wrapper. */
  className?: string;
  /** Additional inline styles applied to the wrapper. */
  style?: React.CSSProperties;
  /**
   * Zero-based index used to compute the stagger delay.
   * delay = delayIndex * 80ms (via --index CSS custom property).
   * Omit or pass 0 for no stagger.
   */
  delayIndex?: number;
  children: React.ReactNode;
};

type RevealProps<E extends ElementType> = RevealOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof RevealOwnProps<E>>;

/**
 * Easing and duration match the spec:
 * duration 600ms, cubic-bezier(0.16, 1, 0.3, 1) — defined in globals.css.
 * The delay comes from --index on the element.
 */
export default function Reveal<E extends ElementType = "div">({
  as,
  className,
  style,
  delayIndex,
  children,
  ...rest
}: RevealProps<E>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the user prefers reduced motion, skip animation: mark visible
    // immediately so the element shows without delay or transform.
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      el.classList.add("owl-reveal-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("owl-reveal-visible");
            // Once revealed, stop observing — no need to re-trigger.
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Trigger when at least 8% of the element is visible.
        threshold: 0.08,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const inlineStyle: React.CSSProperties = {
    ...style,
    ...(delayIndex !== undefined && delayIndex > 0
      ? ({ "--index": delayIndex } as React.CSSProperties)
      : {}),
  };

  return (
    <Tag
      ref={ref}
      className={`owl-reveal${className ? ` ${className}` : ""}`}
      style={inlineStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
}
