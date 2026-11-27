(function(){"use strict";
var c=document.getElementById('st'),d=Math.min(devicePixelRatio||1,2);c.width=800*d;c.height=520*d;var g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function zp(){var f=new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),o={};f.forEach(function(p){o[p.type]=p.value});return{y:+o.year,m:+o.month,d:+o.day,h:+o.hour,mi:+o.minute};}
var T=zp();
/* Zustand: away | home-asleep | home-awake | family | south */
function state(t){var k=t.y*10000+t.m*100+t.d,mins=t.h*60+t.mi;
if(k<20261130||(k===20261130&&mins<180))return 'away';
if(k>20261225||(k===20261225&&mins>=180)){if(k<=20261231)return 'family';if(k<20270202)return 'south';}
return(t.h>=1&&t.h<5)?'awake':'asleep';}
var st=state(T);
var label={away:'Lasse ist noch unterwegs, die Stube ist leer',asleep:'Lasse schläft hinter der Tür',awake:'Lasse ist wach und bastelt',family:'Lasse feiert bei seiner Familie, die Stube ist leer',south:'Lasse macht Ferien am Südpol, die Stube ist leer'}[st];
document.getElementById('stl').textContent=label;
document.getElementById('stc').textContent=('0'+T.h).slice(-2)+':'+('0'+T.mi).slice(-2)+' Uhr';
var HOT=[
{n:'Fenster',x:90,y:60,w:200,h:190,t:{asleep:'Draussen schneit es. Ich träume gerade, dass es Schneeflocken regnet.',awake:'Schau mal, wie der Schnee im Mondlicht glitzert!',away:'Das Fenster ist dunkel. Ich bin bald wieder da.',def:'Das Fenster ist ruhig und dunkel.'}},
{n:'Labor',x:330,y:120,w:200,h:120,t:{asleep:'Die Fläschchen blubbern ganz leise im Schlaf.',awake:'Mein Labor! Blau plus Gelb gibt Grün, das weiss ich jetzt schon.',away:'Hier hat Lasse seine Reagenzgläser stehen.',def:'Lasses Labor mit bunten Fläschchen.'}},
{n:'Ofen',x:590,y:250,w:140,h:170,t:{asleep:'Das Feuer knistert leise. Es hält die Stube den ganzen Tag warm.',awake:'Gemütlich, oder? Hier trockne ich meine Socken.',away:'Der Ofen ist aus, bis ich zurück bin.',def:'Der kleine Ofen steht bereit.'}},
{n:'Bett',x:60,y:300,w:250,h:140,t:{asleep:'Pssst! Lasse schläft. Zzz...',awake:'Mein Bett ist leer, ich bin ja wach.',away:'Das Bett ist gemacht. Bald liegt jemand drin.',def:'Das Bett von Lasse.'}},
{n:'Milchreis',x:360,y:330,w:130,h:110,t:{asleep:'Der Milchreis ist noch warm. Er wartet auf die Nacht.',awake:'Mmh, der beste Milchreis der Welt, mit Zimt!',away:'Der Topf ist leer, aber er riecht nach Zimt.',def:'Ein Topf Milchreis.'}},
{n:'Tür',x:690,y:70,w:90,h:200,t:{asleep:'Bitte nicht stören. Lasse schläft von 5 bis 1 Uhr.',awake:'Das ist die Wichteltür. Wenn du leise bist, höre ich dich.',away:'Hinter dieser Tür ist Lasses Stube.',def:'Die Wichteltür.'}}];
var bub=document.getElementById('stb');
function say(h){var s=h.t[st]||h.t.def;bub.innerHTML='<b>'+h.n+':</b> '+s;bub.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){bub.classList.remove('on')},5200);}
c.addEventListener('pointerdown',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)*800/r.width,y=(e.clientY-r.top)*520/r.height;for(var i=0;i<HOT.length;i++){var h=HOT[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){say(h);return;}}});
var snow=[];for(var i=0;i<60;i++)snow.push({x:Math.random()*200,y:Math.random()*190,v:12+Math.random()*20,r:.8+Math.random()*1.6});
var bubbles=[];
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function draw(now,dt){var t=now/1000,lit=(st==='awake'),home=(st==='awake'||st==='asleep');
/* Wand */
var gr=g.createLinearGradient(0,0,0,520);gr.addColorStop(0,'#5a3a22');gr.addColorStop(1,'#3b2414');g.fillStyle=gr;g.fillRect(0,0,800,520);
g.strokeStyle='#00000030';g.lineWidth=2;for(var i=0;i<14;i++){g.beginPath();g.moveTo(i*60,0);g.lineTo(i*60,380);g.stroke();}
/* Boden */
g.fillStyle='#2b1a0e';g.fillRect(0,380,800,140);g.strokeStyle='#00000040';for(var j=0;j<6;j++){g.beginPath();g.moveTo(0,395+j*24);g.lineTo(800,395+j*24);g.stroke();}
g.fillStyle='#7b3b28';g.beginPath();g.ellipse(400,470,260,36,0,0,6.3);g.fill();g.fillStyle='#a54c34';g.beginPath();g.ellipse(400,470,220,28,0,0,6.3);g.fill();
/* Fenster */
g.fillStyle='#2a1a0d';g.fillRect(84,54,212,202);g.save();g.beginPath();g.rect(90,60,200,190);g.clip();var sk=g.createLinearGradient(0,60,0,250);sk.addColorStop(0,'#09122c');sk.addColorStop(1,'#1d3f7a');g.fillStyle=sk;g.fillRect(90,60,200,190);
g.fillStyle='#fff';for(var s=0;s<25;s++){g.globalAlpha=.4+.5*Math.abs(Math.sin(t+s));g.fillRect(95+(s*37)%190,66+(s*23)%90,1.5,1.5);}g.globalAlpha=1;
g.fillStyle='#fdf6d8';g.beginPath();g.arc(240,100,16,0,6.3);g.fill();g.fillStyle='#e9f3ff';g.beginPath();g.moveTo(90,250);g.quadraticCurveTo(190,205,290,250);g.fill();
g.fillStyle='#fff';snow.forEach(function(f){f.y+=f.v*dt;if(f.y>190){f.y=0;f.x=Math.random()*200;}g.beginPath();g.arc(90+f.x+Math.sin(t+f.y)*4,60+f.y,f.r,0,6.3);g.fill();});g.restore();
g.fillStyle='#2a1a0d';g.fillRect(186,60,8,190);g.fillRect(90,150,200,8);
if(!home){g.fillStyle='#00000066';g.fillRect(90,60,200,190);}
/* Regal + Labor */
g.fillStyle='#6b4528';g.fillRect(320,225,220,10);g.fillStyle='#4a2f1a';g.fillRect(330,235,8,20);g.fillRect(522,235,8,20);
var cols=['#4aa3ff','#ffd24a','#6be28a','#ff7a9a','#b17aff'];
cols.forEach(function(col,i){var x=345+i*38,h=46+(i%2)*12;g.fillStyle='#ffffff30';rr(x-1,225-h-1,24,h+1,6);g.fill();g.fillStyle=col;g.globalAlpha=.9;rr(x+1,225-h*.7,20,h*.7-1,5);g.fill();g.globalAlpha=1;g.fillStyle='#ffffff90';g.fillRect(x+3,225-h+2,3,h*.5);g.fillStyle='#2a1a0d';g.fillRect(x+4,225-h-5,14,6);
if(home&&!reduce&&Math.random()<.04)bubbles.push({x:x+11,y:225-h*.5,l:0,c:col});});
bubbles.forEach(function(b){b.l+=dt;b.y-=22*dt;g.globalAlpha=Math.max(0,1-b.l/1.4);g.fillStyle=b.c;g.beginPath();g.arc(b.x+Math.sin(b.l*6)*3,b.y,2.2,0,6.3);g.fill();});bubbles=bubbles.filter(function(b){return b.l<1.4});g.globalAlpha=1;
g.fillStyle='#fff8d0';g.font='700 13px system-ui';g.textAlign='center';g.fillText('Lasses Labor',430,152);
/* Tür */
g.fillStyle='#3a2414';g.fillRect(690,70,90,200);g.fillStyle='#5a3a22';rr(698,78,74,184,6);g.fill();g.fillStyle='#ffd27a';g.beginPath();g.arc(708,176,5,0,6.3);g.fill();
if(st==='asleep'||st==='awake'){g.fillStyle='#fff3d0';g.fillRect(703,100,64,34);g.fillStyle='#2a1a0d';g.font='700 10px system-ui';g.fillText(st==='asleep'?'BITTE NICHT':'LASSE IST',735,114);g.fillText(st==='asleep'?'STÖREN (Zzz)':'WACH',735,127);}
/* Ofen */
g.fillStyle='#222';rr(590,290,140,130,10);g.fill();g.fillStyle='#333';rr(600,300,120,110,8);g.fill();
var fl=home?1:.15;g.fillStyle='#000';rr(615,330,90,60,8);g.fill();
if(home){var fa=.75+.25*Math.sin(t*9);g.fillStyle='rgba(255,140,40,'+fa+')';g.beginPath();g.moveTo(630,388);g.quadraticCurveTo(645+Math.sin(t*7)*4,340,660,388);g.fill();g.fillStyle='rgba(255,210,90,'+fa+')';g.beginPath();g.moveTo(655,388);g.quadraticCurveTo(672+Math.sin(t*8)*4,350,690,388);g.fill();}
g.fillStyle='#222';g.fillRect(650,250,28,44);
/* Tisch + Milchreis */
g.fillStyle='#6b4528';g.fillRect(330,400,200,12);g.fillStyle='#4a2f1a';g.fillRect(345,412,12,60);g.fillRect(505,412,12,60);
g.fillStyle='#b9b9c2';rr(375,365,80,40,10);g.fill();g.fillStyle='#fff';g.beginPath();g.ellipse(415,366,38,8,0,0,6.3);g.fill();g.fillStyle='#c68a52';for(var k=0;k<8;k++)g.fillRect(392+k*5,364+(k%2)*2,2,2);
if(home&&!reduce){for(var q=0;q<3;q++){var u=((t*.6+q/3)%1);g.globalAlpha=(1-u)*.5;g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(400+q*15,350);g.quadraticCurveTo(395+q*15+Math.sin(u*8)*6,330-u*30,400+q*15,310-u*40);g.stroke();}g.globalAlpha=1;}
/* Bett */
g.fillStyle='#4a2f1a';g.fillRect(55,340,260,100);g.fillStyle='#8c1d25';rr(65,330,240,60,10);g.fill();g.fillStyle='#f4efe4';rr(70,322,70,36,10);g.fill();
if(st==='asleep'){var br=Math.sin(t*1.6)*2;g.fillStyle='#f3c9a0';g.beginPath();g.arc(105,336+br*.3,14,0,6.3);g.fill();g.fillStyle='#c8232a';g.beginPath();g.moveTo(90,332);g.quadraticCurveTo(105,300,122,330);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(90,330,34,6);
g.fillStyle='#b5282f';rr(110,340-br,190,46,16);g.fill();g.fillStyle='#ffd27a';for(var z=0;z<6;z++)g.fillRect(130+z*28,350-br,10,4);
g.fillStyle='#ffffffcc';g.font='800 '+(18+Math.sin(t*2)*2)+'px system-ui';g.fillText('Z',150,298-Math.abs(Math.sin(t))*8);g.font='800 24px system-ui';g.fillText('Z',172,274-Math.abs(Math.sin(t+1))*10);g.font='800 30px system-ui';g.fillText('Z',198,246-Math.abs(Math.sin(t+2))*12);}
/* Lasse wach */
if(st==='awake'){var bx=410+Math.sin(t*.5)*60,by=372+Math.sin(t*3)*1.5;g.save();g.translate(bx,by);g.fillStyle='#c8232a';rr(-20,-16,40,50,12);g.fill();g.fillStyle='#fff';g.fillRect(-20,10,40,5);g.fillStyle='#f3c9a0';g.beginPath();g.arc(0,-28,15,0,6.3);g.fill();g.fillStyle='#222';g.fillRect(-6,-30,3,3);g.fillRect(4,-30,3,3);g.strokeStyle='#222';g.lineWidth=1.5;g.beginPath();g.arc(0,-24,5,.2,2.9);g.stroke();
g.fillStyle='#c8232a';g.beginPath();g.moveTo(-17,-36);g.quadraticCurveTo(0,-80,20,-34);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(-17,-37,38,7);g.beginPath();g.arc(21,-52+Math.sin(t*4)*2,6,0,6.3);g.fill();g.restore();}
/* Lampe */
g.strokeStyle='#222';g.lineWidth=2;g.beginPath();g.moveTo(400,0);g.lineTo(400,44);g.stroke();g.fillStyle=home?'#ffd27a':'#6b5a3a';g.beginPath();g.arc(400,56,14+(home?Math.sin(t*5)*.6:0),0,6.3);g.fill();
if(home){var gl=g.createRadialGradient(400,56,6,400,56,260);gl.addColorStop(0,'rgba(255,200,100,.28)');gl.addColorStop(1,'rgba(255,200,100,0)');g.fillStyle=gl;g.fillRect(0,0,800,520);}
if(!home){g.fillStyle='rgba(5,10,25,.48)';g.fillRect(0,0,800,520);}
/* Baum */
g.fillStyle='#1f6b46';[[640,110,34],[640,92,26],[640,76,18]].forEach(function(a){g.beginPath();g.moveTo(a[0],a[1]-26);g.lineTo(a[0]-a[2],a[1]+10);g.lineTo(a[0]+a[2],a[1]+10);g.closePath();g.fill();});
if(false){}}
var l=performance.now();(function f(n){var dt=Math.min(.05,(n-l)/1000);l=n;draw(n,dt);requestAnimationFrame(f);})(l);
setInterval(function(){T=zp();var s2=state(T);if(s2!==st){st=s2;label=({away:'Lasse ist noch unterwegs, die Stube ist leer',asleep:'Lasse schläft hinter der Tür',awake:'Lasse ist wach und bastelt',family:'Lasse feiert bei seiner Familie, die Stube ist leer',south:'Lasse macht Ferien am Südpol, die Stube ist leer'})[st];document.getElementById('stl').textContent=label;}document.getElementById('stc').textContent=('0'+T.h).slice(-2)+':'+('0'+T.mi).slice(-2)+' Uhr';},20000);
})();
