export type FilterType = 'all' | 'nanny_share' | 'care_share' | 'care_now'

export interface Match {
  id: string
  family: {
    id: string
    name: string
    neighborhood: string
    distance_miles: number
    bio: string
    looking_for: string[]
    nanny_share_experience: string
  }
  kids: {
    id: string
    name: string
    age: number
    interests: string[]
  }[]
  compatibility_reasons: string[]
  mutual_connections: {
    family_id: string
    family_name: string
  }[]
  is_available_now: boolean
  is_new: boolean
  is_best_match: boolean
  connection_status?: string | null
  connection_initiated_by_me?: boolean
}