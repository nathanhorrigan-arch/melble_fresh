import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://vhksbulhfafqzvvpkyhj.supabase.co";
export const supabaseAnonKey = "sb_publishable_778LEBnKXP8r_VAfD7dAYA_qXoRCs3Y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
