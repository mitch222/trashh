/**
 * Blue / red / both, mirroring the blue-vs-red framing of the existing
 * "Comparación de Supports" card.
 */
export function SupportToggle({ value, onChange, blueName, redName }) {
  const options = [
    { id: 'blue', label: blueName ? `Azul (${blueName})` : 'Azul' },
    { id: 'red', label: redName ? `Rojo (${redName})` : 'Rojo' },
    { id: 'both', label: 'Ambos' },
  ];

  return (
    <div role="group" aria-label="Support a mostrar" className="flex gap-2 flex-wrap">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
            ${value === option.id
              ? 'bg-lol-blue-500 text-white'
              : 'bg-white dark:bg-lol-dark-100 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
