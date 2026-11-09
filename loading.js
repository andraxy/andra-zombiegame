window.addEventListener("load",()=>{
  const screen=document.getElementById("loadingScreen");
  const bar=document.getElementById("loadingProgress");
  const label=document.getElementById("loadingText");
  const messages=["INITIALIZING SURVIVAL SYSTEM...","LOADING ZOMBIE DATABASE...","PREPARING WEAPON ARSENAL...","GENERATING INFECTED ZONE...","ESTABLISHING CONNECTION...","SYSTEM READY."];
  let value=0;
  const timer=setInterval(()=>{
    value=Math.min(100,value+Math.floor(Math.random()*9)+4);
    bar.style.width=value+"%";
    label.textContent=messages[Math.min(Math.floor(value/17),messages.length-1)];
    if(value===100){clearInterval(timer);setTimeout(()=>screen.classList.add("hide"),450);}
  },100);
});