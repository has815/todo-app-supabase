"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Check } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUser(user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const getAvatarContent = () => {
    if (user?.user_metadata?.avatar_url) {
      return (
        <img
          src={user.user_metadata.avatar_url}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border-2 border-purple-400"
        />
      );
    }
    
    const initial = profile?.full_name?.[0] || user?.email?.[0] || "U";
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg border-2 border-purple-400">
        {initial.toUpperCase()}
      </div>
    );
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-900/60 backdrop-blur-xl border-b border-purple-500/30 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
              <Check className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Todo App
            </h1>
          </div>
          
          {/* Profile + Logout */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-white truncate max-w-[180px]">
                {profile?.full_name || user?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-xs text-purple-300 truncate max-w-[180px]">
                {profile?.job_title || "User"}
              </p>
            </div>
            
            {getAvatarContent()}
            
            <button
              onClick={handleSignOut}
              className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all"
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