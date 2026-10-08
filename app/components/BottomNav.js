"use client";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
export default function BottomNav(){
 const[admin,setAdmin]=useState(false);
 useEffect(()=>{let alive=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();if(alive)setAdmin(data?.role==="admin");})();return()=>{alive=false}},[]);
 return <nav aria-label="Navigation principale" className="bottomNav">
 <a href="/">⌂<small>Accueil</small></a>
 <a href="/matchs">⚽<small>Matchs</small></a>
 <a href={admin?"/admin/scanner":"/voyages"} className="scan" title={admin?"Scanner administrateur":"Voyages"}>{admin?"▣":"🚌"}<small>{admin?"Scanner":"Voyages"}</small></a>
 <a href="/mes-pass">🎫<small>Mes Pass</small></a>
 <a href="/profil">◉<small>Profil</small></a>
 </nav>;
}