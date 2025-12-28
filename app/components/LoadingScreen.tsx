'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Todo App</h1>
        <div className="text-white/80 text-sm">Loading...</div>
      </div>
    </div>
  );
}