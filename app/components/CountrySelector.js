"use client";
import {useEffect,useState} from "react";
const countries=[
{code:"CM",name:"Cameroun",flag:"🇨🇲"},
{code:"CI",name:"Côte d’Ivoire",flag:"🇨🇮"},
{code:"SN",name:"Sénégal",flag:"🇸🇳"},
{code:"GA",name:"Gabon",flag:"🇬🇦"},
{code:"CD",name:"RD Congo",flag:"🇨🇩"},
{code:"CG",name:"Congo",flag:"🇨🇬"},
{code:"BJ",name:"Bénin",flag:"🇧🇯"},
{code:"TG",name:"Togo",flag:"🇹🇬"},
{code:"BF",name:"Burkina Faso",flag:"🇧🇫"},
{code:"ML",name:"Mali",flag:"🇲🇱"},
{code:"GH",name:"Ghana",flag:"🇬🇭"},
{code:"NG",name:"Nigeria",flag:"🇳🇬"},
{code:"KE",name:"Kenya",flag:"🇰🇪"},
{code:"RW",name:"Rwanda",flag:"🇷🇼"},
{code:"ZA",name:"Afrique du Sud",flag:"🇿🇦"}
];
export default function CountrySelector(){
 const [selected,setSelected]=useState("CM");
 useEffect(()=>{try{const saved=window.localStorage.getItem("monpass-country");if(countries.some(c=>c.code===saved))setSelected(saved);}catch{}},[]);
 const country=countries.find(c=>c.code===selected)||countries[0];
 function change(code){setSelected(code);try{window.localStorage.setItem("monpass-country",code);}catch{}}
 return <div className="countrySelector"><label htmlFor="monpass-country">🌍 Choisissez votre pays</label><select id="monpass-country" value={selected} onChange={e=>change(e.target.value)}>{countries.map(c=><option value={c.code} key={c.code}>{c.flag} {c.name}</option>)}</select><span className="pill">{country.flag} {country.name}</span><small>MON PASS se développe à travers l’Afrique. Le choix du pays personnalise l’accueil ; la disponibilité des offres et des paiements dépend des partenaires actifs.</small></div>;
}