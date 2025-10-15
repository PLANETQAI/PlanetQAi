'use client';

import dynamic from 'next/dynamic';

const StarsWrapper = dynamic(
  () => import('@/components/canvas/StarsWrapper'),
  { ssr: false }
);

export default function StarryBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <StarsWrapper />
      <div className="absolute inset-0 bg-gray-900/70" />
    </div>
  );
}
