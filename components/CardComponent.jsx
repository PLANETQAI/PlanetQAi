'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Reusable card component for the Planet Q application
 */
const CardComponent = ({ 
  title, 
  href, 
  imageUrl, 
  isVideo = false,
  onClick,
  className = "",
  children
}) => {
  // Prevent click propagation to parent elements
  const preventPropagation = (e) => {
    e.stopPropagation();
    if (onClick) onClick(e);
  };

  const content = (
    <div 
      className={cn(
        "group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all card-content",
        className
      )}
      onClick={preventPropagation}
    >
      {title && (
        <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
          <h1 className="text-xl">{title}</h1>
        </div>
      )}
      
      {children ? (
        children
      ) : (
        <div>
          {isVideo ? (
            <video 
              src={imageUrl} 
              autoPlay 
              muted 
              loop 
              className="w-full h-auto rounded-lg"
            />
          ) : (
            <Image 
              src={imageUrl} 
              width={300} 
              height={200} 
              alt={title || "Card image"} 
              className="w-full h-auto rounded-lg" 
            />
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

export default CardComponent;
