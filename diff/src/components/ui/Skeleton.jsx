export function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

Skeleton.Text = function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
};

Skeleton.Avatar = function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  
  return (
    <Skeleton className={`rounded-full ${sizeClasses[size]} ${className}`} />
  );
};

Skeleton.Card = function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-lol-dark-100 rounded-xl p-4 shadow-md ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton.Avatar />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton.Text lines={3} />
    </div>
  );
};

Skeleton.MatchItem = function SkeletonMatchItem({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-lol-dark-100 rounded-lg p-4 mb-3 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-16 rounded" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded" />
        ))}
      </div>
    </div>
  );
};
