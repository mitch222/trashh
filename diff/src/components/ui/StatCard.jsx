export function StatCard({ 
  label, 
  value, 
  subValue,
  icon,
  trend,
  className = '',
  highlight = false
}) {
  return (
    <div className={`
      rounded-lg p-4 transition-all duration-200
      ${highlight 
        ? 'bg-lol-blue-500/10 border-2 border-lol-blue-500 dark:bg-lol-blue-500/20' 
        : 'bg-white dark:bg-lol-dark-100 border border-gray-100 dark:border-gray-700'
      }
      hover:shadow-md
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${highlight ? 'text-lol-blue-500' : 'text-gray-900 dark:text-white'}`}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${highlight ? 'bg-lol-blue-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`mt-2 text-sm font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}
