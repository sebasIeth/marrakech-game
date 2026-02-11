'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function Card({ className, style, children }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-md p-6', className)} style={style}>
      {children}
    </div>
  );
}
