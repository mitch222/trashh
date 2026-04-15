const variantClasses = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  win: 'bg-lol-win/20 text-lol-win dark:bg-lol-win/30',
  loss: 'bg-lol-loss/20 text-lol-loss dark:bg-lol-loss/30',
  blue: 'bg-lol-blue-500 text-white',
  gold: 'bg-lol-gold text-white',
  support: 'bg-purple-500 text-white',
  vision: 'bg-emerald-500 text-white',
  engage: 'bg-orange-500 text-white',
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
  gray: 'bg-gray-500 text-white',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) {
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
