'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  className?: string;
  label?: string;
}

export default function Select({
  value,
  onChange,
  options,
  className,
  label,
}: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-[#5C4A1E]">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={cn(
            'w-full appearance-none rounded-lg border border-[#E8D5A3] bg-white px-4 py-2 pr-10 text-[#2D1F0B] shadow-sm transition-colors',
            'focus:border-[#C19A3E] focus:outline-none focus:ring-2 focus:ring-[#C19A3E]/30',
            'hover:border-[#C19A3E]',
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#C19A3E]">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
