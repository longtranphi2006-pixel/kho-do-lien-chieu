'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Profile,
  Item,
  Transaction,
  Review,
  NotificationItem,
  TradeStatus,
  ItemStatus,
  ReportItem,
  ReportTargetType,
  ReportReason,
  ReportStatus,
} from '@/types';
import {
  MOCK_PROFILES,
  MOCK_ITEMS,
  MOCK_TRANSACTIONS,
  MOCK_REVIEWS,
  MOCK_NOTIFICATIONS,
  MOCK_REPORTS,
} from '@/lib/mock-data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AppContextType {
  currentUser: Profile | null;
  allUsers: Profile[];
  switchUser: (userId: string) => void;
  login: (identifier: string) => boolean;
  loginWithOAuth: (params: { provider: string; email: string; name: string; avatar_url?: string }) => Profile;
  logout: () => void;
  registerUser: (userData: {
    full_name: string;
    identifier: string;
    university: string;
    department?: string;
    student_id?: string;
  }) => Profile;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => void;
  items: Item[];
  getItemById: (id: string) => Item | undefined;
  addItem: (newItem: Omit<Item, 'id' | 'created_at' | 'favorites_count'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => Promise<void> | void;
  approveItem: (id: string) => void;
  rejectItem: (id: string, reason?: string) => void;
  transactions: Transaction[];
  getTransactionById: (id: string) => Transaction | undefined;
  createTradeRequest: (params: {
    itemId: string;
    pickupLocation: string;
    note?: string;
    scheduledDate?: string;
  }) => Transaction;
  advanceTradeStatus: (transactionId: string, nextStatus: TradeStatus) => void;
  confirmTradeHandover: (transactionId: string, role: 'giver' | 'receiver') => void;
  cancelTrade: (transactionId: string, reason?: string) => Promise<void>;
  restoreTrade: (transactionId: string) => Promise<void>;
  sendTradeMessage: (transactionId: string, content: string) => Promise<void>;
  reviews: Review[];
  submitReview: (params: {
    transactionId: string;
    revieweeId: string;
    rating: number;
    comment: string;
  }) => void;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  favorites: string[];
  toggleFavorite: (itemId: string) => void;
  toggleLockUser: (userId: string) => void;
  lockUser: (params: {
    userId: string;
    duration: '1_HOUR' | '1_DAY' | '1_WEEK' | '1_MONTH' | 'PERMANENT' | 'CUSTOM';
    customUntil?: string;
    reason: string;
  }) => void;
  unlockUser: (userId: string) => void;
  isUserLocked: (user?: Profile | null) => boolean;
  reports: ReportItem[];
  submitReport: (params: {
    targetType: ReportTargetType;
    targetId: string;
    targetTitle?: string;
    targetDetails?: string;
    targetUserId?: string;
    targetUserName?: string;
    reason: ReportReason;
    description: string;
  }) => ReportItem;
  resolveReport: (reportId: string, action: 'RESOLVE' | 'DISMISS', adminNotes?: string) => void;
  adminHideItem: (itemId: string) => Promise<void> | void;
  adminRestoreItem: (itemId: string) => Promise<void> | void;
  deletedItemIds: Set<string>;
  isSupabaseMode: boolean;
  activeRole: 'user' | 'admin' | 'guest';
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'kdlc_current_user_id_v3',
  ITEMS: 'kdlc_items_v3',
  TRANSACTIONS: 'kdlc_transactions_v3',
  REVIEWS: 'kdlc_reviews_v3',
  NOTIFICATIONS: 'kdlc_notifications_v3',
  FAVORITES: 'kdlc_favorites_v3',
  PROFILES: 'kdlc_profiles_v3',
  REPORTS: 'kdlc_reports_v3',
  DELETED_ITEM_IDS: 'kdlc_deleted_item_ids_v4',
};

export const safeSaveStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = localStorage.getItem(key);
    if (existing !== value) {
      localStorage.setItem(key, value);
    }
  } catch {}
};

let reportsTableAvailable: boolean | null = null;

export const broadcastKdlcSync = (type: string, id?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const bc = new BroadcastChannel('kdlc_cross_tab_channel');
    bc.postMessage({ type, id, timestamp: Date.now() });
    bc.close();
  } catch {}
  try {
    safeSaveStorage('kdlc_cross_tab_ping', `${type}_${id || ''}_${Date.now()}`);
  } catch {}
  window.dispatchEvent(new CustomEvent('kdlc-items-updated'));
  window.dispatchEvent(new CustomEvent('kdlc-trades-updated'));
  window.dispatchEvent(new CustomEvent('kdlc-reports-updated'));
};

export const isUserLocked = (p?: Profile | null): boolean => {
  if (!p) return false;
  if (!p.is_locked) return false;
  if (p.locked_until) {
    const until = new Date(p.locked_until).getTime();
    if (!isNaN(until) && Date.now() > until) {
      return false; // Lock expired!
    }
  }
  return true;
};

export const hydrateProfile = (p: Profile): Profile => {
  let updated: Profile = { ...p };
  if (p.address && typeof p.address === 'string' && p.address.startsWith('{') && p.address.endsWith('}')) {
    try {
      const parsed = JSON.parse(p.address);
      if (parsed && typeof parsed === 'object') {
        updated = {
          ...updated,
          address: typeof parsed.address === 'string' ? parsed.address : p.address,
          bio: parsed.bio ?? p.bio,
          target_group: parsed.target_group ?? p.target_group,
          living_area: parsed.living_area ?? p.living_area,
          preferred_contact: parsed.preferred_contact ?? p.preferred_contact,
          password: parsed.password ?? p.password,
          is_locked: parsed.is_locked !== undefined ? parsed.is_locked : p.is_locked,
          locked_until: parsed.locked_until ?? p.locked_until,
          lock_reason: parsed.lock_reason ?? p.lock_reason,
        };
      }
    } catch {}
  }

  if (updated.department && updated.department.includes('Sinh viên xác thực qua')) {
    updated.department = updated.department.replace('Sinh viên xác thực qua', 'Tài khoản đăng nhập bằng');
  }

  // Auto-expire lock if time has passed
  if (updated.is_locked && updated.locked_until) {
    const until = new Date(updated.locked_until).getTime();
    if (!isNaN(until) && Date.now() > until) {
      updated.is_locked = false;
      updated.locked_until = undefined;
    }
  }

  return updated;
};

