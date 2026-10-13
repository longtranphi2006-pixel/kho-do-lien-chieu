export type ItemPurpose = 'FREE' | 'EXCHANGE';

export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

export type ItemStatus = 'ACTIVE' | 'PENDING_ADMIN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export type TradeStatus = 'REQUESTED' | 'ACCEPTED' | 'HANDED_OVER' | 'COMPLETED' | 'CANCELLED';

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  phone?: string;
  email?: string;
  university: string;
  department?: string;
  student_id?: string;
  is_verified: boolean;
  reputation_score: number;
  items_given_count: number;
  completed_trades_count: number;
  role: UserRole;
  address?: string;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: ItemCondition;
  purpose: ItemPurpose;
  location: string;
  images: string[];
  status: ItemStatus;
  ai_moderation_reason?: string;
  ai_moderation_score?: number;
  favorites_count: number;
  created_at: string;
  donor?: Profile;
}

export interface Transaction {
  id: string;
  item_id: string;
  giver_id: string;
  receiver_id: string;
  status: TradeStatus;
  scheduled_date?: string;
  pickup_location?: string;
  note?: string;
  created_at: string;
  completed_at?: string;
  item?: Item;
  giver?: Profile;
  receiver?: Profile;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_read: boolean;
  action_link?: string;
  created_at: string;
  type?: 'trade' | 'moderation' | 'system' | 'review';
}

export interface ModerationResult {
  passed: boolean;
  status: ItemStatus;
  confidence: number;
  reasoning: string;
  detected_tags: string[];
}

export interface KpiStats {
  total_items: number;
  active_trades: number;
  verified_users: number;
  pending_moderation: number;
  total_completed_trades: number;
}
