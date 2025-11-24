'use client';

import { Search } from 'lucide-react';

interface SearchInputProps {
  /** Current value of the input */
  value: string;
  /** Callback triggered when the input value changes */
  onChange: (value: string) => void;
  /** Placeholder text displayed when input is empty */
  placeholder?: string;
}

/**
 * SearchInput
 * -----------
 * Renders a styled search input with a left icon.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
}: SearchInputProps) {
  return (
    <div className="relative">
      {/* Search Icon */}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full bg-zinc-800/50 border border-zinc-700 rounded-full
          pl-12 pr-4 py-3
          text-white text-sm placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40
          transition-all
        "
      />
    </div>
  );
}
