// lib/supabase.ts
// This file creates the Supabase client used throughout the app.
// The client handles authentication and database queries.

import { createBrowserClient } from "@supabase/ssr";

const fallbackUrl = "https://your-project.supabase.co";
const fallbackAnonKey = "your-anon-key";

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const configuredSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function isPlaceholderValue(value?: string) {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("your-project") ||
    normalized.includes("your_anon") ||
    normalized.includes("your-anon") ||
    normalized.includes("your-key") ||
    normalized.includes("your-api-key") ||
    normalized.includes("placeholder") ||
    normalized.includes("example")
  );
}

const isSupabaseConfigured = Boolean(
  configuredSupabaseUrl &&
    configuredSupabaseAnonKey &&
    !isPlaceholderValue(configuredSupabaseUrl) &&
    !isPlaceholderValue(configuredSupabaseAnonKey) &&
    configuredSupabaseUrl !== fallbackUrl &&
    configuredSupabaseAnonKey !== fallbackAnonKey
);

function createMissingConfigError() {
  return {
    message:
      "Supabase is not configured yet. Add the real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values from your Supabase project in Vercel or your local env.",
  };
}

function createFallbackQueryBuilder() {
  const missingConfigError = createMissingConfigError();

  return {
    eq() {
      return this;
    },
    async order() {
      return { data: [], error: missingConfigError };
    },
    async single() {
      return { data: null, error: missingConfigError };
    },
  };
}

function createFallbackClient() {
  const missingConfigError = createMissingConfigError();

  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error: missingConfigError };
      },
      async signUp() {
        return { data: { user: null, session: null }, error: missingConfigError };
      },
      async signOut() {
        return { error: null };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
    storage: {
      from() {
        return {
          async upload() {
            return { data: null, error: missingConfigError };
          },
          async createSignedUrl() {
            return { data: null, error: missingConfigError };
          },
        };
      },
    },
    from() {
      return {
        insert() {
          return {
            select() {
              return createFallbackQueryBuilder();
            },
          };
        },
        select() {
          return createFallbackQueryBuilder();
        },
      };
    },
  };
}

// Create a single Supabase client for the browser.
// If the project has not been configured with real keys yet, a safe fallback
// client is used so the app shows a friendly message instead of crashing.
export const supabase = isSupabaseConfigured
  ? createBrowserClient(configuredSupabaseUrl!, configuredSupabaseAnonKey!)
  : createFallbackClient();

// Helper: upload a selfie to Supabase Storage
// Returns the storage path (not a signed URL — signed URLs expire after an
// hour, so baking one into the database would go stale; call getSelfieUrl
// with this path whenever the photo needs to be displayed instead).
export async function uploadSelfie(
  file: File,
  userId: string
): Promise<string> {
  // Create a unique filename using the user's ID and current timestamp
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("selfies")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return fileName;
}

// Helper: turn a stored selfie path into a fresh signed URL, valid for an
// hour from the moment it's called — call this right before displaying a
// photo rather than storing its result.
export async function getSelfieUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("selfies")
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) throw new Error("Could not generate image URL");
  return data.signedUrl;
}

// Helper: save analysis results to the database
export async function saveAnalysis(
  userId: string,
  imageUrl: string,
  faceShape: string,
  analysisData: object
) {
  const { data, error } = await supabase
    .from("face_analyses")
    .insert({
      user_id: userId,
      image_url: imageUrl,
      face_shape: faceShape,
      analysis_data: analysisData,
    })
    .select()
    .single();

  if (error) throw new Error(`Save failed: ${error.message}`);
  return data;
}

// Helper: get all previous analyses for a user
export async function getUserAnalyses(userId: string) {
  const { data, error } = await supabase
    .from("face_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Fetch failed: ${error.message}`);
  return data;
}
