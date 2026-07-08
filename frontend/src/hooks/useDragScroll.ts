import { useEffect, useRef } from 'react';

export function useDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
  const dragState = useRef({
    isDown: false,
    startY: 0,
    scrollTop: 0,
    lastY: 0,
    velocity: 0,
    lastTime: 0,
    animationFrameId: 0,
    hasDragged: false
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Ignore right clicks or clicks on interactive elements
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea, svg, path, [role="button"]')) {
        return;
      }

      dragState.current.isDown = true;
      dragState.current.hasDragged = false;
      dragState.current.startY = e.pageY;
      dragState.current.scrollTop = el.scrollTop;
      dragState.current.lastY = e.pageY;
      dragState.current.lastTime = Date.now();
      dragState.current.velocity = 0;

      // Cancel any ongoing momentum scroll
      if (dragState.current.animationFrameId) {
        cancelAnimationFrame(dragState.current.animationFrameId);
      }

      // Add temporary styling to prevent text selection and show grab cursor
      el.style.userSelect = 'none';
      el.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDown) return;

      const deltaY = e.pageY - dragState.current.startY;
      
      // Determine if it was a real drag (threshold of 5px)
      if (Math.abs(deltaY) > 5) {
        dragState.current.hasDragged = true;
      }

      el.scrollTop = dragState.current.scrollTop - deltaY;

      // Calculate velocity for inertia
      const now = Date.now();
      const timeElapsed = now - dragState.current.lastTime;
      if (timeElapsed > 0) {
        const currentDeltaY = e.pageY - dragState.current.lastY;
        // Exponential moving average for velocity to smooth it out
        dragState.current.velocity = (currentDeltaY / timeElapsed) * 15; // scale factor
        dragState.current.lastY = e.pageY;
        dragState.current.lastTime = now;
      }
    };

    const handleMouseUp = () => {
      if (!dragState.current.isDown) return;
      dragState.current.isDown = false;

      // Reset styling
      el.style.userSelect = '';
      el.style.cursor = '';
      document.body.style.userSelect = '';

      // Prevent click event if we actually dragged
      if (dragState.current.hasDragged) {
        const preventClick = (clickEvent: MouseEvent) => {
          clickEvent.stopImmediatePropagation();
          clickEvent.preventDefault();
          window.removeEventListener('click', preventClick, true);
        };
        window.addEventListener('click', preventClick, true);
        // Safety timeout to remove listener in case click event is not fired
        setTimeout(() => window.removeEventListener('click', preventClick, true), 100);
      }

      // Trigger momentum scroll
      let velocity = dragState.current.velocity;
      if (Math.abs(velocity) > 0.5) {
        const momentumScroll = () => {
          if (dragState.current.isDown) return; // Stop if user clicks down again
          
          el.scrollTop -= velocity;
          velocity *= 0.95; // decay factor (friction)

          if (Math.abs(velocity) > 0.1) {
            dragState.current.animationFrameId = requestAnimationFrame(momentumScroll);
          }
        };
        dragState.current.animationFrameId = requestAnimationFrame(momentumScroll);
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (dragState.current.animationFrameId) {
        cancelAnimationFrame(dragState.current.animationFrameId);
      }
    };
  }, [ref]);
}
