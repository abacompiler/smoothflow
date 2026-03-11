import React from 'react';

const colorMap = {
  '#EF4444': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  '#3B82F6': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  '#22C55E': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  '#EAB308': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  '#A855F7': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  '#EC4899': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  '#6366F1': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  '#14B8A6': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  '#F97316': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  '#06B6D4': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
};

export function getCategoryColors(hexColor) {
  return colorMap[hexColor] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
}

export default function CategoryBadge({ category, size = 'sm' }) {
  if (!category) return null;
  const colors = getCategoryColors(category.color);

  return (
    <span className={`inline-flex items-center gap-1.5 ${colors.bg} ${colors.text} ${colors.border} border rounded-full ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {category.name}
    </span>
  );
}