export const deduplicateProfiles = (list: Profile[]): Profile[] => {
  const emailMap = new Map<string, Profile>();
  const phoneMap = new Map<string, Profile>();
  const sysProfiles: Profile[] = [];
  const otherProfiles: Profile[] = [];

  for (const raw of list) {
    const p = hydrateProfile(raw);
    if (p.id.startsWith('sys-')) {
      sysProfiles.push(p);
      continue;
    }

    const cleanEmail = p.email?.trim().toLowerCase();
    const cleanPhone = p.phone?.replace(/\s+/g, '');

    if (cleanEmail) {
      const existing = emailMap.get(cleanEmail);
      if (!existing) {
        emailMap.set(cleanEmail, p);
      } else {
        const isAdmin = existing.role === 'admin' || p.role === 'admin';
        let primaryId = existing.id;
        if (existing.id === 'usr-admin-bql' || p.id === 'usr-admin-bql') {
          primaryId = 'usr-admin-bql';
        } else if ((p.completed_trades_count || 0) > (existing.completed_trades_count || 0)) {
          primaryId = p.id;
        } else if ((p.items_given_count || 0) > (existing.items_given_count || 0)) {
          primaryId = p.id;
        }

        const merged: Profile = {
          ...existing,
          ...p,
          id: primaryId,
          full_name:
            existing.full_name && existing.full_name !== 'Thành viên Liên Chiểu' && existing.full_name !== 'admin'
              ? existing.full_name
              : p.full_name,
          reputation_score: Math.max(existing.reputation_score || 0, p.reputation_score || 0),
          items_given_count: Math.max(existing.items_given_count || 0, p.items_given_count || 0),
          completed_trades_count: Math.max(existing.completed_trades_count || 0, p.completed_trades_count || 0),
          role: isAdmin ? 'admin' : 'user',
          avatar_url: p.avatar_url && !p.avatar_url.includes('photo-1534528741775') ? p.avatar_url : existing.avatar_url,
          university: p.university && p.university !== 'Trường Đại học Bách khoa - ĐHĐN' ? p.university : existing.university,
          department: p.department || existing.department,
          student_id: p.student_id || existing.student_id,
          address: p.address || existing.address,
        };
        emailMap.set(cleanEmail, merged);
      }
    } else if (cleanPhone) {
      const existing = phoneMap.get(cleanPhone);
      if (!existing) {
        phoneMap.set(cleanPhone, p);
      } else {
        const isAdmin = existing.role === 'admin' || p.role === 'admin';
        const merged: Profile = {
          ...existing,
          ...p,
          id: (p.completed_trades_count || 0) > (existing.completed_trades_count || 0) ? p.id : existing.id,
          reputation_score: Math.max(existing.reputation_score || 0, p.reputation_score || 0),
          items_given_count: Math.max(existing.items_given_count || 0, p.items_given_count || 0),
          completed_trades_count: Math.max(existing.completed_trades_count || 0, p.completed_trades_count || 0),
          role: isAdmin ? 'admin' : 'user',
        };
        phoneMap.set(cleanPhone, merged);
      }
    } else {
      if (!otherProfiles.some((item) => item.id === p.id)) {
        otherProfiles.push(p);
      }
    }
  }

  const seenIds = new Set<string>();
  const combined: Profile[] = [];
  for (const p of [...sysProfiles, ...Array.from(emailMap.values()), ...Array.from(phoneMap.values()), ...otherProfiles]) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  }
  return combined;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
        if (savedProfiles) {
          const parsed = JSON.parse(savedProfiles) as Profile[];
          return deduplicateProfiles(parsed.map(hydrateProfile));
        }
      } catch {}
    }
    return deduplicateProfiles(MOCK_PROFILES.map(hydrateProfile));
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        let savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        if (savedUserId === 'usr-oauth-1791902102209') {
          savedUserId = 'usr-oauth-1791897070645';
        }
        if (savedUserId && savedUserId.trim() !== '') {
          return savedUserId;
        }
      } catch {}
    }
    return null;
  });
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDel = localStorage.getItem(STORAGE_KEYS.DELETED_ITEM_IDS);
        if (savedDel) return new Set(JSON.parse(savedDel));
      } catch {}
    }
    return new Set<string>();
  });
  const [items, setItems] = useState<Item[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDel = localStorage.getItem(STORAGE_KEYS.DELETED_ITEM_IDS);
        const delSet = savedDel ? new Set<string>(JSON.parse(savedDel)) : new Set<string>();
        const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
        if (saved) {
          const parsed = JSON.parse(saved) as Item[];
          return parsed.filter((i) => !delSet.has(i.id));
        }
        return MOCK_ITEMS.filter((i) => !delSet.has(i.id));
      } catch {}
    }
    return MOCK_ITEMS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [favorites, setFavorites] = useState<string[]>(['item-01', 'item-04']);
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles) as Profile[];
        setProfiles(parsed.map(hydrateProfile));
      }

      let savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedUserId === 'usr-oauth-1791902102209') {
        savedUserId = 'usr-oauth-1791897070645';
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, savedUserId);
        } catch {}
      }
      if (savedUserId && savedUserId.trim() !== '') {
        setCurrentUserId(savedUserId);
      } else {
        setCurrentUserId(null);
      }

      let delSet = new Set<string>();
      const savedDeleted = localStorage.getItem(STORAGE_KEYS.DELETED_ITEM_IDS);
      if (savedDeleted) {
        try {
          delSet = new Set(JSON.parse(savedDeleted));
          setDeletedItemIds(delSet);
        } catch {}
      }

      const savedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (savedItems) {
        const parsed = JSON.parse(savedItems) as Item[];
        setItems(parsed.filter((i) => !delSet.has(i.id)));
      } else {
        setItems(MOCK_ITEMS.filter((i) => !delSet.has(i.id)));
      }

      const savedTrans = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTrans) {
        const parsed = JSON.parse(savedTrans) as Transaction[];
        const cleaned = parsed.filter((t) => t.id !== 'tr-001' && t.id !== 'tr-002');
        setTransactions(cleaned);
      }

      const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (savedReviews) setReviews(JSON.parse(savedReviews));

      const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs) as NotificationItem[];
        const cleanedNotifs = parsed.filter(
          (n) => !n.title?.includes('Tin nhắn mới từ 18.Trần Lê Phi Long') && !n.title?.includes('Tin nhắn mới từ Trần Đức Long')
        );
        setNotifications(cleanedNotifs);
      }

      const savedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
    } catch (e) {
      console.warn('LocalStorage load error, using default mock data', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage when state changes (safeSaveStorage stops cross-tab feedback loops)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      safeSaveStorage(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      safeSaveStorage(STORAGE_KEYS.CURRENT_USER_ID, currentUserId || '');
      safeSaveStorage(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      safeSaveStorage(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      safeSaveStorage(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      safeSaveStorage(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      safeSaveStorage(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      safeSaveStorage(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [profiles, currentUserId, items, transactions, reviews, notifications, favorites, reports, isInitialized]);

  // Helper to ensure any referenced profile exists in Supabase Cloud
  const ensureProfileInSupabase = async (profileOrId: Profile | string | null | undefined): Promise<void> => {
    if (!profileOrId || !isSupabaseConfigured() || !supabase) return;
    try {
      let pObj: Partial<Profile> | undefined;
      if (typeof profileOrId === 'string') {
        const found = profiles.find((p) => p.id === profileOrId);
        if (found && found.full_name && found.full_name !== 'Thành viên Liên Chiểu') {
          pObj = found;
        } else {
          // Check DB first to avoid overwriting a real profile
          const { data: dbUser } = await supabase.from('profiles').select('*').eq('id', profileOrId).maybeSingle();
          if (dbUser) {
            // Found profile in Supabase! Cache into local profiles and do NOT overwrite
            setProfiles((prev) => {
              const existingIdx = prev.findIndex((p) => p.id === dbUser.id);
              if (existingIdx >= 0) {
                const copy = [...prev];
                copy[existingIdx] = dbUser as Profile;
                return copy;
              }
              return [...prev, dbUser as Profile];
            });
            return;
          }
          // Only create minimal row if user DOES NOT exist in DB at all (for FK integrity)
          pObj = {
            id: profileOrId,
            full_name: 'Thành viên Liên Chiểu',
            role: 'user',
            is_verified: true,
            reputation_score: 50,
            items_given_count: 0,
            completed_trades_count: 0,
            created_at: new Date().toISOString(),
          };
        }
      } else {
        pObj = profileOrId;
      }
      if (!pObj || !pObj.id) return;

      // Double-check: if pObj has generic stub name, never overwrite an existing row
      if (pObj.full_name === 'Thành viên Liên Chiểu') {
        const { data: existingDb } = await supabase.from('profiles').select('id, full_name').eq('id', pObj.id).maybeSingle();
        if (existingDb && existingDb.full_name && existingDb.full_name !== 'Thành viên Liên Chiểu') {
          return;
        }
      }

      const extendedMeta = {
        address: pObj.address || '',
        bio: pObj.bio || '',
        target_group: pObj.target_group || '',
        living_area: pObj.living_area || '',
        preferred_contact: pObj.preferred_contact || 'CHAT',
        password: pObj.password || '',
      };

      await supabase.from('profiles').upsert({
        id: pObj.id,
        full_name: pObj.full_name || 'Thành viên Liên Chiểu',
        avatar_url: pObj.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        phone: pObj.phone,
        email: pObj.email,
        university: pObj.university || 'Trường Đại học Bách khoa - ĐHĐN',
        department: pObj.department,
        student_id: pObj.student_id,
        is_verified: pObj.is_verified ?? true,
        reputation_score: pObj.reputation_score ?? 50,
        items_given_count: pObj.items_given_count ?? 0,
        completed_trades_count: pObj.completed_trades_count ?? 0,
        role: pObj.role || 'user',
        is_locked: pObj.is_locked ?? false,
        address: JSON.stringify(extendedMeta),
      });
    } catch (err) {
      console.warn('ensureProfileInSupabase error:', err);
    }
  };

  // Sync with Supabase PostgreSQL Cloud & Subscribe to Realtime Updates
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const sb = supabase;

    let isMounted = true;

    const syncFromSupabase = async () => {
      try {
        const [itemsRes, profilesRes, transRes, reviewsRes, notifsRes] = await Promise.all([
          sb.from('items').select('*').order('created_at', { ascending: false }),
          sb.from('profiles').select('*'),
          sb.from('transactions').select('*').order('created_at', { ascending: false }),
          sb.from('reviews').select('*').order('created_at', { ascending: false }),
          sb.from('notifications').select('*').order('created_at', { ascending: false }),
        ]);

        if (!isMounted) return;

        // Check for deleted items blacklist in cloud
        let activeDeleted = new Set(deletedItemIds);
        if (profilesRes.data) {
          const delRecord = profilesRes.data.find((p: any) => p.id === 'sys-deleted-items');
          if (delRecord && delRecord.address) {
            try {
              const parsed = JSON.parse(delRecord.address);
              if (Array.isArray(parsed)) {
                parsed.forEach((id: string) => activeDeleted.add(id));
              }
            } catch {}
          }
        }
        setDeletedItemIds(activeDeleted);
        try {
          localStorage.setItem(STORAGE_KEYS.DELETED_ITEM_IDS, JSON.stringify(Array.from(activeDeleted)));
        } catch {}

        // 1. NON-DESTRUCTIVE ITEMS MERGE (Filtered with activeDeleted to prevent resurrection):
        if (itemsRes.data) {
          const rawDbItems = itemsRes.data as Item[];
          const dbItems = rawDbItems.filter((i) => !activeDeleted.has(i.id));
          const dbItemIds = new Set(dbItems.map((i) => i.id));

          setItems((prev) => {
            const pendingSync = prev.filter((i) => !dbItemIds.has(i.id) && !activeDeleted.has(i.id));

            // Background push un-synced items to Supabase
            if (pendingSync.length > 0) {
              pendingSync.forEach(async (pending) => {
                if (activeDeleted.has(pending.id)) return;
                try {
                  await ensureProfileInSupabase(pending.user_id);
                  await sb.from('items').upsert({
                    id: pending.id,
                    user_id: pending.user_id,
                    title: pending.title,
                    description: pending.description,
                    category: pending.category,
                    condition: pending.condition,
                    purpose: pending.purpose,
                    location: pending.location,
                    images: pending.images,
                    status: pending.status,
                    ai_moderation_reason: pending.ai_moderation_reason,
                    ai_moderation_score: pending.ai_moderation_score,
                    favorites_count: pending.favorites_count || 0,
                    created_at: pending.created_at,
                  });
                } catch (e) {
                  console.warn('Auto-sync pending item error:', e);
                }
              });
            }

            return [...pendingSync, ...dbItems];
          });
        }

        // 2. Profiles merge (Smart merge: keep real full_name from being overwritten by stubs)
        if (profilesRes.data && profilesRes.data.length > 0) {
          setProfiles((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            profilesRes.data!.forEach((rawProfile: Profile) => {
              const p = hydrateProfile(rawProfile);
              const local = map.get(p.id);
              if (
                local &&
                local.full_name &&
                local.full_name !== 'Thành viên Liên Chiểu' &&
                (!p.full_name || p.full_name === 'Thành viên Liên Chiểu')
              ) {
                // Keep local full profile and sync to Supabase
                ensureProfileInSupabase(local);
                map.set(p.id, { ...p, ...local });
              } else if (p.full_name && p.full_name !== 'Thành viên Liên Chiểu') {
                // DB has real name: replace local stub with DB real profile!
                map.set(p.id, p);
              } else {
                map.set(p.id, { ...local, ...p });
              }
            });
            const merged = deduplicateProfiles(Array.from(map.values()));
            // Auto-heal currentUserId if old ID was merged into canonical ID
            if (currentUserId && !merged.some((p) => p.id === currentUserId)) {
              const old = Array.from(map.values()).find((p) => p.id === currentUserId);
              if (old && old.email) {
                const canonical = merged.find((p) => p.email && p.email.toLowerCase() === old.email!.toLowerCase());
                if (canonical) {
                  setCurrentUserId(canonical.id);
                  try {
                    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, canonical.id);
                  } catch {}
                }
              }
            }
            try {
              localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // 3. Transactions merge (with auto-healing for 2-way confirmed trades)
        if (transRes.data) {
          const rawTrans = transRes.data as Transaction[];
          const dbTrans = rawTrans.map((t) => {
            if (t.giver_confirmed && t.receiver_confirmed && t.status !== 'COMPLETED') {
              const compDate = t.completed_at || new Date().toISOString();
              sb.from('transactions').update({ status: 'COMPLETED', completed_at: compDate }).eq('id', t.id).then(() => {});
              sb.from('items').update({ status: 'COMPLETED' }).eq('id', t.item_id).then(() => {});
              return { ...t, status: 'COMPLETED' as TradeStatus, completed_at: compDate };
            }
            return t;
          });
          const dbTransIds = new Set(dbTrans.map((t) => t.id));
          setTransactions((prev) => {
            const pendingTrans = prev.filter((t) => !dbTransIds.has(t.id));
            const merged = [...pendingTrans, ...dbTrans];
            try {
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // 4. Reviews merge
        if (reviewsRes.data) {
          const dbReviews = reviewsRes.data as Review[];
          const dbReviewIds = new Set(dbReviews.map((r) => r.id));
          setReviews((prev) => {
            const pendingReviews = prev.filter((r) => !dbReviewIds.has(r.id));
            return [...pendingReviews, ...dbReviews];
          });
        }

        // 5. Notifications merge (Strictly sorted by created_at DESC so newest is always on top)
        if (notifsRes.data) {
          const dbNotifs = notifsRes.data as NotificationItem[];
          const dbNotifIds = new Set(dbNotifs.map((n) => n.id));
          setNotifications((prev) => {
            const pendingNotifs = prev.filter((n) => !dbNotifIds.has(n.id));
            const merged = [...pendingNotifs, ...dbNotifs];
            return merged.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        }

        // 6. Reports sync (Dual: Cloud Table + sys-reports-store in profiles)
        let cloudReports: ReportItem[] = [];

        // 6A. Try dedicated 'reports' table if migrated & available
        if (reportsTableAvailable !== false) {
          try {
            const { data: repData, error: repError } = await sb
              .from('reports')
              .select('*')
              .order('created_at', { ascending: false });
            if (repError) {
              if (repError.code === '42P01' || repError.message?.includes('does not exist') || (repError as any).status === 404) {
                reportsTableAvailable = false;
              }
            } else if (Array.isArray(repData)) {
              reportsTableAvailable = true;
              if (repData.length > 0) {
                cloudReports = repData as ReportItem[];
              }
            }
          } catch {
            reportsTableAvailable = false;
          }
        }

        // 6B. Check 'sys-reports-store' fallback record in profiles table
        try {
          const sysRepProfile = profilesRes.data?.find((p: any) => p.id === 'sys-reports-store');
          if (sysRepProfile && sysRepProfile.address) {
            const parsedSys = JSON.parse(sysRepProfile.address);
            if (Array.isArray(parsedSys)) {
              const existingIds = new Set(cloudReports.map((r) => r.id));
              parsedSys.forEach((r: ReportItem) => {
                if (!existingIds.has(r.id)) {
                  cloudReports.push(r);
                  existingIds.add(r.id);
                }
              });
            }
          }
        } catch {}

        if (cloudReports.length > 0) {
          const cloudIds = new Set(cloudReports.map((r) => r.id));
          setReports((prev) => {
            const pendingLocal = prev.filter((r) => !cloudIds.has(r.id));
            const merged = [...pendingLocal, ...cloudReports].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            try {
              localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Supabase initial sync error:', err);
      }
    };

    syncFromSupabase();

    // Subscribe to Realtime table changes across devices
    const channel = sb
      .channel('kdlc-cross-device-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const it = payload.new as Item;
            setDeletedItemIds((currentDeleted) => {
              if (currentDeleted.has(it.id)) return currentDeleted;
              setItems((prev) => [it, ...prev.filter((i) => i.id !== it.id)]);
              return currentDeleted;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Item).id;
            setItems((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions((prev) => [payload.new as Transaction, ...prev.filter((t) => t.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) => prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Check if this is the sys-deleted-items broadcast
            if (payload.new.id === 'sys-deleted-items' && payload.new.address) {
              try {
                const parsed = JSON.parse(payload.new.address);
                if (Array.isArray(parsed)) {
                  setDeletedItemIds((prev) => {
                    const next = new Set(prev);
                    parsed.forEach((id: string) => next.add(id));
                    try {
                      localStorage.setItem(STORAGE_KEYS.DELETED_ITEM_IDS, JSON.stringify(Array.from(next)));
                    } catch {}
                    setItems((curItems) => curItems.filter((i) => !next.has(i.id)));
                    return next;
                  });
                }
              } catch {}
            }

            // Check if this is the sys-reports-store broadcast
            if (payload.new.id === 'sys-reports-store' && payload.new.address) {
              try {
                const parsed = JSON.parse(payload.new.address);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setReports((prev) => {
                    const map = new Map(prev.map((r) => [r.id, r]));
                    parsed.forEach((r: ReportItem) => map.set(r.id, r));
                    const next = Array.from(map.values()).sort(
                      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    try {
                      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                }
              } catch {}
            }

            setProfiles((prev) => {
              const existingIdx = prev.findIndex((p) => p.id === payload.new.id);
              if (existingIdx >= 0) {
                const copy = [...prev];
                copy[existingIdx] = payload.new as Profile;
                return copy;
              }
              return [...prev, payload.new as Profile];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports((prev) => [payload.new as ReportItem, ...prev.filter((r) => r.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setReports((prev) => prev.map((r) => (r.id === payload.new.id ? (payload.new as ReportItem) : r)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as NotificationItem, ...prev.filter((n) => n.id !== payload.new.id)]);
          }
        }
      )
      .subscribe();

    // Cross-tab and mobile foreground focus synchronization
    const handleFocus = () => {
      syncFromSupabase();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromSupabase();
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.REPORTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setReports(parsed);
        } catch {}
      }
      if (e.key === STORAGE_KEYS.DELETED_ITEM_IDS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const delSet = new Set<string>(parsed);
            setDeletedItemIds(delSet);
            setItems((prev) => prev.filter((i) => !delSet.has(i.id)));
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.ITEMS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setItems(parsed);
        } catch {}
      }
      if (e.key === STORAGE_KEYS.TRANSACTIONS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTransactions(parsed);
        } catch {}
      }
    };
    const handleCustomReportUpdate = () => {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setReports(parsed);
        } catch {}
      }
    };
    const handleCustomItemsUpdate = () => {
      try {
        const savedDel = localStorage.getItem(STORAGE_KEYS.DELETED_ITEM_IDS);
        const delSet = savedDel ? new Set<string>(JSON.parse(savedDel)) : new Set<string>();
        setDeletedItemIds(delSet);
        const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setItems(parsed.filter((i: Item) => !delSet.has(i.id)));
        }
      } catch {}
    };
    const handleCustomTradesUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setTransactions(parsed);
        }
      } catch {}
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kdlc-reports-updated', handleCustomReportUpdate);
    window.addEventListener('kdlc-items-updated', handleCustomItemsUpdate);
    window.addEventListener('kdlc-trades-updated', handleCustomTradesUpdate);

    // Guaranteed polling heartbeat every 6 seconds across mobile & desktop
    const pollTimer = setInterval(() => {
      syncFromSupabase();
    }, 6000);

    return () => {
      isMounted = false;
      sb.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kdlc-reports-updated', handleCustomReportUpdate);
      window.removeEventListener('kdlc-items-updated', handleCustomItemsUpdate);
      window.removeEventListener('kdlc-trades-updated', handleCustomTradesUpdate);
      clearInterval(pollTimer);
    };
  }, []);

  const currentUser = currentUserId ? profiles.find((p) => p.id === currentUserId) || null : null;

  // Auto-sync currentUser's real profile to Supabase on mount or user switch
  useEffect(() => {
    if (isInitialized && currentUser && isSupabaseConfigured() && supabase) {
      if (currentUser.full_name && currentUser.full_name !== 'Thành viên Liên Chiểu') {
        ensureProfileInSupabase(currentUser);
      }
    }
  }, [isInitialized, currentUser?.id, currentUser?.full_name]);

  const switchUser = (userId: string) => {
    const user = profiles.find((p) => p.id === userId);
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const login = (identifier: string): boolean => {
    const clean = identifier.trim().toLowerCase();

    // 1. Direct Admin / BQL account login
    if (clean === 'admin' || clean === 'bql' || clean === 'admin@khodolienchieu.vn' || clean === 'bql-lc-admin') {
      const adminProfile =
        profiles.find((p) => p.id === 'usr-admin-bql') ||
        profiles.find((p) => p.role === 'admin' && !p.id.startsWith('sys-')) ||
        MOCK_PROFILES.find((p) => p.id === 'usr-admin-bql');
      if (adminProfile) {
        setCurrentUserId(adminProfile.id);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, adminProfile.id);
        } catch {}
        if (isSupabaseConfigured() && supabase) {
          ensureProfileInSupabase(adminProfile);
        }
        return true;
      }
    }

    const matched = profiles.find(
      (p) =>
        (p.email && p.email.toLowerCase() === clean) ||
        (p.phone && p.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) ||
        p.full_name.toLowerCase().includes(clean)
    );

    if (matched) {
      setCurrentUserId(matched.id);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matched.id);
      } catch {}
      if (isSupabaseConfigured() && supabase) {
        ensureProfileInSupabase(matched);
      }
      return true;
    }

    // If identifier doesn't match an existing user, create a new verified profile for them
    const newProfile: Profile = {
      id: `usr-${Date.now()}`,
      full_name: clean.includes('@') ? clean.split('@')[0] : 'Thành viên mới',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      email: clean.includes('@') ? clean : undefined,
      phone: !clean.includes('@') ? clean : undefined,
      university: 'Trường Đại học Bách khoa - ĐHĐN',
      department: 'Sinh viên Liên Chiểu',
      is_verified: true,
      reputation_score: 0,
      items_given_count: 0,
      completed_trades_count: 0,
      role: clean.includes('admin') ? 'admin' : 'user',
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => {
      const updated = deduplicateProfiles([...prev, newProfile]);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCurrentUserId(newProfile.id);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newProfile.id);
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      ensureProfileInSupabase(newProfile);
    }

    return true;
  };

  const loginWithOAuth = (params: {
    provider: string;
    email: string;
    name: string;
    avatar_url?: string;
  }): Profile => {
    const cleanEmail = params.email.trim().toLowerCase();
    let existing = profiles.find((p) => p.email && p.email.toLowerCase() === cleanEmail);

    if (!existing && typeof window !== 'undefined') {
      try {
        const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
        if (savedProfiles) {
          const parsed = JSON.parse(savedProfiles) as Profile[];
          existing = parsed.find((p) => p.email && p.email.toLowerCase() === cleanEmail);
        }
      } catch {}
    }

    if (existing) {
      const updated: Profile = {
        ...existing,
        full_name: params.name || existing.full_name,
        avatar_url: params.avatar_url || existing.avatar_url,
      };
      setProfiles((prev) => {
        const list = deduplicateProfiles(prev.map((p) => (p.id === existing!.id ? updated : p)));
        try {
          localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(list));
        } catch {}
        return list;
      });
      setCurrentUserId(existing.id);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existing.id);
      } catch {}
      if (isSupabaseConfigured() && supabase) {
        ensureProfileInSupabase(updated);
      }
      return updated;
    }

    // Deterministic ID derived from email to guarantee no duplicate entries across sessions
    const cleanIdPart = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
    const deterministicId = `usr-oauth-${cleanIdPart || Date.now()}`;

    const newProfile: Profile = {
      id: deterministicId,
      full_name: params.name || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Người dùng Google'),
      avatar_url:
        params.avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      email: cleanEmail,
      university: 'Đại học Đà Nẵng',
      department: 'Tài khoản đăng nhập bằng ' + params.provider,
      is_verified: true,
      reputation_score: 0,
      items_given_count: 0,
      completed_trades_count: 0,
      role: cleanEmail.includes('admin') ? 'admin' : 'user',
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => {
      const updated = deduplicateProfiles([...prev, newProfile]);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCurrentUserId(newProfile.id);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newProfile.id);
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      ensureProfileInSupabase(newProfile);
    }

    return newProfile;
  };

  const logout = () => {
    setCurrentUserId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch {
      // ignore
    }
  };

  const registerUser = (userData: {
    full_name: string;
    identifier: string;
    university: string;
    department?: string;
    student_id?: string;
  }): Profile => {
    const isEmail = userData.identifier.includes('@');
    const newProfile: Profile = {
      id: `usr-${Date.now()}`,
      full_name: userData.full_name,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      email: isEmail ? userData.identifier : undefined,
      phone: !isEmail ? userData.identifier : undefined,
      university: userData.university,
      department: userData.department,
      student_id: userData.student_id,
      is_verified: true,
      reputation_score: 0,
      items_given_count: 0,
      completed_trades_count: 0,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    setCurrentUserId(newProfile.id);

    if (isSupabaseConfigured() && supabase) {
      ensureProfileInSupabase(newProfile);
    }

    return newProfile;
  };

  const updateProfile = (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    if (!currentUser) return;
    if (isUserLocked(currentUser)) {
      alert('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
      return;
    }
    const updatedUser: Profile = {
      ...currentUser,
      ...updates,
    };

    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === currentUser.id);
      const list = exists
        ? prev.map((p) => (p.id === currentUser.id ? updatedUser : p))
        : [...prev, updatedUser];
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(list));
      } catch {}
      return list;
    });

    // If full_name or avatar_url changed, also update donor info on user's posted items
    if (updates.full_name || updates.avatar_url) {
      setItems((prev) => {
        const nextItems = prev.map((item) => {
          if (item.user_id === currentUser.id) {
            return {
              ...item,
              donor_name: updates.full_name || item.donor_name,
              donor_avatar: updates.avatar_url || item.donor_avatar,
              donor: {
                ...(item.donor || updatedUser),
                full_name: updates.full_name || (item.donor?.full_name ?? updatedUser.full_name),
                avatar_url: updates.avatar_url || (item.donor?.avatar_url ?? updatedUser.avatar_url),
              },
            };
          }
          return item;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(nextItems));
        } catch {}
        return nextItems;
      });
    }

    if (isSupabaseConfigured() && supabase) {
      const extendedMeta = {
        address: updatedUser.address || '',
        bio: updatedUser.bio || '',
        target_group: updatedUser.target_group || '',
        living_area: updatedUser.living_area || '',
        preferred_contact: updatedUser.preferred_contact || 'CHAT',
        password: updatedUser.password || '',
      };

      const supabasePayload: Record<string, any> = {
        full_name: updatedUser.full_name,
        avatar_url: updatedUser.avatar_url,
        phone: updatedUser.phone,
        email: updatedUser.email,
        university: updatedUser.university,
        department: updatedUser.department,
        student_id: updatedUser.student_id,
        address: JSON.stringify(extendedMeta),
      };

      supabase.from('profiles').update(supabasePayload).eq('id', currentUser.id).then(() => {});
    }
  };

  const getItemById = (id: string): Item | undefined => {
    if (deletedItemIds.has(id)) return undefined;
    const item = items.find((i) => i.id === id);
    if (!item) return undefined;
    let donor = profiles.find((p) => p.id === item.user_id);
    if (!donor || !donor.full_name || donor.full_name === 'Thành viên Liên Chiểu') {
      if (currentUser && currentUser.id === item.user_id && currentUser.full_name !== 'Thành viên Liên Chiểu') {
        donor = currentUser;
      } else if (item.donor && item.donor.full_name !== 'Thành viên Liên Chiểu') {
        donor = item.donor;
      } else {
        const realProfile = profiles.find(
          (p) =>
            p.full_name &&
            p.full_name !== 'Thành viên Liên Chiểu' &&
            (p.id === item.user_id || (item.user_id.startsWith('usr-oauth-') && p.id.startsWith('usr-oauth-')))
        );
        if (realProfile) {
          donor = realProfile;
        } else if (item.donor_name) {
          donor = {
            id: item.user_id,
            full_name: item.donor_name,
            avatar_url: item.donor_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
            university: 'Trường Đại học Bách khoa - ĐHĐN',
            is_verified: true,
            reputation_score: 50,
            items_given_count: 1,
            completed_trades_count: 0,
            role: 'user',
            created_at: item.created_at,
          };
        }
      }
    }
    return { ...item, donor };
  };

  const addItem = (newItemData: Omit<Item, 'id' | 'created_at' | 'favorites_count'>): Item => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
    }
    const authorProfile = currentUser || profiles.find((p) => p.id === newItemData.user_id);
    const newItem: Item = {
      ...newItemData,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      favorites_count: 0,
      donor_name: authorProfile?.full_name,
      donor_avatar: authorProfile?.avatar_url,
      donor: authorProfile || undefined,
    };
    setItems((prev) => [newItem, ...prev]);

    if (newItem.status === 'PENDING_ADMIN') {
      const adminNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        user_id: 'usr-admin-bql',
        title: 'Mục đăng cần kiểm duyệt AI',
        content: `Món đồ "${newItem.title}" cần phê duyệt thủ công do cờ kiểm duyệt.`,
        is_read: false,
        action_link: '/admin',
        type: 'moderation',
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [adminNotif, ...prev]);
    }

    if (isSupabaseConfigured() && supabase) {
      const sb = supabase;
      const pushToSupabase = async () => {
        try {
          // 1. Ensure author profile is in profiles table first to satisfy foreign keys
          await ensureProfileInSupabase(authorProfile || newItem.user_id);

          // 2. Upsert the item into items table
          const { error } = await sb.from('items').upsert({
            id: newItem.id,
            user_id: newItem.user_id,
            title: newItem.title,
            description: newItem.description,
            category: newItem.category,
            condition: newItem.condition,
            purpose: newItem.purpose,
            location: newItem.location,
            images: newItem.images,
            status: newItem.status,
            ai_moderation_reason: newItem.ai_moderation_reason,
            ai_moderation_score: newItem.ai_moderation_score,
            favorites_count: 0,
            created_at: newItem.created_at,
          });

          if (error) {
            console.error('Supabase addItem error:', error);
          } else {
            console.log('Item pushed to Supabase Cloud successfully:', newItem.id);
          }
        } catch (err) {
          console.error('addItem Supabase exception:', err);
        }
      };
      pushToSupabase();
    }

    return newItem;
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      try {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (isSupabaseConfigured() && supabase) {
      supabase.from('items').update(updates).eq('id', id).then(() => {});
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kdlc-items-updated'));
    }
  };

  const deleteItem = async (id: string) => {
    // 1. Permanently blacklist this item ID so it can never be resurrected by sync or mock data
    const nextDeletedIds = new Set(deletedItemIds);
    nextDeletedIds.add(id);
    setDeletedItemIds(nextDeletedIds);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_ITEM_IDS, JSON.stringify(Array.from(nextDeletedIds)));
    } catch {}

    // 2. Remove from local items state & storage
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Also cancel any ongoing transactions for this deleted item so they don't remain stuck
    setTransactions((prev) => {
      const nextTrades = prev.map((t) =>
        t.item_id === id && t.status !== 'CANCELLED' && t.status !== 'COMPLETED'
          ? { ...t, status: 'CANCELLED' as TradeStatus }
          : t
      );
      try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(nextTrades));
      } catch {}
      return nextTrades;
    });

    // 4. Remove from favorites
    setFavorites((prev) => {
      const nextFavs = prev.filter((favId) => favId !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(nextFavs));
      } catch {}
      return nextFavs;
    });

    // 5. Delete from Supabase & push blacklist to cloud system profile
    if (isSupabaseConfigured() && supabase) {
      const sb = supabase;
      try {
        await Promise.race([
          Promise.all([
            sb.from('items').delete().eq('id', id),
            sb.from('transactions').update({ status: 'CANCELLED' }).eq('item_id', id),
            sb.from('profiles').upsert({
              id: 'sys-deleted-items',
              full_name: 'Danh Sách Món Đồ Đã Xóa',
              role: 'admin',
              address: JSON.stringify(Array.from(nextDeletedIds)),
            }),
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase delete timeout')), 4000)),
        ]);
      } catch (err) {
        console.warn('Supabase deleteItem error/timeout:', err);
      }
    }

    broadcastKdlcSync('ITEM_DELETED', id);
  };

  const approveItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'ACTIVE' as ItemStatus, ai_moderation_reason: 'Quản trị viên đã phê duyệt công khai.' }
          : item
      )
    );

    if (isSupabaseConfigured() && supabase) {
      supabase.from('items').update({
        status: 'ACTIVE',
        ai_moderation_reason: 'Quản trị viên đã phê duyệt công khai.',
      }).eq('id', id).then(() => {});
    }
  };

  const rejectItem = (id: string, reason = 'Vi phạm quy định phi thương mại hoặc an toàn cộng đồng') => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'REJECTED' as ItemStatus, ai_moderation_reason: reason }
          : item
      )
    );

    if (isSupabaseConfigured() && supabase) {
      supabase.from('items').update({
        status: 'REJECTED',
        ai_moderation_reason: reason,
      }).eq('id', id).then(() => {});
    }
  };

  const lockUser = (params: {
    userId: string;
    duration: '1_HOUR' | '1_DAY' | '1_WEEK' | '1_MONTH' | 'PERMANENT' | 'CUSTOM';
    customUntil?: string;
    reason: string;
  }) => {
    let lockedUntil: string | undefined = undefined;
    if (params.duration === '1_HOUR') {
      lockedUntil = new Date(Date.now() + 3600 * 1000).toISOString();
    } else if (params.duration === '1_DAY') {
      lockedUntil = new Date(Date.now() + 86400 * 1000).toISOString();
    } else if (params.duration === '1_WEEK') {
      lockedUntil = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    } else if (params.duration === '1_MONTH') {
      lockedUntil = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
    } else if (params.duration === 'CUSTOM' && params.customUntil) {
      lockedUntil = params.customUntil;
    }

    setProfiles((prev) => {
      const updated = prev.map((u) => {
        if (u.id === params.userId) {
          let currentMeta: Record<string, any> = {};
          try {
            if (u.address?.startsWith('{')) currentMeta = JSON.parse(u.address);
          } catch {}

          const nextMeta = {
            ...currentMeta,
            is_locked: true,
            locked_until: lockedUntil,
            lock_reason: params.reason,
          };

          const updatedUser: Profile = {
            ...u,
            is_locked: true,
            locked_until: lockedUntil,
            lock_reason: params.reason,
            address: JSON.stringify(nextMeta),
          };

          if (isSupabaseConfigured() && supabase) {
            (async () => {
              try {
                await supabase.from('profiles').update({
                  is_locked: true,
                  address: JSON.stringify(nextMeta),
                }).eq('id', params.userId);
              } catch {}
            })();
          }

          return updatedUser;
        }
        return u;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const lockNotif: NotificationItem = {
      id: `notif-lock-${Date.now()}`,
      user_id: params.userId,
      title: 'Tài khoản của bạn đã bị khóa chức năng 🔒',
      content: `Tài khoản bị tạm khóa đến ${lockedUntil ? new Date(lockedUntil).toLocaleString('vi-VN') : 'khi có thông báo mới'}. Lý do: "${params.reason}". Bạn hiện chỉ có quyền hoạt động ở chế độ vãng lai.`,
      is_read: false,
      action_link: '/profile',
      type: 'system',
      created_at: new Date().toISOString(),
    };
    pushNotification(lockNotif);
  };

  const unlockUser = (userId: string) => {
    setProfiles((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          let currentMeta: Record<string, any> = {};
          try {
            if (u.address?.startsWith('{')) currentMeta = JSON.parse(u.address);
          } catch {}

          const nextMeta = {
            ...currentMeta,
            is_locked: false,
            locked_until: null,
            lock_reason: null,
          };

          const updatedUser: Profile = {
            ...u,
            is_locked: false,
            locked_until: undefined,
            lock_reason: undefined,
            address: JSON.stringify(nextMeta),
          };

          if (isSupabaseConfigured() && supabase) {
            (async () => {
              try {
                await supabase.from('profiles').update({
                  is_locked: false,
                  address: JSON.stringify(nextMeta),
                }).eq('id', userId);
              } catch {}
            })();
          }

          return updatedUser;
        }
        return u;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const unlockNotif: NotificationItem = {
      id: `notif-unlock-${Date.now()}`,
      user_id: userId,
      title: 'Tài khoản của bạn đã được mở khóa ✅',
      content: 'Ban Quản Trị đã mở khóa tài khoản cho bạn. Bạn hiện có thể tiếp tục chia sẻ và nhận đồ.',
      is_read: false,
      action_link: '/profile',
      type: 'system',
      created_at: new Date().toISOString(),
    };
    pushNotification(unlockNotif);
  };

  const toggleLockUser = (userId: string) => {
    const user = profiles.find((u) => u.id === userId);
    if (user?.is_locked) {
      unlockUser(userId);
    } else {
      lockUser({
        userId,
        duration: '1_DAY',
        reason: 'Khóa tài khoản theo yêu cầu của Quản trị viên',
      });
    }
  };

  const submitReport = (params: {
    targetType: ReportTargetType;
    targetId: string;
    targetTitle?: string;
    targetDetails?: string;
    targetUserId?: string;
    targetUserName?: string;
    reason: ReportReason;
    description: string;
  }): ReportItem => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
    }
    const currentReporterId = currentUser?.id || 'guest';
    const isDuplicate = reports.some(
      (r) =>
        r.reporter_id === currentReporterId &&
        r.target_type === params.targetType &&
        r.target_id === params.targetId
    );
    if (isDuplicate) {
      throw new Error('Bạn đã gửi báo cáo nội dung này trước đó rồi. Đội ngũ Ban Quản Trị đang thụ lý giải quyết, xin vui lòng không gửi trùng lặp.');
    }
    const reasonLabels: Record<ReportReason, string> = {
      COMMERCIAL_MONEY: 'Tiền bạc & Buôn bán thương mại',
      PROHIBITED_SUBSTANCE: 'Chất cấm & Hàng nguy hiểm',
      VIOLENCE_HARASSMENT: 'Bạo lực & Ngôn từ thù hằn',
      FRAUD_SCAM: 'Lừa đảo & Gian lận',
      OTHER: 'Lý do khác',
    };

    const newReport: ReportItem = {
      id: `rep-${Date.now()}`,
      reporter_id: currentUser?.id || 'guest',
      reporter_name: currentUser?.full_name || 'Thành viên Liên Chiểu',
      reporter_email: currentUser?.email,
      target_type: params.targetType,
      target_id: params.targetId,
      target_title: params.targetTitle,
      target_details: params.targetDetails,
      target_user_id: params.targetUserId,
      target_user_name: params.targetUserName,
      reason: params.reason,
      reason_text: reasonLabels[params.reason] || 'Vi phạm quy định',
      description: params.description.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    setReports((prev) => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const adminNotif: NotificationItem = {
      id: `notif-rep-${Date.now()}`,
      user_id: 'usr-admin-bql',
      title: `Báo cáo vi phạm: [${params.targetType}]`,
      content: `${currentUser?.full_name || 'Một thành viên'} vừa báo cáo ${params.targetTitle || params.targetType} với lý do "${reasonLabels[params.reason]}".`,
      is_read: false,
      action_link: '/admin?tab=reports',
      type: 'moderation',
      created_at: new Date().toISOString(),
    };

    setReports((prev) => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      } catch {}

      // Dual Cloud Sync for Supabase across all devices & browsers
      if (isSupabaseConfigured() && supabase) {
        const sb = supabase;
        (async () => {
          try {
            await sb.from('reports').upsert(newReport);
          } catch {}
          try {
            await sb.from('profiles').upsert({
              id: 'sys-reports-store',
              full_name: 'Hệ Thống Báo Cáo Vi Phạm',
              role: 'admin',
              address: JSON.stringify(updated),
            });
          } catch {}
          try {
            await sb.from('notifications').upsert(adminNotif);
          } catch {}
        })();
      }

      return updated;
    });

    setNotifications((prev) => [adminNotif, ...prev]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kdlc-reports-updated', { detail: newReport }));
    }

    return newReport;
  };

  const resolveReport = (reportId: string, action: 'RESOLVE' | 'DISMISS', adminNotes?: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          const resolvedItem: ReportItem = {
            ...r,
            status: (action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED') as ReportStatus,
            admin_notes:
              adminNotes ||
              (action === 'RESOLVE'
                ? 'Admin đã xác minh và xử lý vi phạm.'
                : 'Admin đã xem xét và bác bỏ báo cáo do không có vi phạm.'),
            resolved_at: new Date().toISOString(),
            resolved_by: currentUser?.full_name || 'Ban Quản Trị Admin',
          };

          if (isSupabaseConfigured() && supabase) {
            (async () => {
              try {
                await supabase.from('reports').update({
                  status: resolvedItem.status,
                  admin_notes: resolvedItem.admin_notes,
                  resolved_at: resolvedItem.resolved_at,
                  resolved_by: resolvedItem.resolved_by,
                }).eq('id', reportId);
              } catch {}
            })();
          }

          return resolvedItem;
        }
        return r;
      });

      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      } catch {}

      if (isSupabaseConfigured() && supabase) {
        (async () => {
          try {
            await supabase.from('profiles').upsert({
              id: 'sys-reports-store',
              full_name: 'Hệ Thống Báo Cáo Vi Phạm',
              role: 'admin',
              address: JSON.stringify(updated),
            });
          } catch {}
        })();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kdlc-reports-updated'));
      }

      return updated;
    });
  };

  const adminHideItem = async (itemId: string) => {
    updateItem(itemId, { status: 'HIDDEN' });
    if (isSupabaseConfigured() && supabase) {
      try {
        await Promise.race([
          supabase.from('items').update({ status: 'HIDDEN' }).eq('id', itemId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase hide timeout')), 4000)),
        ]);
      } catch (err) {
        console.warn('Supabase adminHideItem error/timeout:', err);
      }
    }
    broadcastKdlcSync('ITEM_FROZEN', itemId);
  };

  const adminRestoreItem = async (itemId: string) => {
    updateItem(itemId, { status: 'ACTIVE' });
    if (isSupabaseConfigured() && supabase) {
      try {
        await Promise.race([
          supabase.from('items').update({ status: 'ACTIVE' }).eq('id', itemId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase restore timeout')), 4000)),
        ]);
      } catch (err) {
        console.warn('Supabase adminRestoreItem error/timeout:', err);
      }
    }
    broadcastKdlcSync('ITEM_RESTORED', itemId);
  };

  const getTransactionById = (id: string): Transaction | undefined => {
    const t = transactions.find((item) => item.id === id);
    if (!t) return undefined;
    const item = getItemById(t.item_id);
    let giver = profiles.find((p) => p.id === t.giver_id);
    if ((!giver || giver.full_name === 'Thành viên Liên Chiểu') && currentUser?.id === t.giver_id) {
      giver = currentUser;
    } else if ((!giver || giver.full_name === 'Thành viên Liên Chiểu') && item?.donor) {
      giver = item.donor;
    }
    let receiver = profiles.find((p) => p.id === t.receiver_id);
    if ((!receiver || receiver.full_name === 'Thành viên Liên Chiểu') && currentUser?.id === t.receiver_id) {
      receiver = currentUser;
    }
    return { ...t, item, giver, receiver };
  };

  const createTradeRequest = (params: {
    itemId: string;
    pickupLocation: string;
    note?: string;
    scheduledDate?: string;
  }): Transaction => {
    const targetItem = getItemById(params.itemId) || items.find((i) => i.id === params.itemId);
    if (!targetItem) throw new Error('Không tìm thấy thông tin món đồ.');
    if (!currentUser) {
      throw new Error('Vui lòng đăng nhập để thực hiện yêu cầu nhận đồ');
    }
    if (isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai, không thể gửi yêu cầu nhận đồ.');
    }
    const receiverId = currentUser.id;
    const receiverName = currentUser.full_name;

    const myAliasIds = getUserAliasIds(currentUser.id);

    // 1. Donor cannot request their own item
    if (
      myAliasIds.includes(targetItem.user_id) ||
      (targetItem.donor?.email && currentUser.email && targetItem.donor.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
    ) {
      throw new Error('Bạn là người đăng món đồ này, không thể gửi yêu cầu nhận chính đồ của mình.');
    }

    // 2. Check if this exact user already has an active or pending request for this item
    const existingActive = transactions.find(
      (t) => t.item_id === params.itemId && myAliasIds.includes(t.receiver_id) && t.status !== 'CANCELLED'
    );
    if (existingActive) {
      throw new Error('Bạn đã gửi yêu cầu nhận món đồ này rồi. Hãy chờ người đăng xem xét chọn!');
    }

    const newTransaction: Transaction = {
      id: `tr-${Date.now()}`,
      item_id: params.itemId,
      giver_id: targetItem.user_id,
      receiver_id: receiverId,
      status: 'REQUESTED',
      pickup_location: params.pickupLocation,
      note: params.note || 'Hẹn gặp tại điểm trao đổi đã thống nhất.',
      scheduled_date: params.scheduledDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const currentWaitCount = transactions.filter(
      (t) => t.item_id === params.itemId && t.status !== 'CANCELLED'
    ).length + 1;

    const donorNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: targetItem.user_id,
      title: 'Đề nghị nhận đồ mới!',
      content: `${receiverName} muốn nhận món "${targetItem.title}" (Hàng chờ hiện có: ${currentWaitCount} người). Hãy chọn bạn phù hợp để trao đồ!`,
      is_read: false,
      action_link: `/items/${targetItem.id}`,
      type: 'trade',
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    setNotifications((prev) => [donorNotif, ...prev]);

    // Note: Do not lock item into IN_PROGRESS immediately on request!
    // The item remains open so multiple students can join the queue until the owner chooses one.

    if (isSupabaseConfigured() && supabase) {
      const sb = supabase;
      const pushTrade = async () => {
        try {
          await ensureProfileInSupabase(targetItem.donor || targetItem.user_id);
          await ensureProfileInSupabase(currentUser || receiverId);
          const { item, giver, receiver, ...dbTrade } = newTransaction;
          await sb.from('transactions').upsert(dbTrade);
          await sb.from('notifications').upsert(donorNotif);
        } catch (err) {
          console.error('Supabase createTradeRequest error:', err);
        }
      };
      pushTrade();
    }

    return newTransaction;
  };

  const pushNotification = (notif: NotificationItem) => {
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    if (isSupabaseConfigured() && supabase) {
      supabase.from('notifications').upsert(notif).then(() => {});
    }
  };

  const advanceTradeStatus = (transactionId: string, nextStatus: TradeStatus) => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
    }
    const currentTrans = transactions.find((t) => t.id === transactionId);
    if (currentTrans?.status === 'CANCELLED') {
      throw new Error('Giao dịch này đã bị hủy hoặc bị khóa bởi Ban Quản Trị.');
    }
    const targetItem = currentTrans ? (getItemById(currentTrans.item_id) || items.find((i) => i.id === currentTrans.item_id)) : null;
    if (targetItem?.status === 'HIDDEN') {
      throw new Error('Món đồ đang bị Ban Quản Trị tạm khóa / đóng băng để xác minh vi phạm. Mọi thao tác tạm thời bị khóa!');
    }
    if (currentTrans && deletedItemIds.has(currentTrans.item_id)) {
      throw new Error('Món đồ này đã bị xóa hoàn toàn khỏi hệ thống!');
    }
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        const updated = {
          ...t,
          status: nextStatus,
          completed_at: nextStatus === 'COMPLETED' ? new Date().toISOString() : t.completed_at,
        };
        return updated;
      })
    );

    if (isSupabaseConfigured() && supabase) {
      supabase.from('transactions').update({
        status: nextStatus,
        completed_at: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      }).eq('id', transactionId).then(() => {});
    }

    if (nextStatus === 'ACCEPTED' && currentTrans) {
      // Mark item as IN_PROGRESS when owner accepts a requester
      updateItem(currentTrans.item_id, { status: 'IN_PROGRESS' });
      if (isSupabaseConfigured() && supabase) {
        supabase.from('items').update({ status: 'IN_PROGRESS' }).eq('id', currentTrans.item_id).then(() => {});
      }

      const giverName = currentUser?.full_name || 'Chủ món đồ';
      const acceptNotif: NotificationItem = {
        id: `notif-acc-${Date.now()}`,
        user_id: currentTrans.receiver_id,
        title: 'Chủ đồ đã duyệt yêu cầu của bạn! 🎉',
        content: `${giverName} đã chọn bạn để trao nhận món "${targetItem?.title || 'đồ dùng'}". Hãy bấm vào để xem điểm hẹn và tiến trình trao đồ!`,
        is_read: false,
        action_link: `/trades/${currentTrans.id}`,
        type: 'trade',
        created_at: new Date().toISOString(),
      };
      pushNotification(acceptNotif);
    }

    if (nextStatus === 'COMPLETED' && currentTrans) {
      const trans = currentTrans;
      updateItem(trans.item_id, { status: 'COMPLETED' });
      if (isSupabaseConfigured() && supabase) {
        supabase.from('items').update({ status: 'COMPLETED' }).eq('id', trans.item_id).then(() => {});
      }

      // Notify other remaining waitlisted users that the item has been completed
      const otherPending = transactions.filter(
        (t) => t.item_id === trans.item_id && t.id !== transactionId && t.status === 'REQUESTED'
      );
      otherPending.forEach((waitReq) => {
        const notif: NotificationItem = {
          id: `notif-closed-${Date.now()}-${waitReq.id}`,
          user_id: waitReq.receiver_id,
          title: 'Món đồ đã được trao cho bạn khác',
          content: `Món "${targetItem?.title || 'đồ dùng'}" trong hàng chờ của bạn đã được trao tặng thành công. Cảm ơn bạn đã quan tâm!`,
          is_read: false,
          action_link: `/items`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(notif);
      });

      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id === trans.giver_id) {
            return {
              ...p,
              items_given_count: (p.items_given_count || 0) + 1,
              completed_trades_count: (p.completed_trades_count || 0) + 1,
              reputation_score: (p.reputation_score || 50) + 20,
            };
          }
          if (p.id === trans.receiver_id) {
            return {
              ...p,
              completed_trades_count: (p.completed_trades_count || 0) + 1,
              reputation_score: (p.reputation_score || 50) + 10,
            };
          }
          return p;
        })
      );
    }
  };

  const confirmTradeHandover = async (transactionId: string, role: 'giver' | 'receiver') => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
    }
    const currentTrans = transactions.find((t) => t.id === transactionId);
    if (currentTrans?.status === 'CANCELLED') {
      throw new Error('Giao dịch này đã bị hủy hoặc bị khóa bởi Ban Quản Trị.');
    }
    const targetItem = currentTrans ? (getItemById(currentTrans.item_id) || items.find((i) => i.id === currentTrans.item_id)) : null;
    if (targetItem?.status === 'HIDDEN') {
      throw new Error('Món đồ đang bị Ban Quản Trị tạm khóa / đóng băng để xác minh vi phạm. Mọi thao tác bàn giao tạm thời bị khóa!');
    }
    if (currentTrans && deletedItemIds.has(currentTrans.item_id)) {
      throw new Error('Món đồ này đã bị xóa hoàn toàn khỏi hệ thống!');
    }
    let completedTrans: Transaction | null = null;
    const isGiver = role === 'giver';

    // Directly query database to see if the other user has already confirmed
    let dbOtherConfirmed = false;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: dbRow } = await supabase.from('transactions').select('*').eq('id', transactionId).maybeSingle();
        if (dbRow) {
          dbOtherConfirmed = isGiver ? Boolean(dbRow.receiver_confirmed) : Boolean(dbRow.giver_confirmed);
        }
      } catch (err) {
        console.warn('Check DB transaction status error:', err);
      }
    }

    let isBothConfirmedNow = false;

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        const updatedGiverConf = isGiver ? true : Boolean(t.giver_confirmed) || dbOtherConfirmed;
        const updatedReceiverConf = !isGiver ? true : Boolean(t.receiver_confirmed) || dbOtherConfirmed;
        const bothConfirmed = updatedGiverConf && updatedReceiverConf;
        isBothConfirmedNow = bothConfirmed;

        const updated: Transaction = {
          ...t,
          giver_confirmed: updatedGiverConf,
          receiver_confirmed: updatedReceiverConf,
          status: bothConfirmed ? 'COMPLETED' : t.status,
          completed_at: bothConfirmed ? new Date().toISOString() : t.completed_at,
        };

        if (bothConfirmed) {
          completedTrans = updated;
        }
        return updated;
      })
    );

    if (isSupabaseConfigured() && supabase) {
      const isNowCompleted = Boolean(completedTrans) || dbOtherConfirmed;
      const updates: any = {
        ...(isGiver ? { giver_confirmed: true } : { receiver_confirmed: true }),
        ...(isNowCompleted ? { status: 'COMPLETED', completed_at: new Date().toISOString() } : {}),
      };
      if (isNowCompleted) {
        if (isGiver) updates.receiver_confirmed = true;
        else updates.giver_confirmed = true;
      }
      supabase.from('transactions').update(updates).eq('id', transactionId).then(() => {});
    }

    const transForNotif = completedTrans || transactions.find((t) => t.id === transactionId);
    const targetItemForNotif = transForNotif ? (getItemById(transForNotif.item_id) || items.find((i) => i.id === transForNotif.item_id)) : null;

    if (!isBothConfirmedNow && transForNotif) {
      if (isGiver) {
        const gvConfNotif: NotificationItem = {
          id: `notif-gvconf-${Date.now()}`,
          user_id: transForNotif.receiver_id,
          title: 'Chủ đồ đã xác nhận bàn giao đồ! 🎁',
          content: `Chủ đồ đã xác nhận trao món "${targetItemForNotif?.title || 'đồ dùng'}". Bạn hãy kiểm tra và bấm xác nhận đã nhận đồ để hoàn tất nhé!`,
          is_read: false,
          action_link: `/trades/${transactionId}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(gvConfNotif);
      } else {
        const rcConfNotif: NotificationItem = {
          id: `notif-rcconf-${Date.now()}`,
          user_id: transForNotif.giver_id,
          title: 'Người nhận đã xác nhận nhận đồ! ✅',
          content: `Người nhận đã bấm xác nhận đã nhận món "${targetItemForNotif?.title || 'đồ dùng'}". Hãy xác nhận bàn giao để hoàn tất nhé!`,
          is_read: false,
          action_link: `/trades/${transactionId}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(rcConfNotif);
      }
    }

    if (completedTrans || dbOtherConfirmed) {
      const trans: Transaction | undefined = completedTrans || transactions.find((t) => t.id === transactionId);
      if (trans) {
        updateItem(trans.item_id, { status: 'COMPLETED' });
        setProfiles((prev) =>
          prev.map((p) => {
            if (p.id === trans.giver_id) {
              return {
                ...p,
                items_given_count: p.items_given_count + 1,
                completed_trades_count: p.completed_trades_count + 1,
                reputation_score: p.reputation_score + 20,
              };
            }
            if (p.id === trans.receiver_id) {
              return {
                ...p,
                completed_trades_count: p.completed_trades_count + 1,
                reputation_score: p.reputation_score + 10,
              };
            }
            return p;
          })
        );

        const giverNotif: NotificationItem = {
          id: `notif-comp-giver-${Date.now()}`,
          user_id: trans.giver_id,
          title: 'Trao đồ thành công! (+20 điểm) 🎉',
          content: `Cả hai bên đã xác nhận hoàn tất giao dịch món "${targetItemForNotif?.title || 'đồ dùng'}". Bạn nhận được +20 điểm uy tín đóng góp.`,
          is_read: false,
          action_link: `/trades/${trans.id}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        const receiverNotif: NotificationItem = {
          id: `notif-comp-receiver-${Date.now()}`,
          user_id: trans.receiver_id,
          title: 'Nhận đồ thành công! (+10 điểm) ⭐',
          content: `Cả hai bên đã xác nhận hoàn tất nhận món "${targetItemForNotif?.title || 'đồ dùng'}". Hãy để lại đánh giá cho người trao tặng nhé!`,
          is_read: false,
          action_link: `/trades/${trans.id}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(giverNotif);
        pushNotification(receiverNotif);
      }
    }
  };

  const getUserAliasIds = (userId: string | null | undefined): string[] => {
    if (!userId) return [];
    const baseProfile = profiles.find((p) => p.id === userId) || currentUser;
    const ids = new Set<string>([userId]);
    if (baseProfile?.email && baseProfile.email.trim()) {
      const cleanEmail = baseProfile.email.trim().toLowerCase();
      profiles
        .filter((p) => p.email && p.email.trim().toLowerCase() === cleanEmail)
        .forEach((p) => ids.add(p.id));
    }
    return Array.from(ids);
  };

  const cancelTrade = async (transactionId: string, reason?: string) => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
    }
    let trans = transactions.find((t) => t.id === transactionId);
    if (!trans && isSupabaseConfigured() && supabase) {
      try {
        const { data: dbTx } = await supabase.from('transactions').select('*').eq('id', transactionId).maybeSingle();
        if (dbTx) {
          trans = dbTx;
        }
      } catch (err) {
        console.warn('Fallback fetch trade error in cancelTrade:', err);
      }
    }
    if (!trans) throw new Error('Không tìm thấy phiên giao dịch');

    const myAliasIds = getUserAliasIds(currentUser?.id);
    const isCallerGiver = myAliasIds.includes(trans.giver_id);
    const isCallerReceiver = myAliasIds.includes(trans.receiver_id);

    // Rule: "chỉ dc hủy trước bước xác nhận của ng kia"
    // If it's a pending waitlist request (REQUESTED), it can be cancelled freely by either party!
    // Admin has emergency authority to cancel any trade reported for violations!
    const isWaitlistRequest = trans.status === 'REQUESTED';
    const isAdmin = currentUser?.role === 'admin' || Boolean(reason?.toLowerCase().includes('admin'));

    if (!isAdmin && !isWaitlistRequest) {
      const otherAlreadyConfirmed = isCallerGiver
        ? Boolean(trans.receiver_confirmed)
        : isCallerReceiver
        ? Boolean(trans.giver_confirmed)
        : Boolean(trans.giver_confirmed || trans.receiver_confirmed);

      if (otherAlreadyConfirmed) {
        throw new Error('Không thể hủy giao dịch vì đối phương đã bấm xác nhận bàn giao!');
      }
      if (trans.status === 'COMPLETED') {
        throw new Error('Không thể hủy giao dịch đã hoàn tất!');
      }
    }

    const cancelerName = currentUser?.full_name || 'Một bên tham gia';
    const otherUserId = isCallerGiver ? trans.receiver_id : trans.giver_id;
    const targetItem = getItemById(trans.item_id) || items.find((i) => i.id === trans.item_id);

    // 1. Update transaction status to CANCELLED and reset confirmations
    setTransactions((prev) => {
      const next = prev.map((t) => {
        const isTarget = t.id === transactionId || (trans.item_id && t.item_id === trans.item_id && t.status !== 'COMPLETED');
        if (isTarget) {
          return {
            ...t,
            status: 'CANCELLED' as TradeStatus,
            giver_confirmed: false,
            receiver_confirmed: false,
            completed_at: undefined,
          };
        }
        return t;
      });
      if (!next.some((t) => t.id === transactionId)) {
        next.unshift({
          ...trans,
          status: 'CANCELLED' as TradeStatus,
          giver_confirmed: false,
          receiver_confirmed: false,
          completed_at: undefined,
        });
      }
      safeSaveStorage(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(next));
      return next;
    });

    // 2. Return item to ACTIVE (initial state like newly posted)
    if (trans.item_id) {
      updateItem(trans.item_id, { status: 'ACTIVE' });
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        const itemPromise = trans.item_id
          ? supabase.from('items').update({ status: 'ACTIVE' }).eq('id', trans.item_id)
          : Promise.resolve();

        const tradePromise = trans.item_id
          ? supabase.from('transactions').update({
              status: 'CANCELLED',
              giver_confirmed: false,
              receiver_confirmed: false,
              completed_at: null,
            }).eq('item_id', trans.item_id).neq('status', 'COMPLETED')
          : supabase.from('transactions').update({
              status: 'CANCELLED',
              giver_confirmed: false,
              receiver_confirmed: false,
              completed_at: null,
            }).eq('id', transactionId);

        const singleTradePromise = supabase.from('transactions').update({
          status: 'CANCELLED',
          giver_confirmed: false,
          receiver_confirmed: false,
          completed_at: null,
        }).eq('id', transactionId);

        await Promise.allSettled([itemPromise, tradePromise, singleTradePromise]);
      } catch (err) {
        console.warn('Supabase cancel trade error:', err);
      }
    }

    broadcastKdlcSync('TRADE_CANCELLED', transactionId);
    if (trans.item_id) {
      broadcastKdlcSync('ITEM_RESTORED', trans.item_id);
    }

    // 4. Notifications
    const remainingWaitlist = transactions.filter(
      (t) => t.item_id === trans.item_id && t.id !== transactionId && t.status === 'REQUESTED'
    );

    if (isWaitlistRequest) {
      if (isCallerReceiver) {
        // Requester voluntarily leaves the queue
        const cancelNotif: NotificationItem = {
          id: `notif-cancel-${Date.now()}`,
          user_id: trans.giver_id,
          title: 'Một yêu cầu trong hàng chờ đã được rút lại',
          content: `${cancelerName} đã hủy yêu cầu nhận món "${targetItem?.title || 'đồ dùng'}".`,
          is_read: false,
          action_link: `/items/${trans.item_id}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(cancelNotif);
      } else {
        // Owner rejects/cancels this waitlist request
        const rejectNotif: NotificationItem = {
          id: `notif-cancel-${Date.now()}`,
          user_id: trans.receiver_id,
          title: 'Yêu cầu nhận đồ chưa được duyệt',
          content: `Chủ món đồ "${targetItem?.title || 'đồ dùng'}" chưa thể trao cho bạn lần này.${reason ? ` Lý do: "${reason}".` : ''}`,
          is_read: false,
          action_link: `/items/${trans.item_id}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(rejectNotif);
      }
    } else {
      // Active trade cancelled
      const cancelNotif: NotificationItem = {
        id: `notif-cancel-${Date.now()}`,
        user_id: otherUserId,
        title: 'Phiên trao đổi đã được khóa / hủy ⚠️',
        content: `${cancelerName} đã khóa phiên trao đổi món "${targetItem?.title || 'đồ dùng'}". ${reason ? `Lý do: "${reason}". ` : ''}Món đồ đã được đưa về trạng thái ban đầu để sẵn sàng chia sẻ.`,
        is_read: false,
        action_link: `/items/${trans.item_id}`,
        type: 'trade',
        created_at: new Date().toISOString(),
      };
      pushNotification(cancelNotif);

      // Notify owner that remaining waitlist members can now be picked!
      if (!isCallerGiver && remainingWaitlist.length > 0) {
        const queuePromptNotif: NotificationItem = {
          id: `notif-queue-${Date.now()}`,
          user_id: trans.giver_id,
          title: 'Bạn có thể chọn người tiếp theo trong hàng chờ! 📋',
          content: `Phiên trao đổi trước đã được khóa. Món "${targetItem?.title}" vẫn còn ${remainingWaitlist.length} bạn đang chờ trong danh sách!`,
          is_read: false,
          action_link: `/items/${trans.item_id}`,
          type: 'trade',
          created_at: new Date().toISOString(),
        };
        pushNotification(queuePromptNotif);
      }
    }
  };

  const restoreTrade = async (transactionId: string) => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng.');
    }
    let trans = transactions.find((t) => t.id === transactionId);
    if (!trans && isSupabaseConfigured() && supabase) {
      try {
        const { data: dbTx } = await supabase.from('transactions').select('*').eq('id', transactionId).maybeSingle();
        if (dbTx) {
          trans = dbTx;
        }
      } catch {}
    }
    if (!trans) throw new Error('Không tìm thấy phiên giao dịch');

    const nextStatus: TradeStatus = 'ACCEPTED';
    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === transactionId);
      const next = exists
        ? prev.map((t) => (t.id === transactionId ? { ...t, status: nextStatus, completed_at: undefined } : t))
        : [{ ...trans, status: nextStatus, completed_at: undefined }, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(next));
      } catch {}
      return next;
    });

    updateItem(trans.item_id, { status: 'IN_PROGRESS' });

    if (isSupabaseConfigured() && supabase) {
      try {
        await Promise.race([
          Promise.all([
            supabase.from('transactions').update({ status: nextStatus, completed_at: null }).eq('id', transactionId),
            supabase.from('items').update({ status: 'IN_PROGRESS' }).eq('id', trans.item_id),
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase restore trade timeout')), 4000)),
        ]);
      } catch (err) {
        console.warn('Supabase restore trade error/timeout:', err);
      }
    }

    const targetItem = getItemById(trans.item_id) || items.find((i) => i.id === trans.item_id);

    const unfreezeNotif: NotificationItem = {
      id: `notif-unfreeze-${Date.now()}`,
      user_id: trans.receiver_id,
      title: 'Phiên giao dịch đã được mở lại! 🔓',
      content: `Phiên giao dịch trao đổi món "${targetItem?.title || 'đồ dùng'}" đã được kích hoạt lại. Bạn có thể tiếp tục tiến trình bàn giao.`,
      is_read: false,
      action_link: `/trades/${trans.id}`,
      type: 'trade',
      created_at: new Date().toISOString(),
    };
    pushNotification(unfreezeNotif);

    broadcastKdlcSync('TRADE_RESTORED', transactionId);
  };

  const sendTradeMessage = async (transactionId: string, content: string) => {
    if (currentUser && isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai, không thể gửi tin nhắn.');
    }
    if (!content.trim()) return;
    const trans = transactions.find((t) => t.id === transactionId);
    if (!trans) return;

    let chatData: { initialNote: string; messages: any[] } = {
      initialNote: '',
      messages: [],
    };

    if (trans.note) {
      try {
        const parsed = JSON.parse(trans.note);
        if (Array.isArray(parsed.messages)) {
          chatData = parsed;
        } else {
          chatData.initialNote = trans.note;
        }
      } catch {
        chatData.initialNote = trans.note;
      }
    }

    const senderId = currentUser?.id || 'usr-anonymous';
    const senderName = currentUser?.full_name || 'Bạn';
    const senderAvatar = currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    chatData.messages.push(newMsg);
    const updatedNote = JSON.stringify(chatData);

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, note: updatedNote } : t))
    );

    if (isSupabaseConfigured() && supabase) {
      supabase.from('transactions').update({ note: updatedNote }).eq('id', transactionId).then(() => {});
    }

    // Determine sender aliases to prevent sending notification to oneself
    const senderAliases = new Set<string>(getUserAliasIds(senderId));
    if (currentUser) {
      getUserAliasIds(currentUser.id).forEach((id) => senderAliases.add(id));
    }

    // Determine other user's ID
    let otherUserId = senderAliases.has(trans.giver_id) ? trans.receiver_id : trans.giver_id;
    if (senderAliases.has(otherUserId)) {
      otherUserId = senderAliases.has(trans.receiver_id) ? trans.giver_id : trans.receiver_id;
    }

    // Only create notification if recipient is genuinely NOT the sender
    if (!senderAliases.has(otherUserId) && otherUserId) {
      const msgNotif: NotificationItem = {
        id: `notif-msg-${Date.now()}`,
        user_id: otherUserId,
        title: `Tin nhắn mới từ ${senderName} 💬`,
        content: content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim(),
        is_read: false,
        action_link: `/trades/${transactionId}`,
        type: 'trade',
        created_at: new Date().toISOString(),
      };
      pushNotification(msgNotif);
    }
  };

  const submitReview = (params: {
    transactionId: string;
    revieweeId: string;
    rating: number;
    comment: string;
  }) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập để gửi đánh giá');
    if (isUserLocked(currentUser)) {
      throw new Error('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
    }
    const reviewerId = currentUser.id;
    const reviewerName = currentUser.full_name;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      transaction_id: params.transactionId,
      reviewer_id: reviewerId,
      reviewee_id: params.revieweeId,
      rating: params.rating,
      comment: params.comment,
      created_at: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);

    if (isSupabaseConfigured() && supabase) {
      const sb = supabase;
      const pushReview = async () => {
        try {
          await ensureProfileInSupabase(reviewerId);
          await ensureProfileInSupabase(params.revieweeId);
          await sb.from('reviews').upsert(newReview);
          await sb.from('notifications').upsert(notif);
        } catch (err) {
          console.error('Supabase submitReview error:', err);
        }
      };
      pushReview();
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: params.revieweeId,
      title: 'Đánh giá mới từ bạn cùng trao đổi ⭐',
      content: `${reviewerName} đã gửi đánh giá ${params.rating} sao: "${params.comment}"`,
      is_read: false,
      action_link: '/profile',
      type: 'review',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(itemId);
      const updated = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, favorites_count: Math.max(0, item.favorites_count + (exists ? -1 : 1)) }
            : item
        )
      );
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers: profiles,
        switchUser,
        login,
        loginWithOAuth,
        logout,
        registerUser,
        updateProfile,
        items,
        getItemById,
        addItem,
        updateItem,
        deleteItem,
        approveItem,
        rejectItem,
        transactions,
        getTransactionById,
        createTradeRequest,
        advanceTradeStatus,
        confirmTradeHandover,
        cancelTrade,
        restoreTrade,
        sendTradeMessage,
        reviews,
        submitReview,
        notifications,
        markNotificationAsRead,
        favorites,
        toggleFavorite,
        toggleLockUser,
        lockUser,
        unlockUser,
        isUserLocked,
        reports,
        submitReport,
        resolveReport,
        adminHideItem,
        adminRestoreItem,
        deletedItemIds,
        isSupabaseMode: isSupabaseConfigured(),
        activeRole: currentUser ? (isUserLocked(currentUser) ? 'guest' : currentUser.role) : 'guest',
        isInitialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
