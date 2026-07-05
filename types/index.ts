export interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  target_date: string;
  status: string;
  priority: string;
  progress: number;
  notes: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  due_date: string;
  estimated_minutes: number;
  goal_id: number | null;
  status: string;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  category: string;
  location: string;
  notes: string;
  created_at: string;
}

export interface IncomeEntry {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface EcommerceEntry {
  id: number;
  revenue: number;
  profit: number;
  ad_spend: number;
  orders: number;
  conversion_rate: number;
  notes: string;
  date: string;
  created_at: string;
}

export interface TradingEntry {
  id: number;
  account_balance: number;
  daily_pnl: number;
  win_rate: number;
  notes: string;
  journal: string;
  date: string;
  created_at: string;
}

export interface HealthEntry {
  id: number;
  date: string;
  workout: string;
  workout_duration: number;
  body_weight: number;
  sleep_hours: number;
  habits: string;
  daily_score: number;
  notes: string;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}
