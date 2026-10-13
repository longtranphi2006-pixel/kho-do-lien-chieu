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

    const hash = window.location.hash;
    if (!hash || (!hash.includes('access_token') && !hash.includes('id_token'))) {
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');
    const state = params.get('state');

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
            router.push('/');
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
      if (payload && payload.email) {
        loginWithOAuth({
          provider: 'Google',
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          avatar_url:
            payload.picture ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        });
        window.history.replaceState(null, '', window.location.pathname);
        router.push('/');
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
          if (googleUser && googleUser.email) {
            loginWithOAuth({
              provider: 'Google',
              name: googleUser.name || googleUser.email.split('@')[0],
              email: googleUser.email,
              avatar_url:
                googleUser.picture ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
            });
            window.history.replaceState(null, '', window.location.pathname);
            router.push('/');
          }
        })
        .catch((err) => {
          console.error('Lỗi lấy thông tin Google:', err);
        });
    }
  }, [loginWithOAuth, router]);

  return null;
}
