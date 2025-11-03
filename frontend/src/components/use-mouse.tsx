// Client-side component marker for Next.js
'use client';
// Import React hooks for refs, layout effects, and state
import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

// Interface defining mouse state structure
interface MouseState {
  x: number | null; // Global mouse X position (from page start)
  y: number | null; // Global mouse Y position (from page start)
  elementX: number | null; // Relative mouse X position within element
  elementY: number | null; // Relative mouse Y position within element
  elementPositionX: number | null; // Element's absolute X position on page
  elementPositionY: number | null; // Element's absolute Y position on page
}

// Custom React hook to track mouse position globally and relative to element
export function useMouse(): [MouseState, RefObject<HTMLDivElement>] { // Returns [mouse state, ref to attach to element]
  const [state, setState] = useState<MouseState>({ // Initialize mouse state with all null values
    x: null, // Global X position
    y: null, // Global Y position
    elementX: null, // Element-relative X position
    elementY: null, // Element-relative Y position
    elementPositionX: null, // Element absolute X position
    elementPositionY: null, // Element absolute Y position
  });

  const ref = useRef<HTMLDivElement | null>(null); // Create ref to attach to DOM element

  useLayoutEffect(() => { // Execute after DOM mutation but before paint
    const handleMouseMove = (event: MouseEvent) => { // Mouse move event handler
      const newState: Partial<MouseState> = { // Partial state to update
        x: event.pageX, // Global X coordinate (includes scroll)
        y: event.pageY, // Global Y coordinate (includes scroll)
      };

      if (ref.current instanceof Element) { // Check if ref points to valid element
        const { left, top } = ref.current.getBoundingClientRect(); // Get element position relative to viewport
        const elementPositionX = left + window.scrollX; // Calculate absolute X position including scroll
        const elementPositionY = top + window.scrollY; // Calculate absolute Y position including scroll
        const elementX = event.pageX - elementPositionX; // Calculate relative X within element
        const elementY = event.pageY - elementPositionY; // Calculate relative Y within element

        newState.elementX = elementX; // Update relative X position
        newState.elementY = elementY; // Update relative Y position
        newState.elementPositionX = elementPositionX; // Update element absolute X
        newState.elementPositionY = elementPositionY; // Update element absolute Y
      }

      setState((s) => ({ // Update state with new values
        ...s, // Spread existing state
        ...newState, // Overwrite with new values
      }));
    };

    document.addEventListener('mousemove', handleMouseMove); // Register global mouse move listener

    return () => { // Cleanup function
      document.removeEventListener('mousemove', handleMouseMove); // Remove event listener on unmount
    };
  }, []); // Empty dependency array means run only on mount/unmount

  return [state, ref]; // Return current mouse state and ref
}