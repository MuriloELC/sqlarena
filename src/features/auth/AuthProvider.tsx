import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export type AppProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: "student" | "admin";
  total_points: number;
};

type SignUpInput = {
  displayName: string;
  username: string;
  email: string;
  password: string;
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
  signInWithProvider: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: User) => {
    const username = user.user_metadata?.username || `user_${user.id.slice(0, 8)}`;
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuario";

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: "student",
      }, { onConflict: "id" })
      .select("id, username, display_name, avatar_url, role, total_points")
      .single();

    if (error) throw error;
    return data as AppProfile;
  };

  const loadProfile = async (user: User) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, role, total_points")
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
    async signUp({ displayName, username, email, password }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username,
          },
        },
      });
      if (error) throw error;

      if (data.session?.user) {
        await ensureProfile(data.session.user);
      }

      return { needsEmailConfirmation: Boolean(data.user && !data.session) };
    },
    async signInWithProvider(provider) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
