'use client';

import { FormEvent } from 'react';

export function SearchBar() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: implement search functionality
    console.log('Search submitted');
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex items-center gap-0 border border-gray-300 rounded-md overflow-hidden"
    >
      <input
        type="search"
        placeholder="Search Canada.ca"
        className="flex-1 px-4 py-2 text-sm focus:outline-none"
        aria-label="Search"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
        aria-label="Search"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-700"
        >
          <circle cx="8" cy="8" r="6" />
          <path d="M12 12l4 4" />
        </svg>
      </button>
    </form>
  );
}
