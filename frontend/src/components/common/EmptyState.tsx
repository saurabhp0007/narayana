import Link from 'next/link';

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

function DefaultIcon() {
  return (
    <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

/**
 * Shared empty state for cart, wishlist, orders, and search results —
 * consistent icon/heading/description/CTA layout in the neutral palette.
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <div className="text-gray-300 mb-4">{icon || <DefaultIcon />}</div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
