// lib/supabase.ts
// This file creates the Supabase client used throughout the app.
// The client handles authentication and database queries.

import { createBrowserClient } from "@supabase/ssr";

// These values come from your .env.local file
// The NEXT_PUBLIC_ prefix means they're safe to use in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single Supabase client for the browser
// This is exported and used anywhere in the app that needs Supabase
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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
