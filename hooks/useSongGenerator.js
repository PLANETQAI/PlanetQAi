"use client"

import { useState } from 'react';

export function useSongGenerator(initialData = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [songData, setSongData] = useState(initialData);

  const open = (data = null) => {
    if (data) {
      setSongData(data);
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Reset data after animation
    setTimeout(() => {
      setSongData(initialData);
    }, 300);
  };

  return {
    isOpen,
    songData,
    open,
    close,
    onOpenChange: setIsOpen
  };
}

export default useSongGenerator;