'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const GeneratorContext = createContext();

export function GeneratorProvider({ children }) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorData, setGeneratorData] = useState(null);
  
  const openGenerator = useCallback((data = null) => {
    if (data) {
      setGeneratorData(data);
    }
    setShowGenerator(true);
  }, []);
  
  const closeGenerator = useCallback(() => {
    setShowGenerator(false);
    // Clear data after a small delay to allow for animations
    const timer = setTimeout(() => {
      setGeneratorData(null);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <GeneratorContext.Provider 
      value={{ 
        showGenerator, 
        generatorData,
        openGenerator,
        closeGenerator 
      }}
    >
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const context = useContext(GeneratorContext);
  if (!context) {
    throw new Error('useGenerator must be used within a GeneratorProvider');
  }
  return context;
}
