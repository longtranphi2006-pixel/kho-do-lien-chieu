'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Item, Transaction, Review, NotificationItem, TradeStatus, ItemStatus } from '@/types';
import { MOCK_PROFILES, MOCK_ITEMS, MOCK_TRANSACTIONS, MOCK_REVIEWS, MOCK_NOTIFICATIONS } from '@/lib/mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AppContextType {
  currentUser: Profile;
  allUsers: Profile[];
  switchUser: (userId: string) => void;
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
  activeRole: 'user' | 'admin';
  toggleRole: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'kdlc_current_user_id',
  ITEMS: 'kdlc_items_v2',
  TRANSACTIONS: 'kdlc_transactions_v2',
  REVIEWS: 'kdlc_reviews_v2',
  NOTIFICATIONS: 'kdlc_notifications_v2',
  FAVORITES: 'kdlc_favorites_v2',
  PROFILES: 'kdlc_profiles_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentUserId, setCurrentUserId] = useState<string>('usr-an-bachkhoa');
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
      if (savedUserId) setCurrentUserId(savedUserId);

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
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [profiles, currentUserId, items, transactions, reviews, notifications, favorites, isInitialized]);

  const currentUser = profiles.find((p) => p.id === currentUserId) || profiles[0];

  const switchUser = (userId: string) => {
    const user = profiles.find((p) => p.id === userId);
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const toggleRole = () => {
    if (currentUser.role === 'admin') {
      switchUser('usr-an-bachkhoa');
    } else {
      switchUser('usr-admin-lienchieu');
    }
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

    // If item was placed into review queue, create notification for admin
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

    const newTransaction: Transaction = {
      id: `tr-${Date.now()}`,
      item_id: params.itemId,
      giver_id: targetItem.user_id,
      receiver_id: currentUser.id,
      status: 'REQUESTED',
      pickup_location: params.pickupLocation,
      note: params.note || 'Hẹn gặp tại điểm trao đổi đã thống nhất.',
      scheduled_date: params.scheduledDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    // Mark item status as in progress
    updateItem(params.itemId, { status: 'IN_PROGRESS' });

    // Send notification to donor
    const donorNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: targetItem.user_id,
      title: 'Đề nghị nhận đồ mới!',
      content: `${currentUser.full_name} muốn nhận món "${targetItem.title}".`,
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

    // If completed, update item status and bump counts
    if (nextStatus === 'COMPLETED') {
      const trans = transactions.find((t) => t.id === transactionId);
      if (trans) {
        updateItem(trans.item_id, { status: 'COMPLETED' });
        // Award points to giver and receiver
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
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      transaction_id: params.transactionId,
      reviewer_id: currentUser.id,
      reviewee_id: params.revieweeId,
      rating: params.rating,
      comment: params.comment,
      created_at: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);

    // Send thank you notification to reviewee
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: params.revieweeId,
      title: 'Đánh giá mới từ bạn cùng trao đổi ⭐',
      content: `${currentUser.full_name} đã gửi đánh giá ${params.rating} sao: "${params.comment}"`,
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
      // update count
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
        activeRole: currentUser.role,
        toggleRole,
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
