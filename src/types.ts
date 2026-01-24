
export enum View {
  DASHBOARD = 'dashboard',
  SCHEDULE = 'schedule',
  DIET = 'diet',
  GOALS = 'goals',
  RESOURCES = 'resources',
  RANKING = 'ranking',
  PROFILE = 'profile',
  ADMIN = 'admin'
}

export interface UserStats {
  day: number;
  totalDays: number;
  weightLost: number;
  points: number;
  currentWeight: number;
  startWeight: number;
  goalWeight: number;
  height?: number;
  bmi?: number;
  idealWeight?: number;
  nickname?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  waistCm?: number;
  age?: number;
  gender?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  time_label: string;
  duration: string;
  icon: string;
  type: 'cabin' | 'external' | 'rest' | 'all';
  completed: boolean;
  image: string;
  is_locked: boolean;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  time_prep: string;
  tags: string[];
  image: string;
  category: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  consumed: boolean;
  is_suggestion: boolean;
  user_id?: string;
}
export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'points' | 'weight_lost' | 'days' | 'workouts';
  requirement_value: number;
  earned?: boolean;
  earned_at?: string;
}
