'use client';

import { useRouter } from 'next/navigation';

export function NavigationButton({ page, url, description, className = '' }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(url)}
      className={`px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${className}`}
      title={description}
    >
      {page}
    </button>
  );
}
