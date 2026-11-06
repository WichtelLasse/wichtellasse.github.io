(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ---------- Titel-Buchstaben ---------- */
$$('.title .w').forEach((w,wi)=>{
  const txt=w.getAttribute('aria-label');
  [...txt].forEach((c,i)=>{const b=document.createElement('b');b.textContent=c;b.setAttribute('aria-hidden','true');b.style.animationDelay=(0.15+wi*0.35+i*0.06)+'s';w.appendChild(b);});
});


/* ---------- Himmel: Aurora, Sterne, Schnee ---------- */
const cv=$('#sky'), cx=cv.getContext('2d');
let W=0,H=0,stars=[],flakes=[],t0=performance.now(),scrollY=0;
function sizeCanvas(){
  const dpr=Math.min(devicePixelRatio||1,1.5);
  W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
  stars=Array.from({length:Math.round(W*H/9000)},()=>({x:Math.random()*W,y:Math.random()*H*0.8,r:Math.random()*1.3+.2,p:Math.random()*6}));
  const n=W<700?70:140;
  flakes=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2.6+.6,v:Math.random()*30+18,d:Math.random()*Math.PI*2,l:Math.random()}));
}
function aurora(t){
  const cols=[[80,255,180],[80,160,255],[170,100,255]];
  cx.globalCompositeOperation='lighter';
  cols.forEach((c,i)=>{
    const base=H*(.22+i*.09)-scrollY*.02, amp=H*.06+i*8, len=H*.28;
    cx.beginPath();
    const steps=Math.ceil(W/24);
    const up=[],dn=[];
    for(let s=0;s<=steps;s++){
      const x=s*24;
      const y=base+Math.sin(x*.004+t*.0003*(1+i*.3)+i*2)*amp+Math.sin(x*.011-t*.0005+i)*amp*.4;
      up.push([x,y]);dn.push([x,y+len*(.7+.3*Math.sin(x*.006+t*.0004+i))]);
    }
    cx.moveTo(up[0][0],up[0][1]);up.forEach(p=>cx.lineTo(p[0],p[1]));
    for(let s=dn.length-1;s>=0;s--)cx.lineTo(dn[s][0],dn[s][1]);
    cx.closePath();
    const g=cx.createLinearGradient(0,base-amp,0,base+len);
    g.addColorStop(0,`rgba(${c},0)`);g.addColorStop(.25,`rgba(${c},.20)`);g.addColorStop(1,`rgba(${c},0)`);
    cx.fillStyle=g;cx.fill();
  });
  cx.globalCompositeOperation='source-over';
}
function frame(now){
  const t=now-t0;
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050a1a');g.addColorStop(.6,'#0b1633');g.addColorStop(1,'#14264d');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  stars.forEach(s=>{cx.globalAlpha=.4+.6*Math.abs(Math.sin(t*.001+s.p));cx.fillStyle='#fff';cx.beginPath();cx.arc(s.x,s.y-scrollY*.03,s.r,0,6.3);cx.fill();});
  cx.globalAlpha=1;
  aurora(t);
  cx.fillStyle='#fff';
  flakes.forEach(f=>{
    if(!reduce){f.y+=f.v*.016*(.6+f.r*.3);f.x+=Math.sin(t*.001+f.d)*.4+.15;}
    if(f.y>H+6){f.y=-6;f.x=Math.random()*W;} if(f.x>W+6)f.x=-6;
    cx.globalAlpha=.35+f.l*.55;cx.beginPath();cx.arc(f.x,(f.y-scrollY*.06*f.r*0.3+H*4)%(H+12)-6,f.r,0,6.3);cx.fill();
  });
  cx.globalAlpha=1;
  if(!reduce)requestAnimationFrame(frame);
}
sizeCanvas();addEventListener('resize',()=>{sizeCanvas();if(reduce)frame(performance.now());});
requestAnimationFrame(frame);


/* ---------- Hero-Mütze folgt dem Zeiger ---------- */
const hat=$('#hat'),hatWrap=$('#hatWrap');
if(!hat){}
function tiltHat(x,y){if(!hat)return;
  const r=hatWrap.getBoundingClientRect();
  const dx=(x-(r.left+r.width/2))/innerWidth, dy=(y-(r.top+r.height/2))/innerHeight;
  hat.style.transform=`rotateY(${dx*60}deg) rotateX(${-dy*40}deg)`;
}
addEventListener('pointermove',e=>tiltHat(e.clientX,e.clientY),{passive:true});


/* ---------- Reveal ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));


/* ---------- gemeinsame Hilfen ---------- */
function setSteps(list,idx){list.forEach((s,i)=>s.classList.toggle('on',i===idx));}
function sceneScale(){return clamp(innerWidth/760,.5,1.2)*(innerHeight<640?.8:1);}
function progressOf(el){const r=el.getBoundingClientRect();return clamp(-r.top/(r.height-innerHeight));}
let stages=[],ticking=false;
function onScroll(){
  scrollY=window.scrollY||0;
  const max=document.documentElement.scrollHeight-innerHeight;
  const pr=$('#progress');if(pr)pr.style.transform=`scaleX(${max>0?scrollY/max:0})`;
  $$('[data-par]').forEach(el=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)el.style.transform=`translateY(${(-r.top*parseFloat(el.dataset.par)).toFixed(1)}px) scale(1.15)`;});
  stages.forEach(s=>{const r=s.el.getBoundingClientRect();if(r.bottom>-200&&r.top<innerHeight+200)s.fn(progressOf(s.el));});
  ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
