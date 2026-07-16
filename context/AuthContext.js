import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AuthContext = createContext({
  session: null,
  user: null,
  isAuthenticated: false,
  initializing: true,
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signInWithOAuth: async () => {},
  signOut: async () => {},
});

const redirectTo = makeRedirectUri({ scheme: 'quranapp', path: 'auth-callback' });

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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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
      await createSessionFromUrl(result.url);
    }
  };

  const signOut = async () => {
    ensureConfigured();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
