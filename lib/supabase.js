import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://xqunkdmiuyrelvaalbvz.supabase.co";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_GjbSMZwPWmkPZewH-D_dhg_K52tij_f";
export const supabase=createClient(url,key);