addEventListener('resize',onScroll);
/* ---------- Datum, Countdown, Ton ---------- */
function nowMs(){return window.__now?window.__now:Date.now();}
function zToday(){if(window.__today)return window.__today;return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich'}).format(new Date(nowMs()));}
function runCountdowns(){
  $$('[data-cd]').forEach(el=>{
    const diff=new Date(el.dataset.cd).getTime()-nowMs();
    if(diff<=0){el.textContent='0';return;}
    const d=diff/86400000;
    el.textContent=el.dataset.fmt==='d'?String(Math.ceil(d)):Math.floor(d)+' Tage';
  });
}
runCountdowns();setInterval(runCountdowns,60000);
(function(){
  const nav=$('.nav');if(!nav)return;
  const b=document.createElement('button');b.className='snd';b.type='button';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Weihnachtsklänge ein oder aus');b.textContent='🔕';nav.appendChild(b);
  let ctx=null,master=null,timer=null,on=false;
  const notes=[523.25,587.33,659.25,783.99,880,1046.5];
  function bell(){
    if(!on||!ctx)return;
    const t=ctx.currentTime,f=notes[Math.floor(Math.random()*notes.length)];
    [1,2.01,3.02].forEach((m,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.value=f*m;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12/(i+1),t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+2.6/(i+1));
      o.connect(g);g.connect(master);o.start(t);o.stop(t+2.8);
    });
    timer=setTimeout(bell,700+Math.random()*1500);
  }
  function crackle(){
    if(!on||!ctx)return;
    const len=ctx.sampleRate*.03,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
    const s=ctx.createBufferSource();s.buffer=buf;const g=ctx.createGain();g.gain.value=.12+Math.random()*.1;
    const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;
    s.connect(f);f.connect(g);g.connect(master);s.start();
    setTimeout(crackle,60+Math.random()*420);
  }
  b.addEventListener('click',()=>{
    on=!on;b.textContent=on?'🔔':'🔕';b.setAttribute('aria-pressed',on);
    if(on){
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC){on=false;b.textContent='🔕';return;}
      if(!ctx){ctx=new AC();master=ctx.createGain();master.gain.value=.5;
        const dly=ctx.createDelay(1);dly.delayTime.value=.32;const fb=ctx.createGain();fb.gain.value=.38;
        master.connect(ctx.destination);master.connect(dly);dly.connect(fb);fb.connect(dly);dly.connect(ctx.destination);}
      ctx.resume();bell();crackle();
    }else{clearTimeout(timer);if(ctx)ctx.suspend();}
  });
})();
window.L={today:zToday,now:nowMs,$,$$,clamp,lerp,ease,reduce,setSteps,sceneScale,progressOf,
  stages:(a)=>{stages=a;a.forEach(s=>s.fn(0));onScroll();},
  tilt:(sel)=>$$(sel).forEach(d=>{
    d.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch')return;const r=d.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;d.style.transform=`rotateY(${(x-.5)*14}deg) rotateX(${(.5-y)*14}deg) translateZ(8px)`;d.style.setProperty('--mx',x*100+'%');d.style.setProperty('--my',y*100+'%');});
    d.addEventListener('pointerleave',()=>{d.style.transform='';});
  }),
  onScroll};
onScroll();
})();

/* ---------- Extras: Menü-Links und Live-Pille ---------- */
(function(){
  try{
    const ul=document.querySelector('.nav ul');
    if(ul){const k=ul.querySelector('a[href="kontakt.html"]');[['live.html','📍 Live'],['zeugnis.html','Zeugnis'],['quiz.html','Quiz']].forEach(([h,t])=>{if(ul.querySelector('a[href="'+h+'"]'))return;const li=document.createElement('li'),a=document.createElement('a');a.className='l';a.href=h;a.textContent=t;if(location.pathname.endsWith('/'+h))a.className+=' cur';li.appendChild(a);ul.insertBefore(li,k?k.parentNode:null);});}
    if(!location.pathname.endsWith('/live.html')){
      const S=Date.parse('2026-11-30T00:00:00+01:00'),D=7200000;
      const p=document.createElement('a');p.href='live.html';p.className='livepill';
      const st=()=>{const e=L.now()-S;p.innerHTML=e<0?'📍 <b>Lasse live</b> · Abfahrt am 30.11. um 0:00':e<D?'🛷 <b>Lasse ist unterwegs!</b> Live ansehen':'🏠 <b>Lasse ist da!</b>';};
      st();setInterval(st,30000);document.body.appendChild(p);
      const css=document.createElement('style');css.textContent='.livepill{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:45;padding:10px 18px;border-radius:999px;background:#070d1fe6;border:1px solid #7dffd088;color:#fff;text-decoration:none;font-size:.88rem;box-shadow:0 8px 30px #0009,0 0 0 0 #7dffd055;backdrop-filter:blur(8px);white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis}.livepill b{color:#7dffd0}@media print{.livepill{display:none}}';document.head.appendChild(css);
    }
  }catch(e){}
})();
