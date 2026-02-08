'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (7 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2.5} dot={{ fill: '#0284c7', strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
