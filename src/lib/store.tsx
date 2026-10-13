'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Item, Transaction, Review, NotificationItem, TradeStatus, ItemStatus } from '@/types';
import { MOCK_PROFILES, MOCK_ITEMS, MOCK_TRANSACTIONS, MOCK_REVIEWS, MOCK_NOTIFICATIONS } from '@/lib/mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>('usr-an-bachkhoa');
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

      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedUserId !== null) {
        // If explicitly set to empty string, user is logged out
        setCurrentUserId(savedUserId ? savedUserId : null);
      }

      const savedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (savedItems) setItems(JSON.parse(savedItems));

      const savedTrans = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTrans) setTransactions(JSON.parse(savedTrans));

      const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (savedReviews) setReviews(JSON.parse(savedReviews));

      const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

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

  const currentUser = currentUserId ? profiles.find((p) => p.id === currentUserId) || null : null;

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

    setProfiles((prev) => [...prev, newProfile]);
    setCurrentUserId(newProfile.id);
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
      setCurrentUserId(existing.id);
      return existing;
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

    setProfiles((prev) => [...prev, newProfile]);
    setCurrentUserId(newProfile.id);
    return newProfile;
  };

  const logout = () => {
    setCurrentUserId(null);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, '');
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
    return newProfile;
  };

  const getItemById = (id: string): Item | undefined => {
    const item = items.find((i) => i.id === id);
    if (!item) return undefined;
    const donor = profiles.find((p) => p.id === item.user_id);
    return { ...item, donor };
  };

  const addItem = (newItemData: Omit<Item, 'id' | 'created_at' | 'favorites_count'>): Item => {
    const newItem: Item = {
      ...newItemData,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      favorites_count: 0,
    };
    setItems((prev) => [newItem, ...prev]);

    if (newItem.status === 'PENDING_ADMIN') {
      const adminNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        user_id: 'usr-admin-lienchieu',
        title: 'Mục đăng cần kiểm duyệt AI',
        content: `Món đồ "${newItem.title}" cần phê duyệt thủ công do cờ kiểm duyệt.`,
        is_read: false,
        action_link: '/admin',
        type: 'moderation',
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [adminNotif, ...prev]);
    }

    return newItem;
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const approveItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'ACTIVE' as ItemStatus, ai_moderation_reason: 'Quản trị viên đã phê duyệt công khai.' }
          : item
      )
    );
  };

  const rejectItem = (id: string, reason = 'Vi phạm quy định phi thương mại hoặc an toàn cộng đồng') => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'REJECTED' as ItemStatus, ai_moderation_reason: reason }
          : item
      )
    );
  };

  const getTransactionById = (id: string): Transaction | undefined => {
    const t = transactions.find((item) => item.id === id);
    if (!t) return undefined;
    const item = items.find((i) => i.id === t.item_id);
    const giver = profiles.find((p) => p.id === t.giver_id);
    const receiver = profiles.find((p) => p.id === t.receiver_id);
    return { ...t, item, giver, receiver };
  };

  const createTradeRequest = (params: {
    itemId: string;
    pickupLocation: string;
    note?: string;
    scheduledDate?: string;
  }): Transaction => {
    const targetItem = items.find((i) => i.id === params.itemId);
    if (!targetItem) throw new Error('Item not found');

    const receiverId = currentUser?.id || 'usr-an-bachkhoa';
    const receiverName = currentUser?.full_name || 'Một bạn sinh viên';

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

    if (nextStatus === 'COMPLETED') {
      const trans = transactions.find((t) => t.id === transactionId);
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

  const submitReview = (params: {
    transactionId: string;
    revieweeId: string;
    rating: number;
    comment: string;
  }) => {
    const reviewerId = currentUser?.id || 'usr-an-bachkhoa';
    const reviewerName = currentUser?.full_name || 'Bạn cùng trao đổi';

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
        reviews,
        submitReview,
        notifications,
        markNotificationAsRead,
        favorites,
        toggleFavorite,
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
