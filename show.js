(function(){"use strict";
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var S=['Heute geht das erste Türchen auf. Ich habe es mir die ganze Nacht angeschaut.','Ein Wichtel sagt: Wer lacht, hat schon halb gewonnen.','Heute ist ein guter Tag für heissen Kakao. Das ist ein Fakt.','Am Nordpol kann man Schnee riechen. Frag mich nicht wie, es geht einfach.','Kleine Dinge sind oft die grössten. Fragt mal einen Wichtel.','Heute ist Samichlaustag! Schau mal in deine Schuhe und Stiefel.','Ein Wichtel hilft immer, auch wenn es heimlich ist.','Meine Mütze sitzt heute besonders gut. Das bringt Glück.','Guetzli sind besser, wenn man sie teilt.','Wer im Dezember früh aufsteht, sieht den schönsten Himmel.','Heute ein bisschen Schnee zählen? Ich bin bei 3 Millionen.','Sterne funkeln lauter, wenn man hinhört.','Ein Wichtel vergisst nie, wo seine Mütze liegt. Fast nie.','Halbzeit! Der Dezember rennt, aber ich renne schneller.','Weisst du, was am Nordpol am meisten fehlt? Ein Kaminfeuer ohne Rauch.','Backen macht glücklich, besonders beim Naschen.','Heute: Wichtel-Regel Nummer 1: Immer freundlich bleiben.','Schneeflocken sind nie gleich, genau wie wir.','Noch eine Woche! Die Luft riecht nach Tannenzweigen.','Ein Wichtel zählt nicht die Tage, er geniesst sie.','Heute hab ich eine Stunde nur Sterne beobachtet. Empfehle ich.','Die längste Nacht des Jahres ist die gemütlichste.','Fast da! Ich glaube, die Vorfreude ist das Schönste.','Heiligabend. Ich wünsche dir einen ganz gemütlichen Abend mit Menschen, die du gern hast.'];
function zp(){var p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).split('-');return{y:+p[0],m:+p[1],d:+p[2],k:p.join('-')};}
var z=zp(),mode=null,n=0,txt='';
if(z.y!==2026)return;
if(z.m===12&&z.d>=1&&z.d<=24){mode='dez';n=z.d;txt=S[n-1];}
else if(z.m===11&&z.d>=27){mode='vor';n=Math.round((Date.UTC(2026,11,1)-Date.UTC(2026,10,z.d))/864e5);txt=n===1?'Morgen ist es so weit: Der Dezember beginnt!':'Noch '+n+' Tage, dann beginnt der Dezember. Ich bin schon ganz kribbelig!';}
else return;
var key='wl_show_'+z.k;try{if(localStorage.getItem(key))return;}catch(e){}
var days=Math.max(0,Math.round((Date.UTC(2026,11,24)-Date.UTC(z.y,z.m-1,z.d))/864e5));
var ov=document.createElement('div');ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Lasses Dezember-Show');
ov.style.cssText='position:fixed;inset:0;z-index:200;background:radial-gradient(circle at 50% 35%,#16305f,#070d1f 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;color:#d6ecff;opacity:0;transition:opacity .6s;font-family:inherit';
var cv=document.createElement('canvas');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';ov.appendChild(cv);
var box=document.createElement('div');box.style.cssText='position:relative;max-width:460px';
box.innerHTML=(mode==='dez'?'<div style="letter-spacing:.3em;text-transform:uppercase;font-size:.8rem;color:#ffd27a">Türchen</div><div id="bn" style="font-family:Baskerville,Georgia,serif;font-size:7.5rem;line-height:1;font-weight:700;color:#fff;text-shadow:0 0 40px #ffd27a">'+n+'</div>':'<div style="letter-spacing:.3em;text-transform:uppercase;font-size:.8rem;color:#ffd27a">Bald geht es los</div><div id="bn" style="font-family:Baskerville,Georgia,serif;font-size:7.5rem;line-height:1;font-weight:700;color:#fff;text-shadow:0 0 40px #ffd27a">'+n+'</div><div style="margin-top:-6px">'+(n===1?'Tag':'Tage')+' bis zum 1. Dezember</div>')+
'<p style="margin:22px 0 6px;font-size:1.2rem;line-height:1.5;color:#fff">«'+txt+'»</p><div style="opacity:.85;margin-top:4px">– dein Lasse</div>'+(mode==='dez'?'<div style="margin-top:16px;opacity:.85">⏳ Noch <b>'+days+'</b> '+(days===1?'Tag':'Tage')+' bis Weihnachten</div>':'')+
'<button type="button" id="bx" style="margin-top:26px;border:0;padding:13px 30px;border-radius:999px;background:#ffd27a;color:#0b1226;font:800 1.05rem inherit;font-family:inherit;cursor:pointer;box-shadow:0 8px 24px #ffd27a55">Zur Seite ✨</button>';
ov.appendChild(box);
function close(){try{localStorage.setItem(key,'1');}catch(e){}ov.style.opacity='0';setTimeout(function(){ov.remove();stop=1;},650);}
var stop=0;
function go(){document.body.appendChild(ov);requestAnimationFrame(function(){ov.style.opacity='1';});
ov.querySelector('#bx').onclick=close;ov.addEventListener('click',function(e){if(e.target===ov)close();});addEventListener('keydown',function esc(e){if(e.key==='Escape'&&document.body.contains(ov)){close();removeEventListener('keydown',esc);}});
if(reduce)return;var g=cv.getContext('2d'),W,H,P=[],d=Math.min(devicePixelRatio||1,2);function sz(){W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0);}sz();addEventListener('resize',sz);
function burst(x,y){var h=[48,170,350,200,280][Math.floor(Math.random()*5)],c=40+Math.floor(Math.random()*30);for(var i=0;i<c;i++){var a=Math.PI*2*i/c,s=70+Math.random()*130;P.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0,m:1.1+Math.random()*.7,h:h});}}
var t=0,nx=0,l=performance.now();
(function f(now){if(stop)return;var dt=Math.min(.05,(now-l)/1000);l=now;t+=dt;g.clearRect(0,0,W,H);if(t>nx&&t<9){nx=t+.55+Math.random()*.5;burst(W*(.15+Math.random()*.7),H*(.12+Math.random()*.35));}
g.globalCompositeOperation='lighter';for(var i=P.length-1;i>=0;i--){var p=P[i];p.l+=dt;if(p.l>p.m){P.splice(i,1);continue;}p.vy+=90*dt;p.vx*=.985;p.vy*=.985;p.x+=p.vx*dt;p.y+=p.vy*dt;var a=1-p.l/p.m;g.fillStyle='hsla('+p.h+',100%,'+(60+a*20)+'%,'+a+')';g.beginPath();g.arc(p.x,p.y,2.2*a+.6,0,6.3);g.fill();}g.globalCompositeOperation='source-over';requestAnimationFrame(f);})(l);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
