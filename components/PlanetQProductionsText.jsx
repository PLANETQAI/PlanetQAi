'use client';

import React from 'react';


const PlanetQProductionsText = () => {
  return (
    <div className="relative flex flex-col items-center justify-center pb-4">
      <div className="relative">
        {/* Background gradient/texture can be added here if needed */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src="/images/intro/q_prod_text.svg" 
              alt="Planet Q" 
              className="h-24 md:h-24 lg:h-24 w-auto"
              style={{ fontFamily: 'var(--font-cursive)' }}
            />
          </div>
          <div className="relative">
            <img 
              src="/images/intro/q_studio.png" 
              alt="Productions" 
              className="h-16 md:h-20 lg:h-20 w-auto"
              style={{ fontFamily: 'var(--font-cursive)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetQProductionsText;
