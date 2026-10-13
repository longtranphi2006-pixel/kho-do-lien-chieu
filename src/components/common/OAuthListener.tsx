'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function OAuthListener() {
  const router = useRouter();
  const { loginWithOAuth } = useAppStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';

    if (
      !hash.includes('access_token') &&
      !hash.includes('id_token') &&
      !search.includes('access_token') &&
      !search.includes('id_token')
    ) {
      return;
    }

    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    const searchParams = new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const idToken = hashParams.get('id_token') || searchParams.get('id_token');
    const state = hashParams.get('state') || searchParams.get('state');

    // 1. Facebook OAuth Callback
    if (state === 'facebook_auth' && accessToken) {
      fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture.width(400).height(400)&access_token=${accessToken}`
      )
        .then((res) => res.json())
        .then((fbUser) => {
          if (fbUser && fbUser.name) {
            loginWithOAuth({
              provider: 'Facebook',
              name: fbUser.name,
              email: fbUser.email || `${fbUser.id}@facebook.user`,
              avatar_url:
                fbUser.picture?.data?.url ||
                'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
            });
            window.history.replaceState(null, '', window.location.pathname);
            window.location.href = '/';
          }
        })
        .catch((err) => {
          console.error('Lỗi lấy thông tin Facebook:', err);
        });
      return;
    }

    // 2. Google OAuth ID Token Callback
    if (idToken) {
      const payload = parseJwt(idToken);
      if (payload && (payload.email || payload.name)) {
        loginWithOAuth({
          provider: 'Google',
          name: payload.name || payload.email?.split('@')[0] || 'Người dùng Google',
          email: payload.email || `${payload.sub || Date.now()}@gmail.com`,
          avatar_url:
            payload.picture ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        });
        window.history.replaceState(null, '', window.location.pathname);
        window.location.href = '/';
        return;
      }
    }

    // 3. Google OAuth Access Token Callback
    if (accessToken) {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((googleUser) => {
          if (googleUser && (googleUser.email || googleUser.name)) {
            loginWithOAuth({
              provider: 'Google',
              name: googleUser.name || googleUser.email?.split('@')[0] || 'Người dùng Google',
              email: googleUser.email || `${Date.now()}@gmail.com`,
              avatar_url:
                googleUser.picture ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
            });
            window.history.replaceState(null, '', window.location.pathname);
            window.location.href = '/';
          }
        })
        .catch((err) => {
          console.error('Lỗi lấy thông tin Google:', err);
        });
    }
  }, [loginWithOAuth, router]);

  return null;
}
