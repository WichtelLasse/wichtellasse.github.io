(function(){"use strict";
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function ptr(c,e){var r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
/* Sterne anzeigen + Willkommensgeschenk */
function upd(){var e=$('#starcount');if(e)e.textContent=WL.stars();}
if(WL.g('wl_welcome',0)===0){WL.s('wl_welcome',1);WL.add(20);}
upd();setInterval(upd,1000);
/* Tabs */
var stops={};
function show(p){$$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.p===p)});$$('.pane').forEach(function(x){x.hidden=x.id!=='p-'+p});for(var k in stops)if(k!==p&&stops[k])stops[k]();if(p==='garage')garage();if(p==='rentier')deerUI();if(p==='kugel'&&kugel.start)kugel.start();try{history.replaceState(null,'','#'+p)}catch(e){}
var t=$('.tabs');try{t.scrollIntoView({block:'start',behavior:'smooth'})}catch(e){}}
$$('.tabs button').forEach(function(b){b.onclick=function(){show(b.dataset.p)}});
/* ========== Garage ========== */
function garage(){var box=$('#glist');box.innerHTML='';var cur=WL.skin().id,own=WL.owned();
WL.SK.forEach(function(k){var card=document.createElement('div');card.className='gcard'+(k.id===cur?' act':'');
var cv=document.createElement('canvas');cv.width=160;cv.height=110;card.appendChild(cv);var g=cv.getContext('2d');
var h=document.createElement('div');h.innerHTML='<b>'+k.n+'</b><small>'+k.d+'</small>';card.appendChild(h);
var b=document.createElement('button');b.className='btn';var has=own.indexOf(k.id)>=0;
b.textContent=k.id===cur?'✓ Aktiv':has?'Benutzen':'Kaufen · '+k.p+' ⭐';if(k.id===cur)b.disabled=true;
b.onclick=function(){if(!has){if(!WL.buy(k.id)){WL.toast('Dir fehlen noch '+(k.p-WL.stars())+' ⭐. Spiel ein paar Runden!');return;}WL.toast('Gekauft: '+k.n+' 🎉');}WL.use(k.id);upd();garage();};
card.appendChild(b);box.appendChild(card);
(function loop(t){if(!cv.isConnected)return;g.clearRect(0,0,160,110);g.fillStyle='#16305f';rr(g,0,0,160,110,12);g.fill();
for(var i=0;i<8;i++){g.fillStyle=WL.trail(k,t/1000+i*.15);g.globalAlpha=1-i/8;g.beginPath();g.arc(80-i*9,96+Math.sin(t/200+i)*2,4-i*.3,0,6.3);g.fill();}g.globalAlpha=1;
WL.drawSled(g,80,58+Math.sin(t/400)*3,Math.sin(t/600)*3,k,t);requestAnimationFrame(loop);})(0);});
$('#gstars').textContent=WL.stars();}
stops.garage=null;
/* ========== Bauen ========== */
var PARTS={frame:[{n:'Holzbrett',m:3,g:2,c:'#b07a45'},{n:'Metallkiste',m:5,g:1,c:'#9aa7bd'},{n:'Eisblock',m:2,g:0,c:'#bfe6ff'}],
drive:[{n:'Gummiband',t:4},{n:'Feder',t:6},{n:'Rakete',t:10,m:2}],
wheel:[{n:'Kleine Räder',g:1,s:0},{n:'Grosse Räder',g:1,s:0,m:1,sp:1},{n:'Kufen',g:-1,s:2}],
extra:[{n:'Nichts',l:0},{n:'Flügel',l:4,m:1},{n:'Fallschirm',l:2,d:1},{n:'Propeller',l:1,t:3}]};
var pick={frame:0,drive:0,wheel:0,extra:0};
function chips(){['frame','drive','wheel','extra'].forEach(function(k){var box=$('#b-'+k);box.innerHTML='';PARTS[k].forEach(function(p,i){var b=document.createElement('button');b.className='chip'+(pick[k]===i?' on':'');b.textContent=p.n;b.onclick=function(){pick[k]=i;chips();drawBuild(0,0);};box.appendChild(b);});});}
function stats(){var f=PARTS.frame[pick.frame],d=PARTS.drive[pick.drive],w=PARTS.wheel[pick.wheel],e=PARTS.extra[pick.extra];
var m=f.m+(d.m||0)+(w.m||0)+(e.m||0),t=d.t+(e.t||0),gr=f.g+w.g,l=e.l||0,sl=w.s||0;
var v=3+t*1.1/(m*.6)+sl*1.2+(w.sp?.8:0)-(gr>3?.8:0);var dist=Math.round(v*(2+l*.45)*6+(f.g===0?20:0));return{v:v,dist:Math.max(20,dist),l:l,m:m,t:t};}
var bc=$('#bcv'),bg=bc.getContext('2d'),running=0,bt=0,last=null,bestB=WL.g('wl_builds',[]);
function drawToy(g,x,y,ang,anim){var f=PARTS.frame[pick.frame],d=PARTS.drive[pick.drive],w=PARTS.wheel[pick.wheel],e=PARTS.extra[pick.extra];g.save();g.translate(x,y);g.rotate(ang);
g.fillStyle=f.c;rr(g,-22,-16,44,18,4);g.fill();g.strokeStyle='#0004';g.stroke();
if(d.n==='Rakete'){g.fillStyle='#e0383e';g.beginPath();g.moveTo(-22,-14);g.lineTo(-38,-7);g.lineTo(-22,-2);g.closePath();g.fill();if(anim){g.fillStyle='#ffb347';g.beginPath();g.moveTo(-38,-7);g.lineTo(-52-Math.random()*10,-7);g.lineTo(-38,-3);g.closePath();g.fill();}}
if(d.n==='Feder'){g.strokeStyle='#ddd';g.lineWidth=2;g.beginPath();for(var i=0;i<6;i++){g.lineTo(-22-i*3,-12+(i%2?6:0));}g.stroke();}
if(d.n==='Gummiband'){g.strokeStyle='#ff6b8a';g.lineWidth=3;g.beginPath();g.moveTo(-22,-12);g.lineTo(-34,-6);g.lineTo(-22,0);g.stroke();}
if(e.n==='Flügel'){g.fillStyle='#fff';g.beginPath();g.moveTo(-6,-16);g.lineTo(6,-34);g.lineTo(14,-16);g.closePath();g.fill();g.strokeStyle='#0003';g.stroke();}
if(e.n==='Fallschirm'){g.fillStyle='#ff4fa8';g.beginPath();g.arc(0,-36,16,Math.PI,0);g.fill();g.strokeStyle='#fff';g.lineWidth=1;g.beginPath();g.moveTo(-16,-36);g.lineTo(-6,-16);g.moveTo(16,-36);g.lineTo(6,-16);g.stroke();}
if(e.n==='Propeller'){g.strokeStyle='#ddd';g.lineWidth=3;g.beginPath();var a=anim?bt*30:0;g.moveTo(0-12*Math.cos(a),-22-12*Math.sin(a)*.4);g.lineTo(0+12*Math.cos(a),-22+12*Math.sin(a)*.4);g.stroke();g.beginPath();g.moveTo(0,-16);g.lineTo(0,-22);g.stroke();}
if(w.n==='Kufen'){g.strokeStyle='#cfd8e8';g.lineWidth=3;g.beginPath();g.moveTo(-26,4);g.lineTo(26,4);g.quadraticCurveTo(32,4,30,-2);g.stroke();}else{var r=w.n==='Grosse Räder'?9:6;g.fillStyle='#222';[-12,12].forEach(function(wx){g.beginPath();g.arc(wx,2,r,0,6.3);g.fill();g.fillStyle='#888';g.beginPath();g.arc(wx,2,r*.4,0,6.3);g.fill();g.fillStyle='#222';});}
g.restore();}
function drawBuild(p,show){bg.clearRect(0,0,360,240);var gr=bg.createLinearGradient(0,0,0,240);gr.addColorStop(0,'#09122c');gr.addColorStop(1,'#1d3f7a');bg.fillStyle=gr;bg.fillRect(0,0,360,240);
bg.fillStyle='#eaf4ff';bg.beginPath();bg.moveTo(0,200);bg.lineTo(360,200);bg.lineTo(360,240);bg.lineTo(0,240);bg.fill();
bg.fillStyle='#d3e3fa';bg.beginPath();bg.moveTo(0,90);bg.lineTo(110,170);bg.lineTo(110,200);bg.lineTo(0,200);bg.closePath();bg.fill();bg.strokeStyle='#fff';bg.lineWidth=3;bg.beginPath();bg.moveTo(0,90);bg.lineTo(110,170);bg.stroke();
var S=stats();
if(!show){drawToy(bg,40,76,.64,0);bg.fillStyle='#fff';bg.font='700 12px system-ui';bg.fillText('Tempo '+S.v.toFixed(1)+' · Auftrieb '+S.l+' · Gewicht '+S.m,10,226);return;}
var x,y,a;if(p<.35){var q=p/.35;x=40+q*70;y=76+q*q*(94-0)*.98+q*(0);y=76+q*94;a=.64;}else{var q2=(p-.35)/.65;var dx=S.dist*1.6*q2;x=110+Math.min(dx,230);var air=Math.min(1,q2*2.5);y=170-Math.sin(Math.min(1,q2*2.2)*Math.PI)*(20+S.l*14)+(air>=1?(q2>0.4?0:0):0);if(y>170)y=170;a=q2<.45?-.2+q2*.5:0;}
drawToy(bg,x,y-(p>.35?0:0),a,1);bg.fillStyle='#fff';bg.font='700 13px system-ui';bg.fillText(Math.round(p>.35?S.dist*Math.min(1,(p-.35)/.65):0)+' m',300,26);}
function runBuild(){if(running)return;running=1;var S=stats(),t0=performance.now();$('#bres').textContent='';(function f(n){var p=Math.min(1,(n-t0)/3200);bt=(n-t0)/1000;drawBuild(p,1);if(p<1)requestAnimationFrame(f);else{running=0;var nm=($('#bname').value||'Mein Flitzer').trim().slice(0,22);var st=Math.max(1,Math.round(S.dist/25));$('#bres').innerHTML='<b>'+nm+'</b> ist <b>'+S.dist+' Meter</b> weit geflogen! ⭐ +'+st;WL.add(st);bestB.push({n:nm,d:S.dist});bestB.sort(function(a,b){return b.d-a.d});bestB=bestB.slice(0,5);WL.s('wl_builds',bestB);showBest();}})(t0);}
function showBest(){$('#bbest').innerHTML=bestB.length?bestB.map(function(b,i){return'<li>'+(i+1)+'. '+b.n.replace(/</g,'&lt;')+' · '+b.d+' m</li>';}).join(''):'<li>Noch nichts gebaut.</li>';}
$('#brun').onclick=runBuild;chips();drawBuild(0,0);showBest();
/* ========== Rentier ========== */
var D=WL.g('wl_deer',null)||{name:'Rudi',spd:3,sta:3,mood:60,wins:0,races:0};
function saveD(){WL.s('wl_deer',D);}
var dc=$('#dcv'),dg=dc.getContext('2d'),racing=0;
function drawDeer(g,x,y,t,col,run,s){s=s||1;g.save();g.translate(x,y);g.scale(s,s);var ph=run?t*14:0;
g.fillStyle=col;[[-16,0],[-8,1],[10,0],[18,1]].forEach(function(l,i){var sw=Math.sin(ph+(i%2?3.14:0))*8;g.strokeStyle=col;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(l[0],10);g.lineTo(l[0]+sw,28);g.stroke();});
g.beginPath();g.ellipse(0,4,26,14,0,0,6.3);g.fill();g.beginPath();g.ellipse(24,-14,11,9,.3,0,6.3);g.fill();g.fillRect(14,-12,8,20);
g.strokeStyle='#e9c9a0';g.lineWidth=3;g.beginPath();g.moveTo(22,-22);g.lineTo(18,-38);g.moveTo(20,-30);g.lineTo(12,-34);g.moveTo(28,-22);g.lineTo(32,-38);g.moveTo(30,-30);g.lineTo(38,-34);g.stroke();
g.fillStyle='#fff';g.beginPath();g.arc(28,-16,2,0,6.3);g.fill();g.fillStyle='#111';g.beginPath();g.arc(28.5,-16,1,0,6.3);g.fill();g.fillStyle='#e0383e';g.beginPath();g.arc(34,-12,3.5,0,6.3);g.fill();
g.fillStyle='#fff';g.beginPath();g.ellipse(-26,0,5,3,0,0,6.3);g.fill();g.restore();}
function deerUI(){$('#dname').value=D.name;$('#dstats').innerHTML='Tempo <b>'+D.spd+'</b> · Ausdauer <b>'+D.sta+'</b> · Laune <b>'+Math.round(D.mood)+'%</b> · Siege <b>'+D.wins+'</b>/'+D.races;$('#dstar').textContent=WL.stars();}
function deerIdle(){if(!dc.isConnected)return;}
(function loop(t){if(!racing){dg.clearRect(0,0,360,240);var gr=dg.createLinearGradient(0,0,0,240);gr.addColorStop(0,'#09122c');gr.addColorStop(1,'#1d3f7a');dg.fillStyle=gr;dg.fillRect(0,0,360,240);dg.fillStyle='#eaf4ff';dg.fillRect(0,190,360,50);
var bob=Math.sin(t/600)*2;drawDeer(dg,180,150+bob,t/1000,'#8a5a36',0,2);dg.fillStyle='#fff';dg.font='800 16px system-ui';dg.textAlign='center';dg.fillText(D.name,180,226);if(D.mood>70){dg.fillText('❤️',230,100+Math.sin(t/300)*4);}}requestAnimationFrame(loop);})(0);
$('#dname').addEventListener('change',function(){D.name=this.value.trim().slice(0,14)||'Rudi';saveD();deerUI();});
$('#dfeed').onclick=function(){if(!WL.spend(2)){WL.toast('Dafür brauchst du 2 ⭐');return;}D.mood=Math.min(100,D.mood+15);D.sta=Math.min(20,D.sta+(Math.random()<.4?1:0));saveD();deerUI();WL.toast(D.name+' mampft Zimtgras 🌿');};
$('#dtrain').onclick=function(){if(!WL.spend(3)){WL.toast('Dafür brauchst du 3 ⭐');return;}D.spd=Math.min(20,D.spd+(Math.random()<.7?1:0));D.mood=Math.max(0,D.mood-6);saveD();deerUI();WL.toast(D.name+' trainiert fleissig 💪');};
function race(bet){if(racing)return;if(bet>0&&WL.stars()<bet){WL.toast('Dafür brauchst du '+bet+' ⭐');return;}if(bet>0)WL.spend(bet);racing=1;
var lvl=Math.floor(D.races/3);var me=D.spd*1.0+D.sta*.6+D.mood/25;var riv=['Blitzen','Donner','Komet'].map(function(n,i){return{n:n,pow:(5+lvl*1.4+i*1.2)+Math.random()*3,col:['#6a4a3a','#7a5a40','#5a4030'][i]};});
var all=[{n:D.name,pow:me+Math.random()*3,col:'#8a5a36',me:1}].concat(riv);all.forEach(function(a){a.sp=.85+a.pow/26;a.x=0;});
var t0=performance.now(),fin=[];
(function f(n){var t=(n-t0)/1000;dg.clearRect(0,0,360,240);dg.fillStyle='#16305f';dg.fillRect(0,0,360,240);dg.fillStyle='#eaf4ff';dg.fillRect(0,40,360,190);
dg.fillStyle='#000';dg.fillRect(320,40,6,190);
all.forEach(function(a,i){var wob=Math.sin(t*2+i*2)*.12;a.x=Math.min(1,a.x+(a.sp*(1+wob))*.0042*Math.min(1,t*2));if(a.x>=1&&fin.indexOf(a)<0)fin.push(a);dg.strokeStyle='#d3e3fa';dg.beginPath();dg.moveTo(0,70+i*45);dg.lineTo(360,70+i*45);dg.stroke();drawDeer(dg,30+a.x*270,52+i*45,t,a.col,1,.8);dg.fillStyle='#fff';dg.font='700 11px system-ui';dg.textAlign='left';dg.fillText(a.n,4,40+i*45);});
if(fin.length<4&&t<12)requestAnimationFrame(f);else{racing=0;all.forEach(function(a){if(fin.indexOf(a)<0)fin.push(a);});var pos=fin.indexOf(all[0])+1;D.races++;var gain=0,msg;if(pos===1){D.wins++;gain=bet*2+6;msg='🏆 '+D.name+' gewinnt!';D.mood=Math.min(100,D.mood+10);}else if(pos===2){gain=bet+2;msg='Platz 2, richtig stark!';}else{gain=pos===3?1:0;msg='Platz '+pos+'. Nächstes Mal klappt es!';D.mood=Math.max(0,D.mood-5);}
if(gain>0)WL.add(gain);saveD();deerUI();$('#dres').textContent=msg+(gain?' ⭐ +'+gain:'');}})(t0);}
$('#drace0').onclick=function(){race(0)};$('#drace5').onclick=function(){race(5)};$('#drace10').onclick=function(){race(10)};
/* ========== Nordlicht-Maler ========== */
(function(){var c=$('#mcv'),g=c.getContext('2d'),col='#6bffb8',mode='line',drawing=0,lp=null,hue=0;
function bgp(){var gr=g.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,'#050a1c');gr.addColorStop(1,'#12295a');g.globalCompositeOperation='source-over';g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);g.fillStyle='#fff';for(var i=0;i<60;i++){g.globalAlpha=.3+.6*Math.random();g.fillRect(Math.random()*c.width,Math.random()*c.height*.8,1.6,1.6);}g.globalAlpha=1;g.fillStyle='#e9f3ff';g.beginPath();g.moveTo(0,c.height);g.lineTo(0,c.height-40);g.quadraticCurveTo(c.width/2,c.height-90,c.width,c.height-40);g.lineTo(c.width,c.height);g.fill();}
bgp();
var cols=['#6bffb8','#ff7ad9','#7fd1ff','#ffd27a','#b69aff','rainbow'];var pal=$('#mpal');cols.forEach(function(k){var b=document.createElement('button');b.className='sw'+(k===col?' on':'');b.setAttribute('aria-label','Farbe '+k);b.style.background=k==='rainbow'?'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)':k;b.onclick=function(){col=k;$$('.sw',pal).forEach(function(x){x.classList.remove('on')});b.classList.add('on');};pal.appendChild(b);});
function colr(){if(col==='rainbow'){hue=(hue+4)%360;return'hsl('+hue+',100%,65%)';}return col;}
function star(x,y,r,cc){g.fillStyle=cc;g.shadowColor=cc;g.shadowBlur=18;g.beginPath();for(var i=0;i<10;i++){var R=i%2?r*.4:r,a=i*Math.PI/5-Math.PI/2;g.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R);}g.closePath();g.fill();}
c.addEventListener('pointerdown',function(e){drawing=1;lp=ptr(c,e);c.setPointerCapture(e.pointerId);if(mode==='star'){g.globalCompositeOperation='lighter';star(lp.x,lp.y,10+Math.random()*10,colr());g.shadowBlur=0;}});
c.addEventListener('pointermove',function(e){if(!drawing||mode==='star'&&false)return;var p=ptr(c,e);g.globalCompositeOperation='lighter';var cc=colr();if(mode==='star'){if(Math.hypot(p.x-lp.x,p.y-lp.y)>26){star(p.x,p.y,8+Math.random()*10,cc);g.shadowBlur=0;lp=p;}return;}
g.strokeStyle=cc;g.lineCap='round';g.lineJoin='round';g.shadowColor=cc;g.shadowBlur=24;g.globalAlpha=.55;g.lineWidth=14;g.beginPath();g.moveTo(lp.x,lp.y);g.lineTo(p.x,p.y);g.stroke();g.globalAlpha=.9;g.lineWidth=4;g.beginPath();g.moveTo(lp.x,lp.y);g.lineTo(p.x,p.y);g.stroke();g.globalAlpha=1;g.shadowBlur=0;lp=p;});
function up(){drawing=0;}c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('pointerleave',up);
$('#mline').onclick=function(){mode='line';$('#mline').classList.add('on');$('#mstar').classList.remove('on');};$('#mstar').onclick=function(){mode='star';$('#mstar').classList.add('on');$('#mline').classList.remove('on');};
$('#mclr').onclick=function(){bgp();};
$('#msave').onclick=function(){c.toBlob(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mein-nordlicht.png';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(a.href);},500);WL.add(2);});};
})();
/* ========== Agent ========== */
var AG=WL.g('wl_agent',{tresor:0,laser:0,code:0});
function saveAG(){WL.s('wl_agent',AG);}
function agStatus(){$$('.amod').forEach(function(b){var k=b.dataset.m;if(AG[k])b.classList.add('done');});$('#aprog').textContent=(AG.tresor+AG.laser+AG.code)+' von 3 Missionen erledigt'+((AG.tresor+AG.laser+AG.code)===3?' · Ausweis freigeschaltet!':'');$('#aausw').disabled=!((AG.tresor+AG.laser+AG.code)===3);}
function amod(m){$$('.apanel').forEach(function(p){p.hidden=p.id!=='a-'+m});$$('.amod').forEach(function(b){b.classList.toggle('on',(b.dataset.m||'ausweis')===m)});if(m!=='laser'&&stops.laser)stops.laser();}
$$('.amod').forEach(function(b){if(b.dataset.m)b.onclick=function(){amod(b.dataset.m);};});
/* Tresor */
var sec=null,tries=0;
function newSec(){sec=[0,0,0].map(function(){return Math.floor(Math.random()*10)});tries=0;$('#tlog').innerHTML='';$('#tmsg').textContent='Knacke den 3-stelligen Code. Du hast 8 Versuche.';$('#tin').value='';}
function tcheck(){var v=($('#tin').value||'').replace(/\D/g,'');if(v.length!==3){$('#tmsg').textContent='Gib genau 3 Ziffern ein.';return;}tries++;var g=v.split('').map(Number),exact=0,s2=sec.slice(),g2=g.slice();for(var i=0;i<3;i++)if(g[i]===sec[i]){exact++;s2[i]=-1;g2[i]=-2;}var part=0;for(var j=0;j<3;j++){var k=s2.indexOf(g2[j]);if(g2[j]>=0&&k>=0){part++;s2[k]=-1;}}
var li=document.createElement('li');li.textContent=v+' → '+exact+' richtig am richtigen Platz, '+part+' richtig am falschen Platz';$('#tlog').appendChild(li);$('#tin').value='';
if(exact===3){$('#tmsg').textContent='🔓 Tresor offen! Code: '+sec.join('')+(AG.tresor?'':' ⭐ +12');if(!AG.tresor){WL.add(12);AG.tresor=1;saveAG();agStatus();}newSec2();}else if(tries>=8){$('#tmsg').textContent='Alarm! Der Code war '+sec.join('')+'. Neuer Versuch!';newSec2();}}
function newSec2(){setTimeout(function(){sec=[0,0,0].map(function(){return Math.floor(Math.random()*10)});tries=0;$('#tlog').innerHTML='';},2500);}
$('#tgo').onclick=tcheck;$('#tin').addEventListener('keydown',function(e){if(e.key==='Enter')tcheck();});newSec();
/* Laser */
var lc=$('#lcv'),lg=lc.getContext('2d'),lraf=0,ln={on:0};
function lstop(){ln.on=0;cancelAnimationFrame(lraf);}stops.laser=lstop;
function lstart(){ln={on:1,x:180,y:390,hold:0,t:0,hits:0,won:0,flash:0};var l=performance.now();cancelAnimationFrame(lraf);$('#lmsg').textContent='Halte den Finger gedrückt, dann läuft der Agent. Weiche den Lasern aus!';lraf=requestAnimationFrame(function f(n){var dt=Math.min(.04,(n-l)/1000);l=n;ln.t+=dt;
if(ln.hold&&!ln.won)ln.y-=75*dt;
var rows=[];for(var i=0;i<5;i++){var y=330-i*62,gx=180+Math.sin(ln.t*(1.1+i*.22)+i*1.7)*120;rows.push({y:y,gx:gx});if(Math.abs(ln.y-y)<7&&Math.abs(ln.x-gx)>38&&!ln.won){ln.hits++;ln.y=390;ln.flash=.5;if(navigator.vibrate)navigator.vibrate(60);}}
ln.flash=Math.max(0,ln.flash-dt);
if(ln.y<22&&!ln.won){ln.won=1;$('#lmsg').textContent='🎉 Geschafft! Der Agent ist durch'+(AG.laser?'':' ⭐ +15');if(!AG.laser){WL.add(15);AG.laser=1;saveAG();agStatus();}}
lg.fillStyle=ln.flash>0?'#4a0f14':'#0a0f22';lg.fillRect(0,0,360,420);lg.fillStyle='#16224a';for(var k=0;k<7;k++)lg.fillRect(0,k*62,360,2);
rows.forEach(function(r){lg.shadowColor='#ff2a3a';lg.shadowBlur=14;lg.strokeStyle='#ff3b4d';lg.lineWidth=5;lg.beginPath();lg.moveTo(0,r.y);lg.lineTo(r.gx-38,r.y);lg.moveTo(r.gx+38,r.y);lg.lineTo(360,r.y);lg.stroke();lg.shadowBlur=0;lg.fillStyle='#fff';lg.fillRect(r.gx-40,r.y-8,3,16);lg.fillRect(r.gx+37,r.y-8,3,16);});
lg.fillStyle='#ffd27a';lg.font='700 12px system-ui';lg.textAlign='center';lg.fillText('ZIEL: Geheimes Weihnachtsarchiv',180,16);lg.fillStyle='#143';lg.fillRect(120,18,120,3);
lg.save();lg.translate(ln.x,ln.y);lg.fillStyle='#111';rr(lg,-9,-4,18,18,5);lg.fill();lg.fillStyle='#f3c9a0';lg.beginPath();lg.arc(0,-9,8,0,6.3);lg.fill();lg.fillStyle='#c8232a';lg.beginPath();lg.moveTo(-8,-12);lg.quadraticCurveTo(0,-30,9,-11);lg.closePath();lg.fill();lg.fillStyle='#000';lg.fillRect(-7,-10,14,4);lg.restore();
if(ln.hits)lg.fillText('Alarm: '+ln.hits,50,410);
if(ln.on)lraf=requestAnimationFrame(f);});}
lc.addEventListener('pointerdown',function(e){if(!ln.on||ln.won){lstart();}ln.hold=1;ln.x=ptr(lc,e).x;});lc.addEventListener('pointermove',function(e){if(ln.on)ln.x=Math.max(14,Math.min(346,ptr(lc,e).x));});lc.addEventListener('pointerup',function(){ln.hold=0;});lc.addEventListener('pointercancel',function(){ln.hold=0;});
lg.fillStyle='#0a0f22';lg.fillRect(0,0,360,420);lg.fillStyle='#fff';lg.font='700 16px system-ui';lg.textAlign='center';lg.fillText('Tippe, um zu starten',180,210);
/* Geheimschrift */
var WORDS=['WICHTEL','SCHNEE','NORDPOL','LASSE','GEHEIM','MILCHREIS','ZIMTSTERN','SCHLITTEN'],cw=null,cr=0,cshift=0;
function caesar(w,s){return w.split('').map(function(ch){return String.fromCharCode((ch.charCodeAt(0)-65+s+26)%26+65);}).join('');}
function newCode(){cw=WORDS[Math.floor(Math.random()*WORDS.length)];cshift=1+Math.floor(Math.random()*24);$('#cenc').textContent=caesar(cw,cshift);$('#csl').value=0;cupd();$('#cmsg').textContent='Runde '+(cr+1)+' von 3: Drehe das Rad, bis ein Wort lesbar ist.';}
function cupd(){var s=+$('#csl').value;$('#cshift').textContent=s;$('#cdec').textContent=caesar($('#cenc').textContent,-s);}
$('#csl').addEventListener('input',cupd);
$('#cok').onclick=function(){if(+$('#csl').value===(26-cshift)%26){cr++;if(cr>=3){$('#cmsg').textContent='🕵️ Alle drei Codes geknackt!'+(AG.code?'':' ⭐ +12');if(!AG.code){WL.add(12);AG.code=1;saveAG();agStatus();}cr=0;setTimeout(newCode,2500);}else{$('#cmsg').textContent='Richtig: '+cw+'! Weiter.';setTimeout(newCode,1400);}}else{$('#cmsg').textContent='Das ergibt noch kein lesbares Wort. Dreh weiter!';}};
newCode();
/* Ausweis */
var NN=['Zimtnase','Schneefuchs','Sternenstaub','Glitzermütze','Milchreisjäger','Nordlicht','Tannenzapfen','Eisblitz','Lebkuchen','Pfefferminz'],AD=['der Mutige','der Schnelle','der Schlaue','der Unsichtbare','die Legende','der Furchtlose'];
function ausweis(){var nm=($('#aname').value||'Agent').trim().slice(0,16);var h=hash(nm.toLowerCase());var wn=nm+' '+NN[h%NN.length]+' '+AD[(h>>4)%AD.length];var c=$('#acv'),g=c.getContext('2d');
var gr=g.createLinearGradient(0,0,520,320);gr.addColorStop(0,'#0b1a45');gr.addColorStop(1,'#16305f');g.fillStyle=gr;rr(g,0,0,520,320,22);g.fill();g.strokeStyle='#ffd27a';g.lineWidth=5;rr(g,8,8,504,304,18);g.stroke();
g.fillStyle='#ffd27a';g.font='800 14px system-ui';g.textAlign='left';g.fillText('GEHEIMAGENT · WICHTELDORF · NORDPOL',28,40);
g.fillStyle='#f3c9a0';g.beginPath();g.arc(100,140,44,0,6.3);g.fill();g.fillStyle='#c8232a';g.beginPath();g.moveTo(58,126);g.quadraticCurveTo(100,40,148,122);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(58,120,92,12);g.beginPath();g.arc(150,78,11,0,6.3);g.fill();g.fillStyle='#111';g.fillRect(70,134,60,12);g.fillStyle='#ffd27a';g.fillRect(78,138,16,4);g.fillRect(106,138,16,4);
g.fillStyle='#fff';g.font='700 26px system-ui';g.fillText(nm,180,100);g.font='600 16px system-ui';g.fillStyle='#bfe3ff';g.fillText('Wichtelname:',180,130);g.fillStyle='#fff';g.font='700 18px system-ui';g.fillText(wn,180,154);
var nr=1000+h%9000,sw=WL.g('wl_deer',{wins:0}).wins;g.fillStyle='#bfe3ff';g.font='600 15px system-ui';g.fillText('Agenten-Nr. '+nr,180,190);g.fillText('Codewort: '+NN[(h>>8)%NN.length].toUpperCase()+'-'+(h%97),180,212);g.fillText('Rang: '+(WL.stars()>150?'Obergeheimagent':WL.stars()>60?'Spezialagent':'Nachwuchsagent'),180,234);
g.fillStyle='#ffffff18';rr(g,28,260,464,38,10);g.fill();g.fillStyle='#ffd27a';g.font='700 14px system-ui';g.fillText('Alle Missionen bestanden: Tresor · Laser · Geheimschrift',44,284);
$('#adl').hidden=false;}
$('#aausw').onclick=function(){amod('ausweis');};$('#amake').onclick=ausweis;
$('#adl').onclick=function(){$('#acv').toBlob(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='agentenausweis.png';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(a.href);},500);});};
agStatus();amod('tresor');
/* ========== Schneekugel ========== */
var kugel=(function(){var c=$('#kcv'),g=c.getContext('2d'),F=[],raf=0,on=0,lx=0,ly=0,dr=0;for(var i=0;i<170;i++)F.push({x:60+Math.random()*240,y:60+Math.random()*260,vx:0,vy:0,r:1+Math.random()*2.2,s:0});
function shake(p){p=p||1;F.forEach(function(f){f.vx+=(Math.random()-.5)*260*p;f.vy-=(80+Math.random()*260)*p;f.s=0;});}
function ground(x){return 340-Math.sqrt(Math.max(0,1-Math.pow((x-180)/150,2)))*0+0;}
function house(x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y-h,w,h);g.fillStyle='#fff';g.beginPath();g.moveTo(x-4,y-h);g.lineTo(x+w/2,y-h-w*.5);g.lineTo(x+w+4,y-h);g.closePath();g.fill();g.fillStyle='#ffd27a';g.fillRect(x+w*.2,y-h*.7,w*.22,w*.22);g.fillRect(x+w*.6,y-h*.7,w*.22,w*.22);g.fillStyle='#4a2f1a';g.fillRect(x+w*.4,y-h*.4,w*.2,h*.4);}
function frame(now,dt){g.clearRect(0,0,360,420);
g.save();g.beginPath();g.arc(180,190,150,0,6.3);g.clip();var sk=g.createLinearGradient(0,40,0,340);sk.addColorStop(0,'#0b1a45');sk.addColorStop(1,'#2a5199');g.fillStyle=sk;g.fillRect(0,0,360,420);
g.fillStyle='#fff';for(var s=0;s<30;s++){g.globalAlpha=.3+.6*Math.abs(Math.sin(now/700+s));g.fillRect(50+(s*53)%260,50+(s*31)%110,1.6,1.6);}g.globalAlpha=1;
g.fillStyle='#e9f3ff';g.beginPath();g.ellipse(180,330,170,48,0,0,6.3);g.fill();
house(110,310,54,38,'#c8232a');house(200,306,46,32,'#3f7fd4');house(255,318,36,26,'#2f9e6b');
g.fillStyle='#1f6b46';[[90,320],[290,322]].forEach(function(t){g.beginPath();g.moveTo(t[0],t[1]-44);g.lineTo(t[0]-16,t[1]);g.lineTo(t[0]+16,t[1]);g.closePath();g.fill();});
g.fillStyle='#fff';g.beginPath();g.arc(170,332,10,0,6.3);g.arc(170,319,7,0,6.3);g.fill();
g.fillStyle='#fff';F.forEach(function(f){if(!f.s){f.vy+=70*dt;f.vx*=.985;f.vy*=.985;f.x+=f.vx*dt+Math.sin(now/500+f.r*9)*.3;f.y+=f.vy*dt;var gy=330+Math.sqrt(Math.max(0,1-Math.pow((f.x-180)/170,2)))*(-16);if(f.y>gy){f.y=gy-Math.random()*6;f.s=1;f.vx=f.vy=0;}if(Math.hypot(f.x-180,f.y-190)>146){var a=Math.atan2(f.y-190,f.x-180);f.x=180+Math.cos(a)*145;f.y=190+Math.sin(a)*145;f.vx*=-.3;f.vy*=-.3;}}g.beginPath();g.arc(f.x,f.y,f.r,0,6.3);g.fill();});
g.restore();
g.strokeStyle='#ffffff55';g.lineWidth=4;g.beginPath();g.arc(180,190,150,0,6.3);g.stroke();g.fillStyle='#ffffff22';g.beginPath();g.ellipse(120,100,16,40,-.6,0,6.3);g.fill();
g.fillStyle='#6b3b1e';rr(g,70,334,220,56,10);g.fill();g.fillStyle='#ffd27a';g.font='800 15px system-ui';g.textAlign='center';g.fillText('Wichteldorf · Nordpol',180,368);}
function start(){if(on)return;on=1;var l=performance.now();(function f(n){if(!on)return;var dt=Math.min(.04,(n-l)/1000);l=n;frame(n,dt);raf=requestAnimationFrame(f);})(l);}
function stop(){on=0;cancelAnimationFrame(raf);}stops.kugel=stop;
c.addEventListener('pointerdown',function(e){dr=1;lx=e.clientX;ly=e.clientY;});c.addEventListener('pointermove',function(e){if(!dr)return;var v=Math.hypot(e.clientX-lx,e.clientY-ly);lx=e.clientX;ly=e.clientY;if(v>14)shake(Math.min(1,v/60)*.5);});c.addEventListener('pointerup',function(){dr=0;});
$('#kshake').onclick=function(){if(window.DeviceMotionEvent&&DeviceMotionEvent.requestPermission){DeviceMotionEvent.requestPermission().catch(function(){});}shake(1);};
var lastS=0;addEventListener('devicemotion',function(e){var a=e.accelerationIncludingGravity;if(!a)return;var m=Math.abs(a.x||0)+Math.abs(a.y||0)+Math.abs(a.z||0);var t=Date.now();if(m>32&&t-lastS>600&&on){lastS=t;shake(1);}});
for(var q=0;q<1;q++)frame(0,.016);
return{start:start};})();
var hh=(location.hash||'').slice(1);if(['garage','bauen','rentier','maler','agent','kugel'].indexOf(hh)>=0)show(hh);else show('garage');
})();
