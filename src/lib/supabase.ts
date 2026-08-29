import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vhksbulhfafqzvvpkyhj.supabase.co";
const supabasePublishableKey = "sb_publishable_778LEBnKXP8r_VAfD7dAYA_qXoRCs3Y";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
