"use client";
import {useEffect,useRef,useState} from "react";
import {supabase} from "../../../lib/supabase";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function Scanner(){
  const [token,setToken]=useState("");
  const [result,setResult]=useState(null);
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const [cameraOn,setCameraOn]=useState(false);
  const video=useRef(null);
  const stream=useRef(null);
  const timer=useRef(null);
  const scanning=useRef(false);

  function stopCamera(){
    if(timer.current){clearInterval(timer.current);timer.current=null;}
    if(stream.current){stream.current.getTracks().forEach(track=>track.stop());stream.current=null;}
    if(video.current) video.current.srcObject=null;
    scanning.current=false;
    setCameraOn(false);
  }
  useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);if(stream.current)stream.current.getTracks().forEach(t=>t.stop());},[]);

  async function startCamera(){
    if(!navigator.mediaDevices?.getUserMedia){setMsg("Caméra indisponible. Saisissez le jeton QR manuellement.");return;}
    if(!("BarcodeDetector" in window)){setMsg("Lecture QR non prise en charge par ce navigateur. Saisissez le jeton ou utilisez un navigateur compatible.");return;}
    try{
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
      stream.current=media;
      if(video.current){video.current.srcObject=media;await video.current.play();}
      setCameraOn(true);
      setMsg("Placez le QR dans le cadre. La validation reste manuelle.");
      const detector=new window.BarcodeDetector({formats:["qr_code"]});
      timer.current=setInterval(async()=>{
        if(scanning.current||!video.current||video.current.readyState<2)return;
        scanning.current=true;
        try{
          const codes=await detector.detect(video.current);
          if(codes.length){
            const raw=(codes[0].rawValue||"").trim();
            if(UUID.test(raw)){setToken(raw);setResult(null);setMsg("QR reconnu. Cliquez sur Valider le passage.");stopCamera();}
            else setMsg("Le QR ne contient pas un jeton MON PASS valide.");
          }
        }catch{setMsg("Lecture impossible. Vous pouvez saisir le jeton manuellement.");}
        finally{scanning.current=false;}
      },500);
    }catch{stopCamera();setMsg("Accès caméra refusé ou indisponible. Saisissez le jeton manuellement.");}
  }

  async function verify(e){
    e.preventDefault();
    if(busy)return;
    const clean=token.trim();
    if(!UUID.test(clean)){setMsg("Jeton QR invalide : un identifiant MON PASS est attendu.");return;}
    setBusy(true);setResult(null);setMsg("Vérification sécurisée...");
    try{
      let {data,error}=await supabase.rpc("scan_offer_pass",{p_qr_token:clean});
      if(error)throw error;
      if(data?.result==="invalid"){
        const legacy=await supabase.rpc("scan_ticket",{p_qr_token:clean});
        if(legacy.error)throw legacy.error;
        data=legacy.data;
      }
      setResult(data);setMsg("");
    }catch(err){setMsg(err.message||"Impossible de valider ce Pass.");}
    finally{setBusy(false);}
  }

  return <main>
    <header><a className="brand" href="/">MON <b>PASS</b></a><a className="account" href="/admin/matchs">Administration</a></header>
    <section className="scannerBox">
      <span className="pill">CONTRÔLE QR</span>
      <h1>Scanner un Pass</h1>
      <p className="muted">Réservé aux administrateurs et partenaires approuvés. Le passage n'est validé qu'après confirmation.</p>
      <div className="cameraMock">
        <video ref={video} playsInline muted style={{width:"100%",maxHeight:250,display:cameraOn?"block":"none"}}/>
        {!cameraOn&&<><span>▣</span><b>Caméra QR</b><small>Lecture QR ou saisie manuelle</small></>}
      </div>
      <button type="button" className="publish" onClick={cameraOn?stopCamera:startCamera}>{cameraOn?"Arrêter la caméra":"Activer la caméra QR"}</button>
      <form className="matchForm" onSubmit={verify}>
        <label>Jeton QR<input value={token} onChange={e=>{setToken(e.target.value);setResult(null);}} placeholder="Scanner ou coller le code du Pass" required/></label>
        <button className="publish" disabled={busy}>{busy?"Contrôle en cours...":"Vérifier et valider le passage"}</button>
      </form>
      {msg&&<p className="authMsg" role="status">{msg}</p>}
      {result&&<div className={"scanResult "+result.result} role="status">
        <h2>{result.message}</h2>
        {result.title&&<p>{result.title}</p>}
        {result.partner&&<p>Partenaire : {result.partner}</p>}
        {result.match&&<p>{result.match}</p>}
        {result.category&&<b>{result.category} · {result.stadium}</b>}
        {result.venue&&<p>{result.venue}{result.city?" · "+result.city:""}</p>}
        {result.used_at&&<small>Passage enregistré : {new Date(result.used_at).toLocaleString("fr-FR")}</small>}
      </div>}
      <div className="bankNotice"><b>Anti-fraude</b><p>Un Pass validé devient UTILISÉ dans Supabase. Un deuxième contrôle renvoie PASS DÉJÀ UTILISÉ, même sur deux appareils.</p></div>
    </section>
  </main>;
}
