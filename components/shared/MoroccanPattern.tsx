'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface MoroccanPatternProps {
  className?: string;
  color?: string;
}

export default function MoroccanPattern({
  className,
  color = '#C19A3E',
}: MoroccanPatternProps) {
  const patternId = React.useId();

  return (
    <svg
      className={cn('w-full h-full', className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Central 8-point star */}
          <polygon
            points="20,4 23.5,14 20,11 16.5,14"
            fill={color}
            opacity="0.25"
          />
          <polygon
            points="20,36 23.5,26 20,29 16.5,26"
            fill={color}
            opacity="0.25"
          />
          <polygon
            points="4,20 14,16.5 11,20 14,23.5"
            fill={color}
            opacity="0.25"
          />
          <polygon
            points="36,20 26,16.5 29,20 26,23.5"
            fill={color}
            opacity="0.25"
          />

          {/* Diamond at center */}
          <polygon
            points="20,12 28,20 20,28 12,20"
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            opacity="0.35"
          />

          {/* Inner diamond */}
          <polygon
            points="20,16 24,20 20,24 16,20"
            fill={color}
            opacity="0.12"
          />

          {/* Corner diamonds for tessellation */}
          <polygon
            points="0,0 4,4 0,8 -4,4"
            fill={color}
            opacity="0.15"
          />
          <polygon
            points="40,0 44,4 40,8 36,4"
            fill={color}
            opacity="0.15"
          />
          <polygon
            points="0,40 4,36 0,32 -4,36"
            fill={color}
            opacity="0.15"
          />
          <polygon
            points="40,40 44,36 40,32 36,36"
            fill={color}
            opacity="0.15"
          />

          {/* Connecting lines */}
          <line
            x1="4"  y1="4"  x2="12" y2="20"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.2"
          />
          <line
            x1="36" y1="4"  x2="28" y2="20"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.2"
          />
          <line
            x1="4"  y1="36" x2="12" y2="20"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.2"
          />
          <line
            x1="36" y1="36" x2="28" y2="20"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.2"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
