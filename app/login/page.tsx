'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/signin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Redirecting...</div>
    </div>
  );
}
