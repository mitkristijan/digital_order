'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrdersByHourChartProps {
  data: Array<{
    hour: number;
    orderCount: number;
  }>;
}

export const OrdersByHourChart: React.FC<OrdersByHourChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Hour (Today)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            labelFormatter={(hour) => `${hour}:00`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="orderCount" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
