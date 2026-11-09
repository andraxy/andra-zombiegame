(()=> {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const W=canvas.width,H=canvas.height;
const $=id=>document.getElementById(id);
const weapons=[
 {name:"PISTOL",price:0,damage:25,rate:330,speed:10,pellets:1,desc:"Balanced · unlimited ammo"},
 {name:"SMG",price:90,damage:13,rate:105,speed:11,pellets:1,desc:"Fast fire · close control"},
 {name:"SHOTGUN",price:170,damage:17,rate:650,speed:9,pellets:6,desc:"Wide spread · heavy hit"},
 {name:"RIFLE",price:300,damage:48,rate:430,speed:15,pellets:1,desc:"High damage · long range"}
];
let player,zombies=[],bullets=[],particles=[],keys={},mouse={x:W/2,y:H/2,down:false},wave=1,kills=0,coins=0,gameRunning=false,last=0,spawnLeft=0,spawnTimer=0,weaponIndex=0,damageLevel=0,lastShot=0,scoreSubmitted=false;
const owned=new Set([0]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1300)}
function reset(){player={x:W/2,y:H/2,r:15,hp:100,speed:3.2,inv:0};zombies=[];bullets=[];particles=[];wave=1;kills=0;coins=0;weaponIndex=0;damageLevel=0;spawnLeft=0;spawnTimer=0;lastShot=0;scoreSubmitted=false;owned.clear();owned.add(0);gameRunning=true;$("gameOver").classList.add("hidden");$("startScreen").classList.add("hidden");$("stateLabel").textContent="SURVIVE";buildWeapons();beginWave();updateHud()}
function beginWave(){spawnLeft=5+wave*3;$("waveState").textContent="ACTIVE";$("waveHint").textContent=`${spawnLeft} infected detected. Wave ${wave} threat level rising.`;toast("WAVE "+wave+" INCOMING")}
function updateHud(){$("wave").textContent=wave;$("kills").textContent=kills;$("coins").textContent=coins;$("hp").textContent=Math.max(0,Math.ceil(player?.hp??100));$("currentWeapon").textContent=weapons[weaponIndex].name;$("upgradeCost").textContent=(30+damageLevel*35)+"¢";$("waveMeter").style.width=(spawnLeft===0?100:Math.min(100,((5+wave*3-spawnLeft)/(5+wave*3))*100))+"%"}
function buildWeapons(){const list=$("weaponList");list.innerHTML="";weapons.forEach((w,i)=>{const b=document.createElement("button");b.className="weapon"+(weaponIndex===i?" active":"");b.disabled=!owned.has(i)&&coins<w.price;b.innerHTML=`<span><b>${w.name}</b><small>${w.desc}</small></span><span class="price">${owned.has(i)?"OWNED":w.price+"¢"}</span>`;b.onclick=()=>{if(owned.has(i)){weaponIndex=i;toast(w.name+" EQUIPPED")}else if(coins>=w.price){coins-=w.price;owned.add(i);weaponIndex=i;toast(w.name+" PURCHASED")}else toast("NOT ENOUGH COINS");buildWeapons();updateHud()};list.appendChild(b)})}
function shoot(){if(!gameRunning)return;const w=weapons[weaponIndex];const now=performance.now();if(now-lastShot<w.rate)return;lastShot=now;const angle=Math.atan2(mouse.y-player.y,mouse.x-player.x);for(let i=0;i<w.pellets;i++){const spread=(i-(w.pellets-1)/2)*(weaponIndex===2?.105:0);const a=angle+spread;bullets.push({x:player.x+Math.cos(a)*20,y:player.y+Math.sin(a)*20,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,r:4,damage:w.damage+damageLevel*7,life:75})}for(let i=0;i<3;i++)particles.push({x:player.x+Math.cos(angle)*23,y:player.y+Math.sin(angle)*23,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,life:8,color:"#f0cf79"})}
function spawnZombie(){const side=Math.floor(Math.random()*4);let x=side===0?-25:side===1?W+25:Math.random()*W,y=side===2?-25:side===3?H+25:Math.random()*H;const tough=1+(wave-1)*.22;zombies.push({x,y,r:14+Math.random()*4,hp:Math.round((45+wave*10)*tough),max:45+wave*10,speed:(.55+Math.random()*.25)+wave*.075,attack:0,kind:Math.random()<Math.min(.08+wave*.012,.28)?"brute":"walker"})}
function burst(x,y,color,n=8){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*3;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:18+Math.random()*12,color})}}
function update(dt){if(!gameRunning)return;const f=dt/16.67;let dx=0,dy=0;if(keys.w||keys.ArrowUp)dy--;if(keys.s||keys.ArrowDown)dy++;if(keys.a||keys.ArrowLeft)dx--;if(keys.d||keys.ArrowRight)dx++;if(dx||dy){const l=Math.hypot(dx,dy);player.x+=dx/l*player.speed*f;player.y+=dy/l*player.speed*f}player.x=clamp(player.x,player.r,W-player.r);player.y=clamp(player.y,player.r,H-player.r);if(player.inv>0)player.inv-=dt;if(mouse.down||keys[" "])shoot();
spawnTimer-=dt;if(spawnLeft>0&&spawnTimer<=0){spawnZombie();spawnLeft--;spawnTimer=Math.max(180,850-wave*35)}if(spawnLeft===0&&zombies.length===0){wave++;player.hp=Math.min(100,player.hp+12);beginWave();updateHud()}
for(const b of bullets){b.x+=b.vx*f;b.y+=b.vy*f;b.life-=f;for(const z of zombies){if(z.hp>0&&Math.hypot(b.x-z.x,b.y-z.y)<z.r+b.r){z.hp-=b.damage;b.life=0;burst(b.x,b.y,"#c6df8b",3);if(z.hp<=0){kills++;coins+=z.kind==="brute"?18:10;burst(z.x,z.y,"#8cae68",12);updateHud()}break}}}bullets=bullets.filter(b=>b.life>0&&b.x>-10&&b.x<W+10&&b.y>-10&&b.y<H+10);
for(const z of zombies){if(z.hp<=0)continue;const a=Math.atan2(player.y-z.y,player.x-z.x);z.x+=Math.cos(a)*z.speed*f;z.y+=Math.sin(a)*z.speed*f;if(Math.hypot(player.x-z.x,player.y-z.y)<player.r+z.r-2&&player.inv<=0){player.hp-=z.kind==="brute"?18:9;player.inv=650;burst(player.x,player.y,"#e85d50",5);updateHud();if(player.hp<=0)endGame()}}
for(const p of particles){p.x+=p.vx*f;p.y+=p.vy*f;p.life-=f}particles=particles.filter(p=>p.life>0);updateHud()}
function draw(){ctx.fillStyle="#111b19";ctx.fillRect(0,0,W,H);
ctx.strokeStyle="#1c2a25";ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
for(let i=0;i<14;i++){const x=(i*173+51)%W,y=(i*97+35)%H;ctx.fillStyle="#1a2821";ctx.fillRect(x,y,22,14);ctx.fillStyle="#27352a";ctx.fillRect(x+4,y+4,14,5)}
for(const b of bullets){ctx.fillStyle="#f4d27c";ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()}
for(const z of zombies){if(z.hp<=0)continue;ctx.save();ctx.translate(z.x,z.y);const a=Math.atan2(player.y-z.y,player.x-z.x);ctx.rotate(a);ctx.fillStyle=z.kind==="brute"?"#596f43":"#708e58";ctx.beginPath();ctx.ellipse(0,0,z.r*1.1,z.r*.82,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#263526";ctx.fillRect(1,-z.r*.55,z.r*.75,5);ctx.fillStyle="#d8e69b";ctx.fillRect(z.r*.4,-z.r*.35,3,3);ctx.fillRect(z.r*.4,z.r*.1,3,3);ctx.restore();ctx.fillStyle="#26332b";ctx.fillRect(z.x-z.r,z.y-z.r-9,z.r*2,3);ctx.fillStyle="#d45e50";ctx.fillRect(z.x-z.r,z.y-z.r-9,z.r*2*Math.max(0,z.hp/z.max),3)}
for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/25);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3)}ctx.globalAlpha=1;
if(player){ctx.save();ctx.translate(player.x,player.y);const a=Math.atan2(mouse.y-player.y,mouse.x-player.x);ctx.rotate(a);ctx.fillStyle="#b8c3b2";ctx.fillRect(-10,-11,21,22);ctx.fillStyle="#37443b";ctx.fillRect(0,-5,27,10);ctx.fillStyle="#e1c77d";ctx.fillRect(15,-3,15,6);ctx.restore();if(player.inv>0&&Math.floor(player.inv/80)%2===0){ctx.strokeStyle="#f06458";ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,22,0,Math.PI*2);ctx.stroke()}}
ctx.fillStyle="#d8e6d5";ctx.font="12px monospace";ctx.fillText("INFECTED: "+zombies.filter(z=>z.hp>0).length,15,22);ctx.fillStyle="#a7e36b";ctx.fillText("WAVE "+wave,15,40);
}
function loop(t){const dt=Math.min(40,t-(last||t));last=t;update(dt);draw();requestAnimationFrame(loop)}
function endGame(){gameRunning=false;$("stateLabel").textContent="SIGNAL TERMINATED";$("finalStats").textContent=`Wave ${wave} · ${kills} eliminations · ${coins} coins`; $("gameOver").classList.remove("hidden");localSave($("playerName").value||"SURVIVOR",kills,wave)}
function localSave(name,score,w){const arr=JSON.parse(localStorage.getItem("deadSignalScores")||"[]");arr.push({name,score,wave:w});arr.sort((a,b)=>b.score-a.score);localStorage.setItem("deadSignalScores",JSON.stringify(arr.slice(0,10)));renderRanks()}
function renderRanks(){const arr=JSON.parse(localStorage.getItem("deadSignalScores")||"[]");const ol=$("leaderboard");ol.innerHTML="";if(!arr.length){ol.innerHTML='<li class="muted">No scores yet</li>';return}arr.forEach(r=>{const li=document.createElement("li");li.textContent=`${r.name} · W${r.wave}`;const s=document.createElement("span");s.textContent=r.score+" K";li.appendChild(s);ol.appendChild(li)})}
async function loadOnline(){
 const cfg=window.LEADERBOARD_CONFIG||{};
 if(!cfg.url||!cfg.anonKey){$("rankStatus").textContent="Leaderboard lokal aktif. Isi config.js untuk mengaktifkan ranking online.";return}
 try{
  const r=await fetch(cfg.url.replace(/\/$/,"")+"/rest/v1/scores?select=name,score,wave&order=score.desc&limit=10",{headers:{apikey:cfg.anonKey,Authorization:"Bearer "+cfg.anonKey}});
  if(!r.ok)throw Error("fetch failed");
  const data=await r.json();const ol=$("leaderboard");ol.innerHTML="";
  data.forEach(row=>{const li=document.createElement("li");li.textContent=`${row.name} · W${row.wave}`;const sp=document.createElement("span");sp.textContent=row.score+" K";li.appendChild(sp);ol.appendChild(li)});
  if(!data.length)ol.innerHTML='<li class="muted">No scores yet</li>';
  $("rankStatus").textContent="Online leaderboard connected.";
 }catch{$("rankStatus").textContent="Gagal menghubungkan leaderboard. Periksa config.js dan Supabase."}
}
$("scoreForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const cfg=window.LEADERBOARD_CONFIG||{};
 const name=$("playerName").value.trim().slice(0,14)||"SURVIVOR";
 localSave(name,kills,wave);
 if(!cfg.url||!cfg.anonKey){$("rankStatus").textContent="Skor tersimpan di perangkat ini. Isi config.js untuk ranking online.";return}
 try{
  const r=await fetch(cfg.url.replace(/\/$/,"")+"/rest/v1/scores",{method:"POST",headers:{apikey:cfg.anonKey,Authorization:"Bearer "+cfg.anonKey,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name,score:kills,wave})});
  if(!r.ok)throw Error("submit failed");
  $("rankStatus").textContent="Score submitted to online leaderboard.";loadOnline();
 }catch{$("rankStatus").textContent="Skor lokal tersimpan, tetapi pengiriman online gagal."}
});
$("startBtn").onclick=()=>{reset();toast("GOOD LUCK, SURVIVOR")};$("retryBtn").onclick=()=>{reset()};$("upgradeBtn").onclick=()=>{const cost=30+damageLevel*35;if(coins>=cost){coins-=cost;damageLevel++;toast("DAMAGE UPGRADED")}else toast("NOT ENOUGH COINS");updateHud()};
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();keys[k]=true;if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault();if(k>="1"&&k<="4"){const i=Number(k)-1;if(owned.has(i)){weaponIndex=i;buildWeapons();updateHud()}}});window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
function pointer(e){const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height}
canvas.addEventListener("pointermove",pointer);canvas.addEventListener("pointerdown",e=>{pointer(e);mouse.down=true});window.addEventListener("pointerup",()=>mouse.down=false);
document.querySelectorAll("[data-key]").forEach(b=>{const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();keys[k]=true});["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});
$("mobileFire").addEventListener("pointerdown",e=>{e.preventDefault();mouse.down=true});["pointerup","pointerleave","pointercancel"].forEach(ev=>$("mobileFire").addEventListener(ev,()=>mouse.down=false));
renderRanks();loadOnline();requestAnimationFrame(loop);
})();