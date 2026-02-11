'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  color: string;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ color, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: color, color: isLightColor(color) ? '#1a1a1a' : '#ffffff' }}
    >
      {children}
    </span>
  );
}

function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return true;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
