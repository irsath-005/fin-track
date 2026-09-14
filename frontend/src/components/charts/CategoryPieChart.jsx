import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { CATEGORY_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_COLORS = [
  '#F97316', '#EC4899', '#8B5CF6', '#3B82F6', '#EAB308',
  '#06B6D4', '#10B981', '#EF4444', '#6366F1', '#14B8A6'
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.fill }}></span>
          <span>{data.name}</span>
        </p>
        <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mt-1">
          {formatCurrency(data.value)}
        </p>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          {data.payload.percentage ? `${data.payload.percentage}% of total` : ''}
        </p>
      </div>
    );
  }
  return null;
};

const CategoryPieChart = ({ data = [], height = 300, nameKey = "category", valueKey = "amount" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
        No category breakdown available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => {
              const catName = entry[nameKey];
              const color = CATEGORY_COLORS[catName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
              return <Cell key={`cell-${index}`} fill={color} stroke="transparent" />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;
