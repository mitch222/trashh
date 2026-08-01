/**
 * Wraps a native <input type="range"> rather than reimplementing drag:
 * the native element gives keyboard arrows, Home/End, touch and screen
 * reader support for free.
 *
 * `valueLabel` is what a human should hear and see (e.g. "12:00"), while
 * `value` stays the numeric index — hence aria-valuetext.
 */
export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  valueLabel,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
          )}
          {valueLabel && (
            <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={valueLabel}
        className={`
          w-full accent-lol-blue-500 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
