import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../common/Card.jsx';

const QueueChart = ({ data = [] }) => {
  return (
    <Card title="Traffic Volume Today" subtitle="Hourly breakdown of tickets registered">
      <div style={{ width: '100%', height: 300 }}>
        {data.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
            No traffic recorded today.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary-light)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-primary-light)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="hour" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="tickets" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTickets)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default QueueChart;
