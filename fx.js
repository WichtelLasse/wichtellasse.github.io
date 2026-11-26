(function(){"use strict";
if(window.__fx)return;window.__fx=1;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var cv=document.createElement('canvas');cv.setAttribute('aria-hidden','true');
cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40';
document.body.appendChild(cv);var g=cv.getContext('2d'),W=0,H=0,P=[],steps=[],glit=true,aur=false;
try{aur=localStorage.getItem('wl_aur')==='1';glit=localStorage.getItem('wl_gl')!=='0';}catch(e){}
function size(){var d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0);}
size();addEventListener('resize',size);
var last=0;
function spark(x,y,n){for(var i=0;i<n;i++){var a=Math.random()*6.283,s=20+Math.random()*60;P.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,l:0,m:.6+Math.random()*.7,r:1+Math.random()*2.2,h:Math.random()<.5?48:Math.random()<.5?170:200});}}
addEventListener('pointermove',function(e){if(!glit||reduce)return;var t=performance.now();if(t-last<30)return;last=t;if(e.pointerType==='mouse'&&!e.buttons&&Math.random()<.55)return;spark(e.clientX,e.clientY,2);},{passive:true});
addEventListener('pointerdown',function(e){if(glit&&!reduce)spark(e.clientX,e.clientY,10);},{passive:true});
function foot(x,y,a,left){steps.push({x:x,y:y,a:a,l:left,t:0});}
var walk=null;
function startWalk(){if(reduce)return;var fromLeft=Math.random()<.5,y=H*(.55+Math.random()*.35),x=fromLeft?-30:W+30,dir=fromLeft?1:-1;walk={x:x,y:y,d:dir,n:0,k:0,c:0};}
setInterval(function(){if(!walk&&document.visibilityState==='visible'&&Math.random()<.5)startWalk();},9000);
function star(x,y,r,rot){g.beginPath();for(var i=0;i<8;i++){var R=i%2?r*.28:r,a=rot+i*Math.PI/4;g.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R);}g.closePath();g.fill();}
var t0=performance.now();
function loop(now){var dt=Math.min(.05,(now-t0)/1000);t0=now;g.clearRect(0,0,W,H);
if(aur){var gr=g.createLinearGradient(0,0,0,H*.7);gr.addColorStop(0,'rgba(80,255,180,'+(.1+.05*Math.sin(now/1500))+')');gr.addColorStop(.5,'rgba(120,120,255,.07)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
if(!reduce&&Math.random()<.35)P.push({x:Math.random()*W,y:Math.random()*H*.6,vx:0,vy:12,l:0,m:2,r:1+Math.random()*1.8,h:150+Math.random()*80});}
if(walk){walk.c+=dt;if(walk.c>.32){walk.c=0;walk.k^=1;var ox=Math.sin(0)*0;foot(walk.x,walk.y+(walk.k?7:-7),walk.d,walk.k);}walk.x+=walk.d*95*dt;walk.y+=Math.sin(walk.x/90)*8*dt;if(walk.x<-60||walk.x>W+60)walk=null;}
for(var i=steps.length-1;i>=0;i--){var s=steps[i];s.t+=dt;if(s.t>4){steps.splice(i,1);continue;}var al=Math.max(0,1-s.t/4)*.55;g.save();g.translate(s.x,s.y);g.scale(s.a,1);g.fillStyle='rgba(214,236,255,'+al+')';g.beginPath();g.ellipse(0,0,9,4.5,0,0,6.3);g.fill();g.beginPath();g.ellipse(-11,0,4,3.4,0,0,6.3);g.fill();g.restore();}
g.globalCompositeOperation='lighter';
for(var j=P.length-1;j>=0;j--){var p=P[j];p.l+=dt;if(p.l>p.m){P.splice(j,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;var a=1-p.l/p.m;g.fillStyle='hsla('+p.h+',100%,75%,'+a+')';star(p.x,p.y,p.r*2.2,p.l*4);}
g.globalCompositeOperation='source-over';
requestAnimationFrame(loop);}
requestAnimationFrame(loop);
var box=document.createElement('div');box.style.cssText='position:fixed;left:12px;bottom:12px;z-index:60;display:flex;gap:8px';
function btn(t,title,on,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.title=title;b.setAttribute('aria-label',title);b.setAttribute('aria-pressed',on);b.style.cssText='width:44px;height:44px;border-radius:50%;border:1px solid #ffffff33;background:#0a122bcc;color:#fff;font-size:20px;cursor:pointer;backdrop-filter:blur(6px);opacity:'+(on?1:.55);b.onclick=function(){var v=fn();b.setAttribute('aria-pressed',v);b.style.opacity=v?1:.55;};box.appendChild(b);}
btn('✨','Glitzer-Zauberstab an/aus',glit,function(){glit=!glit;try{localStorage.setItem('wl_gl',glit?'1':'0');}catch(e){}return glit;});
btn('🌌','Nordlicht-Modus an/aus',aur,function(){aur=!aur;try{localStorage.setItem('wl_aur',aur?'1':'0');}catch(e){}return aur;});
document.body.appendChild(box);
})();
