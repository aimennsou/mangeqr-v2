'use client'
import { ChevronUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollThreshold = 100;

      setIsVisible(scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {isVisible && (
   <button
       className="fixed bottom-14 right-14 bg-yellow-400 z-50  border  shadow-2xl text-black px-2 py-2 rounded-sm z-100 hover:animate-pulse"
       onClick={scrollToTop}
     >
       <ChevronUp />
     </button>
     
      )}
    </>
  );
};

export default ScrollToTopButton;