import { supabase, isSupabaseConfigured } from './supabase';

// Tables holding one JSON blob per signed-in user. Kept as a flat list so
// AuthContext's deleteAccount can loop over them without duplicating table
// names in two places.
export const SYNC_TABLES = ['hifz_plans', 'khatm_progress', 'bookmarks', 'reading_circle'];

async function getCurrentUserId() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// Write-through push: call this from a feature's save*() right after the
// local AsyncStorage write succeeds. Fire-and-forget on purpose — a
// signed-out user or an offline device behaves exactly as it did before
// sync existed, since nothing here can throw back into the caller.
export function pushUpdate(table, value) {
  if (!isSupabaseConfigured) return;
  getCurrentUserId()
    .then((userId) => {
      if (!userId) return null;
      return supabase
        .from(table)
        .upsert({ user_id: userId, data: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    })
    .then((result) => {
      if (result?.error) console.warn(`[sync] push failed for ${table}:`, result.error.message);
    })
    .catch((err) => console.warn(`[sync] push failed for ${table}:`, err.message));
}

// Called once per newly-active session (fresh sign-in, or app launch with an
// existing session already in AsyncStorage). `features` is
// [{ table, load, applyRemote }] — `load` reads the current local value,
// `applyRemote` writes a pulled cloud value into local storage without
// pushing it straight back to the cloud.
//
// If the cloud already has a row for this user, it wins and overwrites local
// storage — that's the account's cross-device state. If there's no cloud row
// yet, this is the first sync for this account, so whatever is already on
// this device (e.g. guest usage before creating the account) is uploaded
// instead of being silently discarded.
export async function syncOnSignIn(userId, features) {
  if (!isSupabaseConfigured || !userId) return;
  await Promise.all(features.map((feature) => syncFeature(feature, userId)));
}

async function syncFeature({ table, load, applyRemote }, userId) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      await applyRemote(data.data);
    } else {
      const local = await load();
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({ user_id: userId, data: local, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (upsertError) throw upsertError;
    }
  } catch (err) {
    console.warn(`[sync] sign-in sync failed for ${table}:`, err.message);
  }
}
