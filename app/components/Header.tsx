import Link from 'next/link';
import { GovSignature } from './GovSignature';
import { SearchBar } from './SearchBar';
import { SiteNav } from './SiteNav';
import { Breadcrumbs } from './Breadcrumbs';

export function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Top bar: Skip link + Language toggle */}
      <div className="bg-gray-50 px-6 py-2 flex items-center justify-between border-b border-gray-200">
        {/* Skip to main content link - visible on focus */}
        <Link
          href="#main-content"
          className="absolute top-0 left-0 -translate-y-full focus:translate-y-0 focus:relative bg-[#0535D2] text-white px-3 py-2 rounded text-sm font-medium transition-transform"
        >
          Skip to main content
        </Link>

        {/* Language toggle - right aligned */}
        <div className="ml-auto">
          <Link
            href="/?lang=fr"
            className="text-[#1F4978] hover:text-[#0f2847] transition-colors text-sm font-medium"
          >
            Français
          </Link>
        </div>
      </div>

      {/* Signature section */}
      <div className="bg-white px-6 py-3 border-b border-gray-200">
        <GovSignature />
      </div>

      {/* Navigation */}
      <SiteNav />

      {/* Breadcrumbs */}
      <Breadcrumbs />
    </header>
  );
}
