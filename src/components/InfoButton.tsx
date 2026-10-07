'use client';

import { useState } from 'react';

interface InfoButtonProps {
  text: string;
}

export default function InfoButton({ text }: InfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        aria-expanded={open}
        aria-controls="info-panel"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        {open ? 'Hide' : 'Why we ask'}
      </button>
      {open && (
        <div
          id="info-panel"
          className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 leading-relaxed"
          role="region"
          aria-label="Why we ask this question"
        >
          {text}
        </div>
      )}
    </div>
  );
}