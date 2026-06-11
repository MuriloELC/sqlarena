import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { PRIVACY_VERSION, TERMS_VERSION } from "../legal/constants";

export type AppProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: "student" | "admin";
  total_points: number;
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
};

type SignUpInput = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

type SignUpResult = {
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AppProfile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  acceptLatestTerms: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const profileSelect = "id, username, display_name, avatar_url, role, total_points, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: User) => {
    const username = user.user_metadata?.username || `user_${user.id.slice(0, 8)}`;
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuario";
    const acceptedAt = user.user_metadata?.terms_accepted_at ?? null;

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return existing as AppProfile;

    const insert = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        terms_accepted_at: acceptedAt,
        terms_version: acceptedAt ? user.user_metadata?.terms_version ?? TERMS_VERSION : null,
        privacy_accepted_at: user.user_metadata?.privacy_accepted_at ?? acceptedAt,
        privacy_version: (user.user_metadata?.privacy_accepted_at ?? acceptedAt) ? user.user_metadata?.privacy_version ?? PRIVACY_VERSION : null,
      })
      .select(profileSelect)
      .single();

    if (!insert.error) return insert.data as AppProfile;
    if (insert.error.code !== "23505") throw insert.error;

    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data as AppProfile;
  };

  const loadProfile = async (user: User) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    setProfile(data ? data as AppProfile : await ensureProfile(user));
  };

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) await loadProfile(data.user);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user).catch(() => setProfile(null));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadProfile(nextSession.user).catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    async signInWithPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp({ displayName, username, email, password, acceptedTerms }) {
      if (!acceptedTerms) {
        throw new Error("E necessario aceitar os Termos de Uso e a Politica de Privacidade.");
      }

      const acceptedAt = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username,
            terms_accepted_at: acceptedAt,
            terms_version: TERMS_VERSION,
            privacy_accepted_at: acceptedAt,
            privacy_version: PRIVACY_VERSION,
          },
        },
      });
      if (error) throw error;

      if (data.session?.user) {
        await ensureProfile(data.session.user);
      }

      return { needsEmailConfirmation: Boolean(data.user && !data.session) };
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    async acceptLatestTerms() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sessao expirada. Entre novamente.");

      const acceptedAt = new Date().toISOString();
      const { data: nextProfile, error } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: acceptedAt,
          terms_version: TERMS_VERSION,
          privacy_accepted_at: acceptedAt,
          privacy_version: PRIVACY_VERSION,
          updated_at: acceptedAt,
        })
        .eq("id", data.user.id)
        .select(profileSelect)
        .single();

      if (error) throw error;
      setProfile(nextProfile as AppProfile);
    },
    refreshProfile,
  }), [loading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
