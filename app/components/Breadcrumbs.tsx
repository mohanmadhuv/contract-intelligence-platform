import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const defaultItems: BreadcrumbItem[] = [
  { label: 'Canada.ca', href: 'https://canada.ca' },
  { label: 'Home - Government Official', href: '/' },
  { label: 'Sightline - Contract Intelligence' },
];

export function Breadcrumbs({ items = defaultItems }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className="bg-white border-t border-gray-200">
      <div className="px-6 py-3">
        <ol className="flex items-center gap-1 flex-wrap">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-[#1F4978] underline hover:text-[#0f2847] transition-colors text-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="text-gray-700 text-sm"
                >
                  {item.label}
                </span>
              )}
              {index < items.length - 1 && (
                <span className="text-gray-400 text-sm mx-1" aria-hidden="true">
                  &gt;
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
