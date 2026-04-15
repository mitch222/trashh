export function Input({ 
  label, 
  error, 
  className = '', 
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 border rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:border-transparent
          placeholder-gray-400 dark:placeholder-gray-500
          ${error 
            ? 'border-red-500 focus:ring-red-400 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-300 focus:ring-lol-blue-500 dark:bg-lol-dark-200 dark:border-gray-600'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
