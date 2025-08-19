export interface StorageUseStat {
  Type: string
  Capacity: number
  Available: number
  UseStr?: string
  CapStr?: string
  subEntries?: StorageBreakdown[]
}

export interface StorageBreakdown {
  type: string
  capacity: number
  available: number
  avail_str: string
}