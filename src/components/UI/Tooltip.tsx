import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  maxWidth?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, maxWidth = 'max-w-xs', position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = triggerRect.left + triggerRect.width / 2;
      let y = triggerRect.top;

      // Ajustar posição horizontal se sair da tela
      if (x + tooltipRect.width / 2 > viewportWidth - 10) {
        x = viewportWidth - tooltipRect.width / 2 - 10;
      }
      if (x - tooltipRect.width / 2 < 10) {
        x = tooltipRect.width / 2 + 10;
      }

      // Ajustar posição vertical
      if (position === 'top') {
        y = triggerRect.top - tooltipRect.height - 8;
        if (y < 10) {
          y = triggerRect.bottom + 8;
        }
      } else {
        y = triggerRect.bottom + 8;
        if (y + tooltipRect.height > viewportHeight - 10) {
          y = triggerRect.top - tooltipRect.height - 8;
        }
      }

      setTooltipPosition({ x, y });
    }
  }, [isVisible, position]);

  if (!content || content.trim() === '') {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="relative inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg ${maxWidth} pointer-events-none transition-opacity duration-200`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="relative">
            {content}
            <div
              className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
              style={{
                left: '50%',
                bottom: '-4px',
                marginLeft: '-4px',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}