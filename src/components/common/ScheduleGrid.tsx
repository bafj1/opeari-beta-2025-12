import { useState } from 'react'
import { TIME_SLOTS, WEEKDAYS, WEEKEND } from '../../lib/Constants'

// Color constants
const COLORS = {
  coral: '#F8C3B3',
  coralHover: '#f5b5a3',
  mint: '#d8f5e5',
  mintDark: '#8bd7c7',
  cream: '#fffaf5',
  primary: '#1e6b4e',
  textMuted: '#4A6163',
  border: '#8bd7c7',
}

interface ScheduleGridProps {
  schedule: Record<string, string[]>
  onChange: (schedule: Record<string, string[]>) => void
  flexible?: boolean
  onFlexibleChange?: (flexible: boolean) => void
  showWeekend?: boolean
  compact?: boolean
}

export default function ScheduleGrid({
  schedule,
  onChange,
  flexible = false,
  onFlexibleChange,
  showWeekend: initialShowWeekend = false,

}: ScheduleGridProps) {
  const [showWeekend, setShowWeekend] = useState(initialShowWeekend)

  const days = showWeekend ? [...WEEKDAYS, ...WEEKEND] : WEEKDAYS

  const toggleSlot = (dayId: string, slotId: string) => {
    const currentSlots = schedule[dayId] || []
    const newSlots = currentSlots.includes(slotId)
      ? currentSlots.filter(s => s !== slotId)
      : [...currentSlots, slotId]

    const newSchedule = {
      ...schedule,
      [dayId]: newSlots,
    }

    onChange(newSchedule)
  }

  const isSelected = (dayId: string, slotId: string) => {
    return (schedule[dayId] || []).includes(slotId)
  }

  const quickFillWeekdays = (slotId: string) => {
    const newSchedule = { ...schedule }
    WEEKDAYS.forEach(day => {
      const currentSlots = newSchedule[day.id] || []
      if (!currentSlots.includes(slotId)) {
        newSchedule[day.id] = [...currentSlots, slotId]
      }
    })
    onChange(newSchedule)
  }

  const clearAll = () => {
    onChange({})
  }

  const hasAnySelection = Object.values(schedule).some(slots => slots && slots.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <p style={{ fontSize: '14px', color: COLORS.textMuted }}>Tap the times you need care</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasAnySelection && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontSize: '12px',
                color: COLORS.textMuted,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowWeekend(!showWeekend)}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: showWeekend ? COLORS.coral : COLORS.cream,
              color: showWeekend ? 'white' : COLORS.textMuted,
            }}
          >
            {showWeekend ? 'Hide Weekend' : '+ Weekend'}
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          minWidth: '500px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: COLORS.cream,
        }}>
          {/* Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: showWeekend ? 'repeat(8, 1fr)' : 'repeat(6, 1fr)',
            backgroundColor: COLORS.mint,
          }}>
            <div style={{ padding: '12px' }}></div>
            {days.map(day => (
              <div
                key={day.id}
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: COLORS.primary,
                  fontSize: '14px',
                }}
              >
                {day.short}
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          {TIME_SLOTS.map(slot => (
            <div
              key={slot.id}
              style={{
                display: 'grid',
                gridTemplateColumns: showWeekend ? 'repeat(8, 1fr)' : 'repeat(6, 1fr)',
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              {/* Time Label */}
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: COLORS.primary }}>{slot.label}</span>
                <span style={{ fontSize: '11px', color: COLORS.textMuted }}>{slot.time}</span>
              </div>

              {/* Day Cells */}
              {days.map(day => {
                const selected = isSelected(day.id, slot.id)
                return (
                  <div key={`${day.id}-${slot.id}`} style={{ padding: '4px' }}>
                    <button
                      type="button"
                      onClick={() => toggleSlot(day.id, slot.id)}
                      style={{
                        width: '100%',
                        height: '36px',
                        borderRadius: '8px',
                        border: selected ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        backgroundColor: selected ? COLORS.mintDark : 'white',
                        color: selected ? COLORS.primary : COLORS.primary,
                        fontWeight: selected ? 'bold' : 'normal',
                      }}
                      aria-label={`${day.label} ${slot.label}`}
                    >
                      {selected && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Fill Row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '8px',
        borderTop: `1px solid ${COLORS.border}50`,
      }}>
        <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Quick fill weekdays:</span>
        {TIME_SLOTS.slice(0, 4).map(slot => (
          <button
            key={slot.id}
            type="button"
            onClick={() => quickFillWeekdays(slot.id)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: `${COLORS.mint}80`,
              color: COLORS.primary,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            All {slot.label}
          </button>
        ))}
      </div>

      {/* Flexible Schedule Toggle */}
      {onFlexibleChange && (
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          backgroundColor: COLORS.cream,
          borderRadius: '12px',
          cursor: 'pointer',
          border: `1px solid ${COLORS.border}`,
        }}>
          <input
            type="checkbox"
            checked={flexible}
            onChange={(e) => onFlexibleChange(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              accentColor: COLORS.coral,
              cursor: 'pointer',
            }}
          />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: COLORS.primary }}>My schedule changes</span>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
              I'll work out specifics with matches (shift work, rotating schedules, etc.)
            </p>
          </div>
        </label>
      )}
    </div>
  )
}

