import type { FilterType } from './types'

interface FilterPillsProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const filters: { value: FilterType; label: string; urgent?: boolean }[] = [
  { value: 'all', label: 'All' },
  { value: 'nanny_share', label: 'Nanny Share' },
  { value: 'care_share', label: 'Care Share' },
  { value: 'care_now', label: 'Care Now', urgent: true },
]

export default function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`
            px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all
            ${activeFilter === filter.value
              ? filter.urgent 
                ? 'bg-urgent text-white'
                : 'bg-primary text-white'
              : filter.urgent
                ? 'bg-urgent/10 text-urgent hover:bg-urgent/20'
                : 'bg-cream text-text-secondary hover:bg-mint hover:text-text-primary'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}