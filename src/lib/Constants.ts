// Time slots for schedule grid
export const TIME_SLOTS = [
  { id: 'early', label: 'Early', time: '6-9am' },
  { id: 'morning', label: 'Morning', time: '9am-12pm' },
  { id: 'afternoon', label: 'Afternoon', time: '12-3pm' },
  { id: 'late_pm', label: 'Late PM', time: '3-6pm' },
  { id: 'evening', label: 'Evening', time: '6-9pm' },
] as const

export const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Monday', short: 'Mon', letter: 'M' },
  { id: 'tue', label: 'Tuesday', short: 'Tue', letter: 'T' },
  { id: 'wed', label: 'Wednesday', short: 'Wed', letter: 'W' },
  { id: 'thu', label: 'Thursday', short: 'Thu', letter: 'Th' },
  { id: 'fri', label: 'Friday', short: 'Fri', letter: 'F' },
  { id: 'sat', label: 'Saturday', short: 'Sat', letter: 'Sa' },
  { id: 'sun', label: 'Sunday', short: 'Sun', letter: 'Su' },
] as const

export const WEEKDAYS = DAYS_OF_WEEK.slice(0, 5)
export const WEEKEND = DAYS_OF_WEEK.slice(5)

// Nanny situation options
export const NANNY_SITUATION_OPTIONS = [
  { id: 'have_nanny', label: 'I have a nanny to share', description: 'Looking for families to join our nanny share' },
  { id: 'seeking_share', label: 'Looking to join a share', description: 'Seeking an existing nanny share to join' },
  { id: 'finding_together', label: 'Find a nanny together', description: 'Want to find and hire a nanny with another family' },
  { id: 'exploring', label: 'Just exploring', description: 'Learning about options' },
] as const

// What they're looking for
export const LOOKING_FOR_OPTIONS = [
  { id: 'nannyshare', label: 'Nanny Share' },
  { id: 'babysitter', label: 'Babysitter Swap' },
  { id: 'backup_care', label: 'Backup Care' },
  { id: 'playdate', label: 'Playdates' },
  { id: 'carpool', label: 'Carpools' },
] as const

// Open to options
export const OPEN_TO_OPTIONS = [
  { id: 'hosting', label: 'Hosting at my home' },
  { id: 'traveling', label: 'Traveling to their home' },
  { id: 'rotating', label: 'Rotating homes' },
  { id: 'splitting_nanny', label: 'Splitting nanny costs' },
  { id: 'occasional', label: 'Occasional help only' },
] as const

// Timeline options
export const TIMELINE_OPTIONS = [
  { id: 'asap', label: 'ASAP', description: 'Need care now' },
  { id: '1_month', label: '1-2 months', description: 'Starting soon' },
  { id: '3_months', label: '3+ months', description: 'Planning ahead' },
  { id: 'exploring', label: 'Just exploring', description: 'No rush' },
] as const

// Parenting Values
export const PARENTING_VALUES = [
  { id: 'gentle', label: 'Gentle Parenting' },
  { id: 'montessori', label: 'Montessori' },
  { id: 'structured', label: 'Structured/Routine' },
  { id: 'flexible', label: 'Go with the Flow' },
  { id: 'outdoorsy', label: 'Outdoorsy' },
  { id: 'screen_free', label: 'Low Screen Time' },
  { id: 'conscious', label: 'Conscious Discipline' },
  { id: 'rie', label: 'RIE / Respectful' },
] as const

// Pet options
export const PET_OPTIONS = [
  { id: 'dog', label: 'Dog' },
  { id: 'cat', label: 'Cat' },
  { id: 'other', label: 'Other pet' },
  { id: 'none', label: 'No pets' },
] as const

// Common allergies
export const COMMON_ALLERGIES = [
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'tree_nuts', label: 'Tree nuts' },
  { id: 'dairy', label: 'Milk/Dairy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'wheat', label: 'Wheat/Gluten' },
  { id: 'soy', label: 'Soy' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'sesame', label: 'Sesame' },
] as const

// Gender options for kids
export const GENDER_OPTIONS = [
  { id: 'girl', label: 'Girl' },
  { id: 'boy', label: 'Boy' },
  { id: 'prefer_not', label: 'Prefer not to say' },
] as const

// Helper function to calculate kid age
export function calculateKidAge(birthMonth: number, birthYear: number): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  let years = currentYear - birthYear
  let months = currentMonth - birthMonth

  if (months < 0) {
    years--
    months += 12
  }

  if (years === 0) {
    return `${months}mo`
  } else if (years < 2) {
    return months > 0 ? `${years}y ${months}mo` : `${years}y`
  } else {
    return `${years}y`
  }
}

// Helper to format schedule for display
export function formatScheduleSlot(slotId: string): string {
  const slot = TIME_SLOTS.find(s => s.id === slotId)
  return slot ? slot.time : slotId
}

// Helper to get day label
export function getDayLabel(dayId: string, format: 'full' | 'short' | 'letter' = 'short'): string {
  const day = DAYS_OF_WEEK.find(d => d.id === dayId)
  if (!day) return dayId

  switch (format) {
    case 'full': return day.label
    case 'letter': return day.letter
    default: return day.short
  }
}

// Schedule type
export type Schedule = Record<string, string[]>

// Helper to check if two schedules have overlap
export function getScheduleOverlap(
  schedule1: Schedule,
  schedule2: Schedule
): {
  overlapDays: string[]
  overlapSlots: { day: string; slots: string[] }[]
  overlapCount: number
  totalSlots1: number
  overlapPercent: number
} {
  const overlapSlots: { day: string; slots: string[] }[] = []
  const overlapDays: string[] = []
  let overlapCount = 0
  let totalSlots1 = 0

  DAYS_OF_WEEK.forEach(day => {
    const slots1 = schedule1[day.id] || []
    const slots2 = schedule2[day.id] || []
    totalSlots1 += slots1.length

    const matchingSlots = slots1.filter(slot => slots2.includes(slot))
    if (matchingSlots.length > 0) {
      overlapDays.push(day.id)
      overlapSlots.push({ day: day.id, slots: matchingSlots })
      overlapCount += matchingSlots.length
    }
  })

  const overlapPercent = totalSlots1 > 0
    ? Math.round((overlapCount / totalSlots1) * 100)
    : 0

  return { overlapDays, overlapSlots, overlapCount, totalSlots1, overlapPercent }
}

// Format overlap for display (e.g., "Tue + Thu Afternoons")
export function formatOverlapSummary(overlapSlots: { day: string; slots: string[] }[]): string {
  if (overlapSlots.length === 0) return ''

  // Group by common time slots
  const slotsByTime: Record<string, string[]> = {}

  overlapSlots.forEach(({ day, slots }) => {
    slots.forEach(slot => {
      if (!slotsByTime[slot]) slotsByTime[slot] = []
      slotsByTime[slot].push(day)
    })
  })

  // Format each group
  const parts: string[] = []
  Object.entries(slotsByTime).forEach(([slot, days]) => {
    const dayStr = days.map(d => getDayLabel(d, 'short')).join(' + ')
    const slotLabel = TIME_SLOTS.find(s => s.id === slot)?.label || slot
    parts.push(`${dayStr} ${slotLabel}`)
  })

  return parts.join(', ')
}