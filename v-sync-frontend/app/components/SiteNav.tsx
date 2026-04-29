'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Saved Queries', href: '/saved-queries' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav role="navigation" className="bg-white border-b border-gray-200">
      <div className="px-6 py-0 flex items-center gap-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-0 py-3 mr-6 transition-colors ${
                isActive
                  ? 'font-bold text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
