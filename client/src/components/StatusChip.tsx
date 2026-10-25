import React from 'react';
import { CheckCircle2, UserCheck, ClockAlert } from 'lucide-react';
import type { BatchStatus } from '../types';

interface StatusChipProps {
  status: BatchStatus;
  claimedBy?: string | null;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, claimedBy, className = '' }) => {
  if (status === 'Available') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Available to claim</span>
      </span>
    );
  }

  if (status === 'Claimed') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800 ${className}`}
      >
        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{claimedBy ? `Claimed by ${claimedBy}` : 'Claimed'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700 ${className}`}
    >
      <ClockAlert className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Expired</span>
    </span>
  );
};
