"use client";
import {useEffect,useRef,useState} from "react";
import {supabase} from "../../../lib/supabase";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function Scanner(){
  const [token,setToken]=useState("");const [allowed,setAllowed]=useState(false);const [checking,setChecking]=useState(true);
  const [result,setResult]=useState(null);
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const [cameraOn,setCameraOn]=useState(false);
  const [cameraStatus,setCameraStatus]=useState("");
  const [starting,setStarting]=useState(false);
  const video=useRef(null);
  const stream=useRef(null);
  const timer=useRef(null);
  const scanning=useRef(false);
  const canvas=useRef(null);

  function stopCamera(){
    if(timer.current){clearInterval(timer.current);timer.current=null;}
    if(stream.current){stream.current.getTracks().forEach(track=>track.stop());stream.current=null;}
    if(video.current) video.current.srcObject=null;
    scanning.current=false;
    setCameraOn(false);
  }
  useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);if(stream.current)stream.current.getTracks().forEach(t=>t.stop());},[]);

  async function loadFallbackDecoder(){
    if(window.jsQR)return window.jsQR;
    await new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
      script.async=true;
      script.onload=resolve;
      script.onerror=()=>reject(new Error("Impossible de charger le lecteur QR de secours."));
      document.head.appendChild(script);
    });
    if(!window.jsQR)throw new Error("Le lecteur QR de secours n'est pas disponible.");
    return window.jsQR;
  }

  useEffect(()=>{let alive=true;supabase.rpc("can_scan_pass").then(({data,error})=>{if(alive){setAllowed(!error&&data===true);setChecking(false);}});return()=>{alive=false};},[]);
  async function startCamera(){if(!allowed)return;
    setStarting(true);setCameraStatus("Initialisation de la caméra...");
    try{
      if(!window.isSecureContext)throw new Error("La caméra exige une connexion HTTPS sécurisée.");
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("Caméra non disponible dans ce navigateur.");
      let detector=null,decoder=null;
      if("BarcodeDetector" in window){
        try{
          const formats=await window.BarcodeDetector.getSupportedFormats();
          if(formats.includes("qr_code"))detector=new window.BarcodeDetector({formats:["qr_code"]});
        }catch{}
      }
      if(!detector)decoder=await loadFallbackDecoder();
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      stream.current=media;
      if(!video.current)throw new Error("Lecteur vidéo indisponible.");
      video.current.srcObject=media;
      await video.current.play();
      setCameraOn(true);
      setCameraStatus("Caméra activée. Présentez un QR MON PASS devant l'objectif.");
      timer.current=setInterval(async()=>{
        if(scanning.current||!video.current||video.current.readyState<2)return;
        scanning.current=true;
        try{
          let raw="";
          if(detector){
            const codes=await detector.detect(video.current);
            raw=(codes[0]?.rawValue||"").trim();
          }else{
            const v=video.current;
            const cv=canvas.current||document.createElement("canvas");
            canvas.current=cv;
            cv.width=v.videoWidth;cv.height=v.videoHeight;
            const ctx=cv.getContext("2d",{willReadFrequently:true});
            ctx.drawImage(v,0,0,cv.width,cv.height);
            const pixels=ctx.getImageData(0,0,cv.width,cv.height);
            raw=(decoder(pixels.data,cv.width,cv.height)?.data||"").trim();
          }
          if(raw){
            if(UUID.test(raw)){setToken(raw);setResult(null);setCameraStatus("QR reconnu. Confirmez le passage avec le bouton de validation.");stopCamera();}
            else setCameraStatus("QR détecté, mais ce code n'est pas un jeton MON PASS.");
          }
        }catch{setCameraStatus("Lecture difficile. Rapprochez le QR ou saisissez le jeton manuellement.");}
        finally{scanning.current=false;}
      },500);
    }catch(err){
      stopCamera();
      setCameraStatus((err?.name==="NotAllowedError"?"Autorisation caméra refusée. Vérifiez les permissions du navigateur.":err?.message)||"Impossible d'activer la caméra.");
    }finally{setStarting(false);}
  }

  async function verify(e){
    e.preventDefault();
    if(busy||!allowed)return;
    const clean=token.trim();
    if(!UUID.test(clean)){setMsg("Jeton QR invalide : un identifiant MON PASS est attendu.");return;}
    setBusy(true);setResult(null);setMsg("Vérification sécurisée...");
    try{
      let {data,error}=await supabase.rpc("preview_my_qr_pass",{p_qr_token:clean});
      if(error)throw error;
      setResult(data);setMsg("");
    }catch(err){setMsg(err.message||"Impossible de valider ce Pass.");}
    finally{setBusy(false);}
  }

  async function confirmPass(){if(!allowed||result?.result!=="valid")return;setBusy(true);try{let r=await supabase.rpc("scan_offer_pass",{p_qr_token:token.trim()});if(r.error)throw r.error;if(r.data?.result==="invalid")r=await supabase.rpc("scan_ticket",{p_qr_token:token.trim()});if(r.error)throw r.error;setResult(r.data);}catch(e){setMsg(e.message);}finally{setBusy(false);}}
  return <main>
    <header><a className="brand" href="/">MON <b>PASS</b></a><a className="account" href="/admin/matchs">Administration</a></header>
    <section className="scannerBox">{checking?<p>Vérification des droits...</p>:!allowed?<p className="authMsg">Scanner réservé aux partenaires approuvés et administrateurs MON PASS. <a href="/compte">Se connecter</a></p>:<>
      <span className="pill">CONTRÔLE QR</span>
      <h1>Scanner un Pass</h1>
      <p className="muted">Réservé aux administrateurs et partenaires approuvés. Le passage n'est validé qu'après confirmation.</p>
      <div className="cameraMock">
        <video ref={video} playsInline muted style={{width:"100%",maxHeight:250,display:cameraOn?"block":"none"}}/>
        {!cameraOn&&<><span>▣</span><b>Caméra QR</b><small>Lecture QR ou saisie manuelle</small></>}
      </div>
      <button type="button" className="publish" disabled={starting} onClick={cameraOn?()=>{stopCamera();setCameraStatus("Caméra arrêtée.");}:startCamera}>{starting?"Ouverture de la caméra...":cameraOn?"Arrêter la caméra":"Activer la caméra QR"}</button>
      {cameraStatus&&<p className="authMsg" role="status" aria-live="polite" style={{marginTop:12}}>{cameraStatus}</p>}
      <form className="matchForm" onSubmit={verify}>
        <label>Jeton QR<input value={token} onChange={e=>{setToken(e.target.value);setResult(null);}} placeholder="Scanner ou coller le code du Pass" required/></label>
        <button className="publish" disabled={busy}>{busy?"Contrôle en cours...":"Consulter le billet sans le valider"}</button>
      </form>
      {msg&&<p className="authMsg" role="status">{msg}</p>}
      {result&&<div className={"scanResult "+result.result} role="status">
        <h2>{result.message}</h2>
        {result.title&&<p>{result.title}</p>}{result.type&&<p>Type : {result.type}</p>}{result.date&&<p>Date : {new Date(result.date).toLocaleString("fr-FR",{timeZone:"Africa/Douala"})}</p>}{result.amount_fcfa!=null&&<p>Montant : {result.amount_fcfa} FCFA</p>}{result.result==="valid"&&result.message==="Billet consulté — non validé"&&<button type="button" className="publish" disabled={busy} onClick={confirmPass}>Confirmer l’entrée et utiliser le billet</button>}
        {result.partner&&<p>Partenaire : {result.partner}</p>}
        {result.match&&<p>{result.match}</p>}
        {result.category&&<b>{result.category} · {result.stadium}</b>}
        {result.venue&&<p>{result.venue}{result.city?" · "+result.city:""}</p>}
        {result.used_at&&<small>Passage enregistré : {new Date(result.used_at).toLocaleString("fr-FR")}</small>}
      </div>}
      <div className="bankNotice"><b>Anti-fraude</b><p>Un Pass validé devient UTILISÉ dans Supabase. Un deuxième contrôle renvoie PASS DÉJÀ UTILISÉ, même sur deux appareils.</p></div>
    </>}</section>
  </main>;
}
