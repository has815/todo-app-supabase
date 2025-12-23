'use client';

import React from 'react';
import { LogOut, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';  // ✅ Fixed

const supabase = createClient();

interface NavbarProps {
  user: {
    email: string;
    picture: string;
    name: string;
    job: string;
  } | null;
  onLogout: () => void;
}

function Navbar({ user, onLogout }: NavbarProps) {
  if (!user) return null;

  return (
    <nav className="bg-gray-800/50 backdrop-blur-lg border-b border-purple-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Todo App
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-purple-300">{user.job}</p>
            </div>
            
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-lg shadow-purple-500/30"
            />
            
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;