const SK="vcl_cmd_v2",SS="vcl_set_v2",SE="vcl_ok";
const FIELDS=[
{k:"typeBijou",l:"Type de bijou",t:"select",o:["Bague","Collier","Bracelet","Boucles d'oreilles","Pendentif","Alliance","Gourmette","Autre"]},
{k:"metal",l:"Métal",t:"select",o:["Or jaune 18k","Or blanc 18k","Or rose 18k","Or jaune 14k","Platine","Argent 925","Autre"]},
{k:"couleur",l:"Couleur / finition",t:"text",p:"Ex. poli miroir…"},
{k:"grandeur",l:"Grandeur / taille",t:"text",p:"Ex. 54, 18 cm…"},
{k:"pierres",l:"Pierres",t:"text",p:"Ex. diamant 0.5 ct…"},
{k:"gravure",l:"Gravure",t:"text",p:"Texte à graver"},
{k:"dateLivraison",l:"Date livraison souhaitée",t:"date"},
{k:"budget",l:"Budget indicatif",t:"text",p:"Ex. 800 $"},
{k:"instructions",l:"Instructions spéciales",t:"textarea",p:"Détails…"}
];
const DEF_ASK=["metal","grandeur","couleur","pierres"];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&","<":"<",">":">","\"":""","'":"&#39;"}[c]));
const loadO=()=>{try{return JSON.parse(localStorage.getItem(SK)||"[]")}catch{return[]}};
const saveO=a=>localStorage.setItem(SK,JSON.stringify(a));
const loadS=()=>{try{return Object.assign({atelierName:"Joaillerie VCL",whatsapp:"",email:"",pin:""},JSON.parse(localStorage.getItem(SS)||"{}"))}catch{return{atelierName:"Joaillerie VCL",whatsapp:"",email:"",pin:""}}};
const saveS=s=>localStorage.setItem(SS,JSON.stringify(s));
const uid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),2500)}
function enc(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function dec(s){try{const b=s.replace(/-/g,"+").replace(/_/g,"/");const p=b.length%4?"=".repeat(4-b.length%4):"";return JSON.parse(decodeURIComponent(escape(atob(b+p))))}catch{return null}}
function clientLink(o){const s=loadS();return `${location.origin}${location.pathname}?c=${enc({id:o.id,client:o.client,known:o.fields||{},ask:o.ask||[],note:o.noteAtelier||"",atelier:s.atelierName})}`}
function badge(st){return st==="done"?'<span class="badge done">Complétée</span>':st==="waiting"?'<span class="badge wait">En attente client</span>':'<span class="badge">Brouillon</span>'}
function route(){const p=new URLSearchParams(location.search);if(p.get("c"))return viewClient(p.get("c"));if(p.get("r"))return viewImport(p.get("r"));return viewAtelier()}
function unlocked(){const s=loadS();return !s.pin||sessionStorage.getItem(SE)==="1"}
function viewAtelier(){if(!unlocked())return viewPin();const tab=sessionStorage.getItem("tab")||"list";const s=loadS();
$("app").innerHTML=`<div class="hdr"><div class="brand"><div class="mark">◆</div><div><h1>${esc(s.atelierName)}</h1><p class="sub">Prise de commandes & liens clients</p></div></div>
<button class="btn ghost sm" id="set">Réglages</button></div>
<div class="tabs"><button data-t="list" class="${tab==="list"?"on":""}">Commandes</button><button data-t="new" class="${tab==="new"?"on":""}">Nouvelle</button></div>
<div id="main"></div><p class="foot">Données atelier sur cet appareil. Le lien client fonctionne partout.</p>`;
$("app").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{sessionStorage.setItem("tab",b.dataset.t);viewAtelier()});
$("set").onclick=viewSettings;tab==="new"?viewNew():viewList()}
function viewPin(){$("app").innerHTML=`<div class="card" style="max-width:360px;margin:40px auto"><h1>Accès atelier</h1><p class="sub" style="margin:8px 0 12px">Code PIN</p>
<div class="field"><input type="password" id="pin" inputmode="numeric"/></div><button class="btn pri block" id="go">Entrer</button></div>`;
const go=()=>{if($("pin").value===loadS().pin){sessionStorage.setItem(SE,"1");viewAtelier()}else toast("Code incorrect")};
$("go").onclick=go;$("pin").onkeydown=e=>{if(e.key==="Enter")go()}}
function viewList(){const main=$("main");const orders=loadO().sort((a,b)=>b.createdAt-a.createdAt);
if(!orders.length){main.innerHTML=`<div class="card center"><p>Aucune commande.</p><p class="sub" style="margin:8px 0">Créez une commande, puis envoyez le lien au client.</p>
<button class="btn pri" style="margin-top:12px" id="goN">Créer une commande</button></div>`;$("goN").onclick=()=>{sessionStorage.setItem("tab","new");viewAtelier()};return}
main.innerHTML=orders.map(o=>{const chips=(o.ask||[]).map(k=>{const f=FIELDS.find(x=>x.k===k);const ok=!!(o.fields&&o.fields[k]);return `<span class="chip ${ok?"ok":"miss"}">${f?f.l:k}${ok?" ✓":""}</span>`}).join("");
return `<div class="item" data-id="${o.id}"><div style="display:flex;justify-content:space-between;gap:8px"><h3>${esc(o.client||"Client")}</h3>${badge(o.status)}</div>
<div class="meta">${esc(o.fields?.typeBijou||"Bijou")} · ${new Date(o.createdAt).toLocaleDateString("fr-CA")}${o.phone?" · "+esc(o.phone):""}</div>
<div>${chips||'<span class="chip">Rien demandé au client</span>'}</div>
<div class="actions" style="margin-top:12px">
<button class="btn pri sm" data-a="copy">Copier lien client</button>
<button class="btn sec sm" data-a="wa">WhatsApp</button>
<button class="btn ghost sm" data-a="view">Détails</button>
<button class="btn dang sm" data-a="del">Supprimer</button></div></div>`}).join("");
main.querySelectorAll(".item").forEach(el=>{const id=el.dataset.id;const o=loadO().find(x=>x.id===id);
el.querySelector('[data-a="copy"]').onclick=async()=>{const link=clientLink(o);try{await navigator.clipboard.writeText(link);toast("Lien copié")}catch{prompt("Lien :",link)};if(o.status==="draft"){o.status="waiting";saveO(loadO().map(x=>x.id===id?o:x));viewList()}};
el.querySelector('[data-a="wa"]').onclick=()=>{const link=clientLink(o);const s=loadS();const t=encodeURIComponent(`Bonjour ${o.client||""},\n\nPour finaliser votre commande chez ${s.atelierName} :\n${link}\n\nMerci !`);window.open(`https://wa.me/${(o.phone||"").replace(/\D/g,"")}?text=${t}`,"_blank");if(o.status==="draft"){o.status="waiting";saveO(loadO().map(x=>x.id===id?o:x));viewList()}};
el.querySelector('[data-a="view"]').onclick=()=>viewDetail(id);
el.querySelector('[data-a="del"]').onclick=()=>{if(confirm("Supprimer ?")){saveO(loadO().filter(x=>x.id!==id));toast("Supprimée");viewList()}}})}
function viewDetail(id){const o=loadO().find(x=>x.id===id);if(!o)return viewAtelier();const link=clientLink(o);
const rows=FIELDS.map(f=>`<div class="field"><label>${f.l}${(o.ask||[]).includes(f.k)?" (client)":""}</label><input data-k="${f.k}" value="${esc(o.fields?.[f.k]||"")}"/></div>`).join("");
$("main").innerHTML=`<div class="card"><button class="btn ghost sm" id="back">← Retour</button>
<h1 style="margin:12px 0 4px">${esc(o.client||"Commande")}</h1><p class="sub" style="margin-bottom:12px">${badge(o.status)} · ${o.id}</p>
<div class="field"><label>Client</label><input id="dc" value="${esc(o.client||"")}"/></div>
<div class="row"><div class="field"><label>Téléphone</label><input id="dp" value="${esc(o.phone||"")}"/></div>
<div class="field"><label>Courriel</label><input id="de" value="${esc(o.email||"")}"/></div></div>${rows}
<div class="field"><label>Note atelier</label><textarea id="dn">${esc(o.noteAtelier||"")}</textarea></div>
<p class="sub" style="margin:8px 0">Lien client</p>
<div class="linkbox"><input readonly value="${esc(link)}" id="dl"/><button class="btn sec" id="cp">Copier</button></div>
<div class="row" style="margin-top:14px"><button class="btn pri" id="sv">Enregistrer</button><button class="btn ok" id="dn2">Marquer complétée</button></div></div>`;
$("back").onclick=()=>{sessionStorage.setItem("tab","list");viewAtelier()};
$("cp").onclick=async()=>{try{await navigator.clipboard.writeText(link);toast("Copié")}catch{prompt("Lien:",link)}};
$("sv").onclick=()=>{o.client=$("dc").value.trim();o.phone=$("dp").value.trim();o.email=$("de").value.trim();o.noteAtelier=$("dn").value.trim();o.fields=o.fields||{};$("main").querySelectorAll("[data-k]").forEach(i=>o.fields[i.dataset.k]=i.value.trim());saveO(loadO().map(x=>x.id===id?o:x));toast("Enregistré")};
$("dn2").onclick=()=>{o.status="done";saveO(loadO().map(x=>x.id===id?o:x));toast("Complétée");sessionStorage.setItem("tab","list");viewAtelier()}}
function viewNew(){const checks=FIELDS.map(f=>`<label class="check"><input type="checkbox" value="${f.k}" ${DEF_ASK.includes(f.k)?"checked":""}/> ${f.l}</label>`).join("");
$("main").innerHTML=`<div class="card"><h1>Nouvelle commande</h1>
<div class="notice">Remplissez ce que vous savez. Cochez ce que le client doit compléter via le lien.</div>
<div class="field"><label class="req">Nom du client</label><input id="nc" placeholder="Marie Tremblay"/></div>
<div class="row"><div class="field"><label>Téléphone</label><input id="np" inputmode="tel"/></div>
<div class="field"><label>Courriel</label><input id="ne" type="email"/></div></div>
<div class="field"><label>Type de bijou (si connu)</label><select id="nt"><option value="">— À préciser —</option>${FIELDS[0].o.map(x=>`<option>${x}</option>`).join("")}</select></div>
<div class="field"><label>Note interne</label><textarea id="nn" placeholder="Réf. devis, urgence…"></textarea></div>
<p class="sub" style="margin:12px 0 8px">DEMANDER AU CLIENT</p><div class="checks">${checks}</div>
<button class="btn pri block" id="cr">Créer et obtenir le lien</button></div>`;
$("cr").onclick=()=>{const client=$("nc").value.trim();if(!client){toast("Nom du client requis");return}
const ask=[...$("main").querySelectorAll(".check input:checked")].map(i=>i.value);const type=$("nt").value;
const o={id:uid(),client,phone:$("np").value.trim(),email:$("ne").value.trim(),noteAtelier:$("nn").value.trim(),fields:type?{typeBijou:type}:{},ask,status:"draft",createdAt:Date.now()};
const list=loadO();list.push(o);saveO(list);sessionStorage.setItem("tab","list");toast("Commande créée");viewAtelier();setTimeout(()=>viewDetail(o.id),40)}}
function viewSettings(){const s=loadS();
$("app").innerHTML=`<div class="hdr"><div class="brand"><div class="mark">◆</div><div><h1>Réglages</h1><p class="sub">Atelier</p></div></div>
<button class="btn ghost sm" id="back">Retour</button></div>
<div class="card"><div class="field"><label>Nom de l'atelier</label><input id="sn" value="${esc(s.atelierName)}"/></div>
<div class="field"><label>WhatsApp atelier (indicatif pays, sans +)</label><input id="sw" value="${esc(s.whatsapp)}" placeholder="15141234567" inputmode="tel"/></div>
<div class="field"><label>Courriel atelier</label><input id="se" type="email" value="${esc(s.email)}"/></div>
<div class="field"><label>PIN atelier (vide = aucun)</label><input id="sp" type="password" value="${esc(s.pin)}"/></div>
<button class="btn pri block" id="ss">Enregistrer</button></div>
<div class="card"><h1>Importer une réponse client</h1>
<p class="sub" style="margin:8px 0 10px">Collez le lien de confirmation renvoyé par le client.</p>
<div class="field"><input id="si" placeholder="Lien ?r=…"/></div>
<button class="btn sec block" id="siB">Importer</button></div>`;
$("back").onclick=viewAtelier;
$("ss").onclick=()=>{saveS({atelierName:$("sn").value.trim()||"Joaillerie VCL",whatsapp:$("sw").value.trim(),email:$("se").value.trim(),pin:$("sp").value});toast("Enregistré");viewAtelier()};
$("siB").onclick=()=>{let tok=$("si").value.trim();try{tok=new URL(tok).searchParams.get("r")||tok}catch{}const d=dec(tok);if(!d||!d.id){toast("Lien invalide");return}applyResp(d);toast("Importé");viewAtelier()}}
function applyResp(d){const list=loadO();let o=list.find(x=>x.id===d.id);
if(!o){o={id:d.id,client:d.client||"Client",phone:d.phone||"",email:d.email||"",fields:{},ask:Object.keys(d.fields||{}),status:"done",createdAt:Date.now(),noteAtelier:""};list.push(o)}
o.fields=Object.assign({},o.fields||{},d.fields||{});if(d.client)o.client=d.client;if(d.phone)o.phone=d.phone;if(d.email)o.email=d.email;
o.status="done";o.clientSubmittedAt=d.submittedAt||Date.now();saveO(list.map(x=>x.id===o.id?o:x))}
function viewClient(token){const data=dec(token);
if(!data){$("app").innerHTML=`<div class="card"><h1>Lien invalide</h1><p class="sub">Ce lien n'est pas valide.</p></div>`;return}
const ask=data.ask||[],known=data.fields||data.known||{};
const fieldsHtml=FIELDS.map(f=>{const isAsk=ask.includes(f.k),has=!!known[f.k];if(!isAsk&&!has)return"";
const ro=!isAsk&&has,req=isAsk&&!has;let ctrl="";
if(f.t==="select")ctrl=`<select id="f-${f.k}" ${ro?"disabled":""}><option value="">— Choisir —</option>${f.o.map(o=>`<option value="${esc(o)}" ${known[f.k]===o?"selected":""}>${o}</option>`).join("")}</select>`;
else if(f.t==="textarea")ctrl=`<textarea id="f-${f.k}" ${ro?"readonly":""} placeholder="${esc(f.p||"")}">${esc(known[f.k]||"")}</textarea>`;
else ctrl=`<input id="f-${f.k}" type="${f.t==="date"?"date":"text"}" value="${esc(known[f.k]||"")}" ${ro?"readonly":""} placeholder="${esc(f.p||"")}"/>`;
return `<div class="field"><label class="${req?"req":""}">${f.l}${ro?" (déjà renseigné)":""}</label>${ctrl}</div>`}).join("");
$("app").innerHTML=`<div class="hdr"><div class="brand"><div class="mark">◆</div><div><h1>${esc(data.atelier||"Joaillerie")}</h1><p class="sub">Compléter votre commande</p></div></div></div>
<div class="card"><div class="notice">Bonjour${data.client?" "+esc(data.client):""} ! Merci de compléter les informations manquantes.</div>
${data.note?`<p class="sub" style="margin-bottom:12px">Note : ${esc(data.note)}</p>`:""}
<div class="field"><label>Votre nom</label><input id="f-client" value="${esc(data.client||"")}"/></div>
<div class="row"><div class="field"><label>Téléphone</label><input id="f-phone" value="${esc(data.phone||"")}" inputmode="tel"/></div>
<div class="field"><label>Courriel</label><input id="f-email" type="email" value="${esc(data.email||"")}"/></div></div>
${fieldsHtml||"<p class='sub'>Aucune information supplémentaire demandée.</p>"}
<button class="btn pri block" id="sub">Envoyer mes informations</button></div>`;
$("sub").onclick=()=>{const fields=Object.assign({},known);
for(const f of FIELDS){const el=$("f-"+f.k);if(el&&!el.readOnly&&!el.disabled)fields[f.k]=el.value.trim()}
for(const k of ask){if(!fields[k]){const def=FIELDS.find(x=>x.k===k);toast("Champ requis : "+(def?def.l:k));return}}
const resp={id:data.id,client:($("f-client").value.trim()||data.client),phone:$("f-phone").value.trim(),email:$("f-email").value.trim(),fields,submittedAt:Date.now()};
try{applyResp(resp)}catch{}
const ret=`${location.origin}${location.pathname}?r=${enc(resp)}`;const s=loadS();
const lines=[`Commande bijou — ${resp.client||""}`,`ID: ${resp.id}`,...FIELDS.filter(f=>resp.fields[f.k]).map(f=>`${f.l}: ${resp.fields[f.k]}`),resp.phone?`Tél: ${resp.phone}`:"",resp.email?`Courriel: ${resp.email}`:""].filter(Boolean);
$("app").innerHTML=`<div class="card center"><div style="font-size:2rem">✓</div><h1>Merci !</h1>
<p class="sub" style="margin:8px 0 16px">Envoyez vos infos à l'atelier pour finaliser.</p>
<button class="btn pri block" id="wa">Envoyer par WhatsApp</button>
<button class="btn sec block" style="margin-top:8px" id="cs">Copier le résumé</button>
<p class="sub" style="margin-top:16px">Ou transférez ce lien de confirmation :</p>
<div class="linkbox" style="margin-top:8px;text-align:left"><input readonly id="rl" value="${esc(ret)}"/><button class="btn ghost sm" id="cr">Copier</button></div></div>`;
$("cs").onclick=async()=>{try{await navigator.clipboard.writeText(lines.join("\n"));toast("Copié")}catch{prompt("Résumé:",lines.join("\n"))}};
$("cr").onclick=async()=>{try{await navigator.clipboard.writeText(ret);toast("Copié")}catch{prompt("Lien:",ret)}};
$("wa").onclick=()=>{const wa=s.whatsapp||"";const t=encodeURIComponent(lines.join("\n")+"\n\nLien confirmation:\n"+ret);window.open(wa?`https://wa.me/${wa.replace(/\D/g,"")}?text=${t}`:`https://wa.me/?text=${t}`,"_blank")}}}
function viewImport(token){const d=dec(token);if(!d){$("app").innerHTML=`<div class="card"><h1>Lien invalide</h1></div>`;return}
applyResp(d);$("app").innerHTML=`<div class="card center"><div style="font-size:2rem">✓</div><h1>Réponse importée</h1>
<p class="sub" style="margin:8px 0 16px">Commande de <strong>${esc(d.client||"client")}</strong> mise à jour.</p>
<button class="btn pri" id="ga">Voir les commandes</button></div>`;
$("ga").onclick=()=>{history.replaceState({},"",location.pathname);viewAtelier()}}
route();window.addEventListener("popstate",route);
