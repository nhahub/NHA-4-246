import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Build an authenticated Supabase client from the incoming request's JWT
export function getSupabaseClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Service-role client for admin operations (bypasses RLS)
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Return the authenticated user id or throw
export async function requireAuth(supabase: SupabaseClient): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}
