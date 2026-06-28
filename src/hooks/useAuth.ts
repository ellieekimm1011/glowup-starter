"use client";
// hooks/useAuth.ts
// A React hook that gives any component easy access to the current user.
// Components import this to know if someone is logged in.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current user on first load
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for login/logout events and update state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Convenience function to log out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
}
