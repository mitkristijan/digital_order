'use client';

import { Card, CardHeader, CardTitle, CardContent, Button } from '@digital-order/ui';
import { useEffect, useState } from 'react';

export default function KitchenDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Kitchen Display System</h1>
          <div className="text-2xl font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-600 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">Pending</h2>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-blue-600 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">Preparing</h2>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-green-600 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">Ready</h2>
            <p className="text-4xl font-bold">0</p>
          </div>
        </div>

        <div className="text-center py-20">
          <p className="text-xl text-gray-400">No active orders</p>
          <p className="text-gray-500 mt-2">New orders will appear here in real-time</p>
        </div>
      </div>
    </main>
  );
}
