'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Show banner if permission not granted
      if (Notification.permission === 'default') {
        setTimeout(() => setShowBanner(true), 3000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowBanner(false);
      
      if (result === 'granted') {
        new Notification('🎉 Notifications Enabled!', {
          body: 'You will receive reminders 1 hour before tasks are due.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (permission === 'granted' && !showBanner) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
        <BellOff className="w-5 h-5 text-red-400" />
        <div className="flex-1">
          <p className="text-red-200 text-sm font-medium">Notifications Blocked</p>
          <p className="text-red-300 text-xs">Enable in browser settings to receive reminders</p>
        </div>
      </div>
    );
  }

  return showBanner ? (
    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-lg p-4 mb-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-purple-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">🔔 Enable Notifications</h3>
          <p className="text-gray-300 text-sm mb-3">
            Get reminders <strong>1 hour before</strong> tasks are due + daily email digest on Gmail!
          </p>
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition"
            >
              Enable Notifications
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  ) : null;
}