// Compact version for displaying schedule (read-only)
export function ScheduleDisplay({
  schedule,
  highlightOverlap,
  compact = false,
}: {
  schedule: Record<string, string[]>
  highlightOverlap?: Record<string, string[]>
  compact?: boolean
}) {
  if (compact) {
    // Mini version for match cards
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {WEEKDAYS.map(day => {
          const slots = schedule[day.id] || []
          const overlapSlots = highlightOverlap?.[day.id] || []
          const hasSlots = slots.length > 0
          const hasOverlap = overlapSlots.length > 0

          return (
            <div
              key={day.id}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: hasOverlap ? COLORS.coral : hasSlots ? COLORS.mintDark : '#f5f5f5',
                color: hasOverlap ? 'white' : hasSlots ? COLORS.primary : COLORS.textMuted,
              }}
              title={hasOverlap ? 'Schedule match!' : hasSlots ? 'They need care' : 'No care needed'}
            >
              {day.letter}
              {hasOverlap && (
                <svg style={{ width: '12px', height: '12px', margin: '2px auto 0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Detailed version
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', fontSize: '12px' }}>
        <div></div>
        {WEEKDAYS.map(day => (
          <div key={day.id} style={{ textAlign: 'center', fontWeight: 500, color: COLORS.textMuted }}>{day.letter}</div>
        ))}
      </div>

      {/* Rows */}
      {TIME_SLOTS.map(slot => {
        const hasAnyForSlot = WEEKDAYS.some(day => (schedule[day.id] || []).includes(slot.id))
        if (!hasAnyForSlot) return null

        return (
          <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px' }}>
            <div style={{ fontSize: '12px', color: COLORS.textMuted, paddingRight: '4px', display: 'flex', alignItems: 'center' }}>{slot.time}</div>
            {WEEKDAYS.map(day => {
              const hasSlot = (schedule[day.id] || []).includes(slot.id)
              const hasOverlap = (highlightOverlap?.[day.id] || []).includes(slot.id)

              return (
                <div
                  key={`${day.id}-${slot.id}`}
                  style={{
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: hasOverlap ? COLORS.coral : hasSlot ? COLORS.mint : '#f5f5f5',
                  }}
                />
              )
            })}
          </div>
        )
      })}

      {/* Legend */}
      {highlightOverlap && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', paddingTop: '8px', fontSize: '12px', color: COLORS.textMuted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: COLORS.coral, borderRadius: '4px' }}></span>
            Match
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: COLORS.mint, borderRadius: '4px' }}></span>
            They need
          </span>
        </div>
      )}
    </div>
  )
}