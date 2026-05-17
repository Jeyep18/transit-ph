"use client";
import { useState, useCallback, useRef } from "react";

export type SheetState = "collapsed" | "peek" | "expanded";

/**
 * Hook to manage slide-up bottom sheet animation state.
 *
 * States:
 * - collapsed: fully hidden below the viewport
 * - peek: partially visible (shows header/summary)
 * - expanded: fully open (shows all content)
 */
export function useBottomSheet(initialState: SheetState = "collapsed") {
  const [state, setState] = useState<SheetState>(initialState);
  const touchStartY = useRef(0);

  const collapse = useCallback(() => setState("collapsed"), []);
  const peek = useCallback(() => setState("peek"), []);
  const expand = useCallback(() => setState("expanded"), []);

  const toggle = useCallback(() => {
    setState((prev) => {
      if (prev === "collapsed") return "peek";
      if (prev === "peek") return "expanded";
      return "collapsed";
    });
  }, []);

  /** Open to peek if collapsed, expand if already peeking */
  const open = useCallback(() => {
    setState((prev) => (prev === "collapsed" ? "peek" : "expanded"));
  }, []);

  /** Handle swipe-down gesture to collapse */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        // Swipe down
        setState((prev) => {
          if (prev === "expanded") return "peek";
          return "collapsed";
        });
      } else if (deltaY < -60) {
        // Swipe up
        setState((prev) => {
          if (prev === "collapsed") return "peek";
          return "expanded";
        });
      }
    },
    [],
  );

  const isOpen = state !== "collapsed";
  const isExpanded = state === "expanded";
  const isPeeking = state === "peek";

  return {
    state,
    isOpen,
    isExpanded,
    isPeeking,
    collapse,
    peek,
    expand,
    toggle,
    open,
    handleTouchStart,
    handleTouchEnd,
  };
}
