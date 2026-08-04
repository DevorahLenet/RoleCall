// API shapes. Statuses/priorities/categories are stored and sent as stable ids;
// the UI resolves labels and colours from the design-system resolvers.

// Slim job payload — the Jobs list/board. Mirrors JobSerializer.
export interface Job {
  id: number
  role: string
  company: string
  status: string
  posting_url: string
  applied_on: string | null
  created_at: string
}

// Detail payload for a single job — the slim job plus embedded contacts.
// Mirrors JobDetailSerializer; only the detail endpoint sends `contacts`.
export interface JobDetail extends Job {
  contacts: Contact[]
}

export interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  description: string
  links: string[]
  jobs: number[]
}

export interface Task {
  id: number
  title: string
  status: string
  priority: string
  is_done: boolean
  due_on: string | null
  job: number | null
  // Read-only job context for the row chip (present when job is set).
  job_company: string | null
  job_status: string | null
  category: string
  created_at: string
}
