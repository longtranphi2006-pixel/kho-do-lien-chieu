'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Item, Transaction, Review, NotificationItem, TradeStatus, ItemStatus } from '@/types';
import { MOCK_PROFILES, MOCK_ITEMS, MOCK_TRANSACTIONS, MOCK_REVIEWS, MOCK_NOTIFICATIONS } from '@/lib/mock-data';
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
  items: Item[];
  getItemById: (id: string) => Item | undefined;
  addItem: (newItem: Omit<Item, 'id' | 'created_at' | 'favorites_count'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
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
  isSupabaseMode: boolean;
  activeRole: 'user' | 'admin' | 'guest';
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
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [favorites, setFavorites] = useState<string[]>(['item-01', 'item-04']);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (savedProfiles) setProfiles(JSON.parse(savedProfiles));

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

      const savedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (savedItems) setItems(JSON.parse(savedItems));

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
    } catch (e) {
      console.warn('LocalStorage load error, using default mock data', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId || '');
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [profiles, currentUserId, items, transactions, reviews, notifications, favorites, isInitialized]);

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
        address: pObj.address,
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

        // 1. NON-DESTRUCTIVE ITEMS MERGE:
        // Keep any newly added local items that haven't landed in Supabase yet, and auto-push them!
        if (itemsRes.data) {
          const dbItems = itemsRes.data as Item[];
          const dbItemIds = new Set(dbItems.map((i) => i.id));

          setItems((prev) => {
            const pendingSync = prev.filter((i) => !dbItemIds.has(i.id));

            // Background push un-synced items to Supabase
            if (pendingSync.length > 0) {
              pendingSync.forEach(async (pending) => {
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
            profilesRes.data!.forEach((p: Profile) => {
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
            const merged = Array.from(map.values());
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
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as Item, ...prev.filter((i) => i.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) => prev.map((i) => (i.id === payload.new.id ? (payload.new as Item) : i)));
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
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
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Guaranteed polling heartbeat every 6 seconds across mobile & desktop
    const pollTimer = setInterval(() => {
      syncFromSupabase();
    }, 6000);

    return () => {
      isMounted = false;
      sb.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
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
      const updated = [...prev, newProfile];
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
    const existing = profiles.find((p) => p.email && p.email.toLowerCase() === cleanEmail);

    if (existing) {
      const updated: Profile = {
        ...existing,
        full_name: params.name || existing.full_name,
        avatar_url: params.avatar_url || existing.avatar_url,
      };
      setProfiles((prev) => {
        const list = prev.map((p) => (p.id === existing.id ? updated : p));
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

    const newProfile: Profile = {
      id: `usr-oauth-${Date.now()}`,
      full_name: params.name || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Người dùng Google'),
      avatar_url:
        params.avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      email: cleanEmail,
      university: 'Đại học Đà Nẵng',
      department: 'Sinh viên xác thực qua ' + params.provider,
      is_verified: true,
      reputation_score: 0,
      items_given_count: 0,
      completed_trades_count: 0,
      role: cleanEmail.includes('admin') ? 'admin' : 'user',
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => {
      const updated = [...prev, newProfile];
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

  const getItemById = (id: string): Item | undefined => {
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
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

    if (isSupabaseConfigured() && supabase) {
      supabase.from('items').update(updates).eq('id', id).then(() => {});
    }
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (isSupabaseConfigured() && supabase) {
      supabase.from('items').delete().eq('id', id).then(() => {});
    }
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

  const toggleLockUser = (userId: string) => {
    let nextLockedState = false;
    setProfiles((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          nextLockedState = !u.is_locked;
          return { ...u, is_locked: nextLockedState };
        }
        return u;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (isSupabaseConfigured() && supabase) {
      supabase.from('profiles').update({ is_locked: nextLockedState }).eq('id', userId).then(() => {});
    }
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
    if (!targetItem) throw new Error('Item not found');
    if (!currentUser) {
      throw new Error('Vui lòng đăng nhập để thực hiện yêu cầu nhận đồ');
    }
    const receiverId = currentUser.id;
    const receiverName = currentUser.full_name;

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

    setTransactions((prev) => [newTransaction, ...prev]);
    updateItem(params.itemId, { status: 'IN_PROGRESS' });

    if (isSupabaseConfigured() && supabase) {
      const sb = supabase;
      const pushTrade = async () => {
        try {
          await ensureProfileInSupabase(targetItem.donor || targetItem.user_id);
          await ensureProfileInSupabase(currentUser || receiverId);
          await sb.from('transactions').upsert(newTransaction);
          await sb.from('items').update({ status: 'IN_PROGRESS' }).eq('id', params.itemId);
          await sb.from('notifications').upsert(donorNotif);
        } catch (err) {
          console.error('Supabase createTradeRequest error:', err);
        }
      };
      pushTrade();
    }

    const donorNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: targetItem.user_id,
      title: 'Đề nghị nhận đồ mới!',
      content: `${receiverName} muốn nhận món "${targetItem.title}".`,
      is_read: false,
      action_link: `/trades/${newTransaction.id}`,
      type: 'trade',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [donorNotif, ...prev]);

    return newTransaction;
  };

    const pushNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      if (isSupabaseConfigured() && supabase) {
        supabase.from('notifications').upsert(notif).then(() => {});
      }
    };

    const advanceTradeStatus = (transactionId: string, nextStatus: TradeStatus) => {
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

    const currentTrans = transactions.find((t) => t.id === transactionId);
    const targetItem = currentTrans ? (getItemById(currentTrans.item_id) || items.find((i) => i.id === currentTrans.item_id)) : null;

    if (nextStatus === 'ACCEPTED' && currentTrans) {
      const acceptNotif: NotificationItem = {
        id: `notif-acc-${Date.now()}`,
        user_id: currentTrans.receiver_id,
        title: 'Chủ đồ đã duyệt yêu cầu nhận đồ! 🎉',
        content: `Yêu cầu nhận món "${targetItem?.title || 'đồ dùng'}" đã được chủ đồ chấp thuận. Hãy chuẩn bị gặp trao đồ tại điểm hẹn!`,
        is_read: false,
        action_link: `/trades/${currentTrans.id}`,
        type: 'trade',
        created_at: new Date().toISOString(),
      };
      pushNotification(acceptNotif);
    }

    if (nextStatus === 'COMPLETED') {
      const trans = currentTrans;
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
      }
    }
  };

  const confirmTradeHandover = async (transactionId: string, role: 'giver' | 'receiver') => {
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
    if (baseProfile?.email) {
      profiles
        .filter((p) => p.email && p.email.toLowerCase() === baseProfile.email?.toLowerCase())
        .forEach((p) => ids.add(p.id));
    }
    if (baseProfile?.email?.toLowerCase().includes('longtranphi22006') || baseProfile?.full_name === 'Trần Đức Long') {
      ids.add('usr-oauth-1791897070645');
      ids.add('usr-oauth-1791902102209');
    }
    if (baseProfile?.email?.toLowerCase().includes('longtranphi2006') || baseProfile?.full_name?.includes('18.Trần Lê Phi Long')) {
      ids.add('usr-oauth-1791899728239');
    }
    return Array.from(ids);
  };

  const cancelTrade = async (transactionId: string, reason?: string) => {
    const trans = transactions.find((t) => t.id === transactionId);
    if (!trans) throw new Error('Không tìm thấy phiên giao dịch');

    const myAliasIds = getUserAliasIds(currentUser?.id);
    const isCallerGiver = myAliasIds.includes(trans.giver_id);
    const isCallerReceiver = myAliasIds.includes(trans.receiver_id);

    // Rule: "chỉ dc hủy trước bước xác nhận của ng kia"
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

    const cancelerName = currentUser?.full_name || 'Một bên tham gia';
    const otherUserId = isCallerGiver ? trans.receiver_id : trans.giver_id;
    const targetItem = getItemById(trans.item_id) || items.find((i) => i.id === trans.item_id);

    // 1. Update transaction status to CANCELLED
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'CANCELLED' as TradeStatus } : t))
    );

    // 2. Restore item status back to ACTIVE so other students can request it
    updateItem(trans.item_id, { status: 'ACTIVE' });

    // 3. Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase.from('transactions').update({ status: 'CANCELLED' }).eq('id', transactionId).then(() => {});
      supabase.from('items').update({ status: 'ACTIVE' }).eq('id', trans.item_id).then(() => {});
    }

    // 4. Notify other party
    const cancelNotif: NotificationItem = {
      id: `notif-cancel-${Date.now()}`,
      user_id: otherUserId,
      title: 'Phiên trao đổi đã được hủy ⚠️',
      content: `${cancelerName} đã hủy phiên trao đổi món "${targetItem?.title || 'đồ dùng'}". ${reason ? `Lý do: "${reason}". ` : ''}Món đồ đã được mở lại công khai.`,
      is_read: false,
      action_link: `/items/${trans.item_id}`,
      type: 'trade',
      created_at: new Date().toISOString(),
    };
    pushNotification(cancelNotif);
  };

  const sendTradeMessage = async (transactionId: string, content: string) => {
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
    const senderAliases = new Set<string>([senderId]);
    if (currentUser) {
      senderAliases.add(currentUser.id);
      profiles
        .filter(
          (u) =>
            (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (u.full_name && currentUser.full_name && u.full_name === currentUser.full_name && u.full_name !== 'Thành viên Liên Chiểu')
        )
        .forEach((u) => senderAliases.add(u.id));
      if (currentUser.email?.toLowerCase().includes('long') || currentUser.full_name?.includes('Long')) {
        senderAliases.add('usr-oauth-1791897070645');
        senderAliases.add('usr-oauth-1791902102209');
        senderAliases.add('usr-oauth-1791899728239');
      }
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
        sendTradeMessage,
        reviews,
        submitReview,
        notifications,
        markNotificationAsRead,
        favorites,
        toggleFavorite,
        toggleLockUser,
        isSupabaseMode: isSupabaseConfigured(),
        activeRole: currentUser ? currentUser.role : 'guest',
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
