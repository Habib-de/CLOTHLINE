// components/SwipeWrapper.jsx
import React, { useRef, useState, useEffect } from 'react';

export const SwipeWrapper = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  currentView,
  totalViews,
  viewIndex,
  isTransitioning = false
}) => {
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const minSwipeDistance = 30;
  const maxSwipeDistance = 120;

  useEffect(() => {
    if (!isSwiping) {
      setSwipeOffset(0);
    }
  }, [currentView, isSwiping]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsSwiping(true);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    touchCurrentX.current = e.touches[0].clientX;
    let offset = touchStartX.current - touchCurrentX.current;
    
    const maxOffset = maxSwipeDistance;
    offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    
    if (offset > 0 && viewIndex >= totalViews - 1) {
      offset = offset * 0.2;
    } else if (offset < 0 && viewIndex <= 0) {
      offset = offset * 0.2;
    }
    
    setSwipeOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const distance = touchStartX.current - touchCurrentX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    setSwipeOffset(0);

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  const getTransform = () => {
    if (isSwiping) {
      return `translateX(${-swipeOffset}px)`;
    }
    return 'translateX(0px)';
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="page-transition-container"
      style={{ 
        touchAction: 'pan-y',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          transform: getTransform(),
          transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};