import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
const storage = { getItem:(key:string)=>SecureStore.getItemAsync(key), setItem:(key:string,value:string)=>SecureStore.setItemAsync(key,value), removeItem:(key:string)=>SecureStore.deleteItemAsync(key) };
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!anon) throw new Error("Configure EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY");
export const supabase=createClient(url,anon,{auth:{storage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}});
