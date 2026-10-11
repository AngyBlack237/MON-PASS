"use client";
import {useEffect,useState} from "react";
import {QRCodeSVG} from "qrcode.react";
import {supabase} from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
export default function Passes(){
 const [passes,setPasses]=useState([]),[requests,setRequests]=useState([]),[msg,setMsg]=useState("Chargement..."),[filter,setFilter]=useState("all"),[email,setEmail]=useState("");
 useEffect(()=>{let alive=true;(async()=>{
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(!alive)return;
 if(authError||!user){setMsg("Connectez-vous pour consulter votre espace client.");return;}
 setEmail(user.email||"");
 const [a,b,d]=await Promise.all([
 supabase.rpc("get_my_offer_passes"),
 supabase.from("tickets").select("id,qr_token,status,used_at,created_at,reservations!inner(user_id,final_amount_fcfa,credits_required,ticket_categories(name,matches(competition,home_team,away_team,stadium,city,match_date)))").eq("reservations.user_id",user.id).order("created_at",{ascending:false}),
 supabase.rpc("get_my_event_booking_requests")
 ]);
 if(!alive)return;
 const modern=(a.data||[]).map(x=>({id:x.pass_id,token:x.qr_token,status:x.pass_status,type:x.offer_type,title:x.title,subtitle:[x.partner_name,x.venue,x.city].filter(Boolean).join(" · "),category:x.ticket_category||"",amount:x.gross_fcfa,date:x.starts_at,created:x.created_at}));
 const legacy=(b.data||[]).map(x=>{const r=x.reservations,cat=r?.ticket_categories,m=cat?.matches;return{id:x.id,token:x.qr_token,status:x.status,type:"match",title:m?m.home_team+" vs "+m.away_team:"Billet Match",subtitle:[cat?.name,m?.stadium,m?.city].filter(Boolean).join(" · "),category:cat?.name,amount:r?.final_amount_fcfa,date:m?.match_date,created:x.created_at}});
 setPasses([...modern,...legacy].sort((x,y)=>new Date(y.created||y.date||0)-new Date(x.created||x.date||0)));
 setRequests(d.data||[]);
 const errors=[a.error,b.error,d.error].filter(Boolean);
 setMsg(errors.length?"Certaines données n'ont pas pu être chargées : "+errors.map(e=>e.message).join(" · "):"");
 })();return()=>{alive=false};},[]);
 const label=t=>t==="travel"?"Voyage":t==="match"?"Match":t==="event"?"Événement":t;
 const active=passes.filter(x=>x.status==="active"&&x.token);
 const all=[...passes.map(x=>({...x,kind:"ticket"})),...requests.map(x=>({id:x.id,kind:"request",type:"event",title:x.title,subtitle:[x.category,x.venue,x.city].filter(Boolean).join(" · "),category:x.category,amount:x.base_price_fcfa,date:x.starts_at,created:x.created_at,status:x.status,mode:x.mode}))].filter(x=>filter==="all"||x.type===filter).sort((x,y)=>new Date(y.created||y.date||0)-new Date(x.created||x.date||0));
 return <main><header><a className="brand" href="/">MON <b>PASS</b></a><nav style={{display:"flex",gap:12,flexWrap:"wrap"}}><a className="account" href="/profil">Mon profil</a><a className="account" href="/compte">Mon compte</a></nav></header>
 <section className="formWrap passWrap"><span className="pill">ESPACE CLIENT</span><h1>Mes achats et réservations</h1><p className="muted">{email||"Votre historique personnel"} · Voyages, matchs et événements.</p>
 {!email&&<p><a className="primary navCta" href="/compte">Se connecter / S'inscrire</a></p>}
 {msg&&<p className="authMsg">{msg}</p>}
 {email&&<><div className="grid"><article><h3>{passes.length}</h3><p>Billets enregistrés</p></article><article><h3>{active.length}</h3><p>QR Pass actifs</p></article><article><h3>{requests.filter(x=>x.status==="pending_payment").length}</h3><p>Demandes en attente</p></article></div>
 <h2>Mes QR Pass à présenter</h2><p className="muted">Seuls les billets confirmés et actifs disposent d'un QR Pass utilisable. Le contrôle est effectué par le partenaire.</p>
 {active.map(t=><article className="realPass" key={"qr-"+t.id}><div className="passDetails"><small>{label(t.type)}</small><h3>{t.title}</h3><p>{t.subtitle}</p>{t.date&&<p>{new Date(t.date).toLocaleString("fr-FR",{timeZone:"Africa/Douala"})}</p>}<span className="passStatus active">ACTIF</span></div><div className="qrZone"><QRCodeSVG value={String(t.token)} size={170} level="H"/><code>{t.token}</code></div></article>)}
 {!active.length&&<p className="muted">Aucun QR Pass actif pour le moment.</p>}
 <h2>Historique de mes achats</h2><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>{[["all","Tous"],["travel","Voyages"],["match","Matchs"],["event","Événements"]].map(([v,t])=><button key={v} type="button" className={filter===v?"publish":"account"} onClick={()=>setFilter(v)}>{t}</button>)}</div>
 {all.map(t=><article className="realPass" key={t.kind+"-"+t.id}><div className="passDetails"><small>{label(t.type)}</small><h3>{t.title}</h3><p>{t.subtitle}</p>{t.date&&<p>Prévu le {new Date(t.date).toLocaleString("fr-FR",{timeZone:"Africa/Douala"})}</p>}{t.amount!=null&&<p>{Number(t.amount).toLocaleString("fr-FR")} FCFA {t.kind==="request"?"(prix partenaire, frais selon contrat)":""}</p>}<b>{t.kind==="request"?"Demande enregistrée":"Billet"}</b><p>Statut : {t.status==="pending_payment"?"En attente de paiement":t.status==="active"?"Actif":t.status==="used"?"Utilisé":t.status==="cancelled"?"Annulé":t.status}</p>{t.kind==="request"&&<p>Aucun billet ni QR Pass émis avant paiement confirmé.</p>}</div></article>)}
 {!all.length&&<p className="muted">Aucun achat ou réservation enregistré pour le moment.</p>}</>}
 </section><BottomNav/></main>
}