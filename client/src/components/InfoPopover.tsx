import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface InfoPopoverProps {
  title?: string;
  text: string;
  align?: 'left' | 'right' | 'center';
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title = 'What is this?',
  text,
  align = 'center',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignClasses =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Info: ${title}`}
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-stone-500 hover:text-emerald-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2 w-64 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50 text-xs text-stone-700 dark:text-stone-300 animate-slide-down ${alignClasses}`}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-100 dark:border-stone-800 font-semibold text-stone-900 dark:text-stone-100">
            <span>{title}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="leading-relaxed text-stone-600 dark:text-stone-300">{text}</p>
        </div>
      )}
    </div>
  );
};
