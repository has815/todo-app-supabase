'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function ProfileSetupPage() {
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        router.push('/signin');
        return;
      }

      if (!session) {
        console.log('No session, redirecting to signin');
        router.push('/signin');
        return;
      }

      console.log('✅ User authenticated:', session.user.id);

      // Check if profile exists - CHANGED: using user_id
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)  // ✅ Changed to user_id
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
      }

      if (existingProfile?.full_name && existingProfile?.job_title) {
        console.log('Profile complete, redirecting to todos');
        router.push('/todos');
      } else {
        console.log('Profile incomplete or missing, showing setup form');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName.trim() || !jobTitle.trim()) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Session expired. Please sign in again.');
        router.push('/signin');
        return;
      }

      // CHANGED: using user_id instead of id
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: session.user.id,  // ✅ Changed to user_id
            full_name: fullName.trim(),
            job_title: jobTitle.trim(),
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Profile insert error:', insertError);
        setError(insertError.message || 'Failed to create profile');
        setLoading(false);
        return;
      }

      console.log('✅ Profile created:', data);

      // Redirect to todos
      router.push('/todos');
      router.refresh();
      
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-center">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Complete Your Profile
          </h2>
          <p className="text-white/80 text-center mb-8 text-sm">
            Tell us a bit about yourself
          </p>

          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition disabled:opacity-50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition disabled:opacity-50"
                placeholder="Software Developer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}