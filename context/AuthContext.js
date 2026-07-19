import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncOnSignIn, SYNC_TABLES } from '../lib/sync';
import { AVATAR_KEY } from '../utils/avatarPicker';
import { STORAGE_KEY as HIFZ_STORAGE_KEY, loadPlans as loadHifzPlans, applyRemotePlans } from '../utils/hifz';
import {
  STORAGE_KEY as KHATM_STORAGE_KEY,
  loadKhatmPlan,
  applyRemoteKhatmPlan,
} from '../utils/khatmStorage';
import { STORAGE_KEY as BOOKMARKS_STORAGE_KEY, loadBookmarks, applyRemoteBookmarks } from '../utils/bookmarks';
import { STORAGE_KEY as CIRCLE_STORAGE_KEY, loadCircle, applyRemoteCircle } from '../utils/readingCircle';
import {
  STORAGE_KEY as PROFILE_STATS_STORAGE_KEY,
  loadStatsBlob,
  applyRemoteStats,
} from '../utils/profileStats';

// One entry per SYNC_TABLES table — pairs each table with the local
// load/applyRemote functions the sign-in sync pass needs. Lives here (not in
// lib/sync.js) so lib/sync.js has no dependency on the feature modules,
// which in turn depend on lib/sync.js for pushUpdate — avoids a circular
// import between them.
const SYNC_FEATURES = [
  { table: 'hifz_plans', load: loadHifzPlans, applyRemote: applyRemotePlans },
  { table: 'khatm_progress', load: loadKhatmPlan, applyRemote: applyRemoteKhatmPlan },
  { table: 'bookmarks', load: loadBookmarks, applyRemote: applyRemoteBookmarks },
  { table: 'reading_circle', load: loadCircle, applyRemote: applyRemoteCircle },
  { table: 'profile_stats', load: loadStatsBlob, applyRemote: applyRemoteStats },
];

export const AuthContext = createContext({
  session: null,
  user: null,
  isAuthenticated: false,
  initializing: true,
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signInWithOAuth: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
});

const redirectTo = makeRedirectUri({ scheme: 'quranapp', path: 'auth-callback' });

// Local AsyncStorage keys that make up "the account": synced feature data
// (including streak/badge inputs) plus the profile fields on EditProfileScreen.
// App settings (theme, font, reciter, etc.) are left alone.
const ACCOUNT_LOCAL_KEYS = [
  HIFZ_STORAGE_KEY,
  KHATM_STORAGE_KEY,
  BOOKMARKS_STORAGE_KEY,
  CIRCLE_STORAGE_KEY,
  PROFILE_STATS_STORAGE_KEY,
  'profile_first_name',
  'profile_last_name',
  'profile_location',
  'profile_bio',
  AVATAR_KEY,
];

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Sign in isn’t set up yet — add your Supabase keys to .env first.');
  }
}

async function createSessionFromUrl(url) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return null;
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  // Tracks which user id we've already pulled/bootstrapped sync data for, so
  // token refreshes on the same session don't re-trigger a full sync.
  const syncedUserIdRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return;
    }

    const maybeSync = (nextSession) => {
      const userId = nextSession?.user?.id ?? null;
      if (userId && syncedUserIdRef.current !== userId) {
        syncedUserIdRef.current = userId;
        syncOnSignIn(userId, SYNC_FEATURES).catch(() => {});
      } else if (!userId) {
        syncedUserIdRef.current = null;
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
      maybeSync(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      maybeSync(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signUpWithEmail = async (email, password) => {
    ensureConfigured();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithEmail = async (email, password) => {
    ensureConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Supabase opens the provider's consent page in a browser tab; once it
  // redirects back to our custom scheme, the tokens arrive in the URL
  // fragment and get exchanged for a session manually (detectSessionInUrl is
  // off since RN has no URL bar to parse this from automatically).
  const signInWithOAuth = async (provider) => {
    ensureConfigured();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      return await createSessionFromUrl(result.url);
    }
    return null;
  };

  const signOut = async () => {
    ensureConfigured();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Deleting the auth.users record itself requires a service_role key, which
  // must never ship inside the app — that step is a TODO for a Supabase
  // Edge Function (or manual deletion in the dashboard) until then. This only
  // wipes the data this app controls: the user's cloud sync rows, their
  // session, and the local copies of that same data.
  const deleteAccount = async () => {
    ensureConfigured();
    const userId = session?.user?.id;
    if (userId) {
      await Promise.all(
        SYNC_TABLES.map((table) => supabase.from(table).delete().eq('user_id', userId)),
      );
    }
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove(ACCOUNT_LOCAL_KEYS);
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      initializing,
      signUpWithEmail,
      signInWithEmail,
      signInWithOAuth,
      signOut,
      deleteAccount,
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
