(function(){
"use strict";
var $=function(s){return document.querySelector(s)},$$=function(s){return[].slice.call(document.querySelectorAll(s))};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function store(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r===null?null:+r;}localStorage.setItem(k,v);}catch(e){return null;}}
/* Tabs */
function show(p){$$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.p===p)});$$('.pane').forEach(function(x){x.hidden=x.id!=='p-'+p});if(p!=='sled')sled.stop();if(p!=='flake')flake.stop();if(p!=='snow')snow.stop();try{history.replaceState(null,'','#'+p)}catch(e){}}
$$('.tabs button').forEach(function(b){b.onclick=function(){show(b.dataset.p)}});
function dpr(c){var d=Math.min(devicePixelRatio||1,2);c.width=360*d;c.height=560*d;var x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return x;}
function ptr(c,e){var r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*360/r.width,y:(e.clientY-r.top)*560/r.height};}
function bg(g,t,top,bot){var gr=g.createLinearGradient(0,0,0,560);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,360,560);}
function bgstars(g,t,seed){g.fillStyle='#fff';for(var i=0;i<40;i++){var x=(i*97+seed)%360,y=(i*53)%300,a=.4+.6*Math.abs(Math.sin(t/900+i));g.globalAlpha=a*.8;g.fillRect(x,y,1.6,1.6);}g.globalAlpha=1;}
function end(ov,title,big,txt,btn,best){ov.innerHTML='<h3>'+title+'</h3><div class="big">'+big+'</div><p>'+txt+'</p>'+(best?'<small>'+best+'</small>':'')+'<button class="btn">'+btn+'</button>';ov.classList.remove('hide');}
/* ========== Schlitten ========== */
var sled=(function(){
var c=$('#sled'),g=dpr(c),ov=$('#s-ov'),run=false,raf=0,o={};
var sk=WL.skin();var best=store('wl_sled')||0;$('#s-bs').textContent=best;
var keys={};
function reset(){o={x:180,tx:180,sc:0,li:3,sp:150,t:0,it:[],ob:[],pa:[],inv:0,spn:0,dist:0,tilt:0};}
function lives(){var s='';for(var i=0;i<3;i++)s+=i<o.li?'❤️':'🖤';$('#s-li').textContent=s;}
function start(){sk=WL.skin();reset();run=true;ov.classList.add('hide');$('#s-sc').textContent=0;lives();var l=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(function f(n){var dt=Math.min(.04,(n-l)/1000);l=n;upd(dt,n);draw(n);if(run)raf=requestAnimationFrame(f);});}
function stop(){run=false;cancelAnimationFrame(raf);}
function over(){run=false;var nb=o.sc>best;if(nb){best=o.sc;store('wl_sled',best);$('#s-bs').textContent=best;}
WL.add(o.sc);end(ov,'Geschafft!',o.sc,nb?'Neuer Rekord, der Schlitten ist heiss gelaufen!':'Das waren '+Math.round(o.dist/10)+' Meter durch die Nacht.','Nochmal',nb?null:'Rekord: '+best);ov.querySelector('.btn').onclick=start;board();}
function burst(x,y,col,n){for(var i=0;i<n;i++){var a=Math.random()*6.28,s=40+Math.random()*120;o.pa.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0,m:.5+Math.random()*.4,c:col});}}
function upd(dt,now){o.t+=dt;o.sp=150+Math.min(230,o.t*5);o.dist+=o.sp*dt;
var ax=(keys.l?-1:0)+(keys.r?1:0);if(ax)o.tx=Math.max(30,Math.min(330,o.tx+ax*320*dt));
var old=o.x;o.x+=(o.tx-o.x)*Math.min(1,dt*9);o.tilt=(o.x-old)*2.2;
o.spn-=dt;if(o.spn<=0){o.spn=Math.max(.32,.8-o.t*.008);var r=Math.random(),x=30+Math.random()*300;
if(r<.5)o.ob.push({k:Math.random()<.65?'tree':'cloud',x:x,y:-60,w:30});else o.it.push({k:r<.85?'star':'gift',x:x,y:-30});}
if(o.inv>0)o.inv-=dt;
o.ob.forEach(function(b){b.y+=o.sp*dt;if(o.inv<=0&&Math.abs(b.x-o.x)<b.w*.7&&Math.abs(b.y-480)<34){o.li--;o.inv=1.4;burst(o.x,480,'#9fd4ff',18);lives();if(navigator.vibrate)navigator.vibrate(60);if(o.li<=0)over();}});
o.it.forEach(function(b){b.y+=o.sp*dt;if(!b.d&&Math.abs(b.x-o.x)<26&&Math.abs(b.y-480)<30){b.d=1;var p=b.k==='gift'?5:1;o.sc+=p;$('#s-sc').textContent=o.sc;burst(b.x,b.y,b.k==='gift'?'#ff6b72':'#ffd27a',14);}});
o.ob=o.ob.filter(function(b){return b.y<640});o.it=o.it.filter(function(b){return b.y<620&&!b.d});
if(!reduce)o.pa.push({x:o.x-8+Math.random()*16,y:506,vx:(Math.random()-.5)*20,vy:60+Math.random()*30,l:0,m:.4,c:WL.trail(sk,o.t)});
o.pa.forEach(function(p){p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;});o.pa=o.pa.filter(function(p){return p.l<p.m});}
function tree(x,y){g.fillStyle='#5a3b22';g.fillRect(x-4,y+22,8,12);var cols=['#1f6b46','#2a8a5a','#35a46c'];for(var i=0;i<3;i++){g.fillStyle=cols[i];g.beginPath();g.moveTo(x,y-26+i*14);g.lineTo(x-24+i*3,y+6+i*10);g.lineTo(x+24-i*3,y+6+i*10);g.closePath();g.fill();g.fillStyle='#fff';g.globalAlpha=.85;g.beginPath();g.moveTo(x,y-26+i*14);g.lineTo(x-10,y-12+i*14);g.lineTo(x+10,y-12+i*14);g.closePath();g.fill();g.globalAlpha=1;}}
function cloud(x,y){g.fillStyle='#cfd9ee';[[0,0,20],[-18,6,14],[18,6,15],[6,-9,14]].forEach(function(a){g.beginPath();g.arc(x+a[0],y+a[1],a[2],0,6.3);g.fill();});g.fillStyle='#8da0c4';g.fillRect(x-24,y+14,48,3);}
function star5(x,y,r,rot,col){g.fillStyle=col;g.shadowColor=col;g.shadowBlur=14;g.beginPath();for(var i=0;i<10;i++){var R=i%2?r*.45:r,a=rot+i*Math.PI/5-Math.PI/2;g.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R);}g.closePath();g.fill();g.shadowBlur=0;}
function gift(x,y){g.fillStyle='#e0383e';g.fillRect(x-14,y-12,28,26);g.fillStyle='#ffd27a';g.fillRect(x-3,y-12,6,26);g.fillRect(x-14,y-1,28,5);g.beginPath();g.arc(x-5,y-16,5,0,6.3);g.arc(x+5,y-16,5,0,6.3);g.fill();}
function sledDraw(x,y,tilt,now){WL.drawSled(g,x,y,tilt,sk,now);}
function draw(now){bg(g,now,'#09122c','#1b3a72');bgstars(g,now,7);
g.fillStyle='#e9f3ff';var off=(o.dist*.6)%80;for(var i=-1;i<8;i++){g.globalAlpha=.07;g.fillRect(0,i*80+off,360,2);}g.globalAlpha=1;
g.fillStyle='#d6e8ff';g.fillRect(0,0,14,560);g.fillRect(346,0,14,560);g.fillStyle='#fff';var so=(o.dist*.9)%60;for(var j=-1;j<10;j++){g.beginPath();g.arc(7,j*60+so,6,0,6.3);g.arc(353,j*60+so+30,6,0,6.3);g.fill();}
o.it.forEach(function(b){if(b.k==='star')star5(b.x,b.y,13,now/700,'#ffd27a');else gift(b.x,b.y);});
o.ob.forEach(function(b){if(b.k==='tree')tree(b.x,b.y);else cloud(b.x,b.y);});
o.pa.forEach(function(p){g.globalAlpha=1-p.l/p.m;g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,2.4,0,6.3);g.fill();});g.globalAlpha=1;
if(o.inv<=0||Math.floor(now/90)%2)sledDraw(o.x,480,o.tilt,now);}
function pm(e){if(!run)return;o.tx=Math.max(30,Math.min(330,ptr(c,e).x));}
c.addEventListener('pointerdown',function(e){pm(e);c.setPointerCapture&&c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse'||e.buttons||true)pm(e);});
addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){keys.l=1;if(run)e.preventDefault();}if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){keys.r=1;if(run)e.preventDefault();}});
addEventListener('keyup',function(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')keys.l=0;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')keys.r=0;});
$('#s-go').onclick=start;reset();draw(0);
return{stop:stop};})();
/* ========== Schneeflocken ========== */
var flake=(function(){
var c=$('#fl'),g=dpr(c),ov=$('#f-ov'),run=false,raf=0,tid=0,it=[],fx=[],sc=0,tl=30,spn=0,combo=0,best=store('wl_flake')||0;$('#f-bs').textContent=best;
function start(){it=[];fx=[];sc=0;tl=30;spn=0;combo=0;run=true;ov.classList.add('hide');$('#f-sc').textContent=0;$('#f-tl').textContent=30;clearInterval(tid);tid=setInterval(function(){tl--;$('#f-tl').textContent=tl;if(tl<=0)over();},1000);var l=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(function f(n){var dt=Math.min(.04,(n-l)/1000);l=n;upd(dt);draw(n);if(run)raf=requestAnimationFrame(f);});}
function stop(){run=false;clearInterval(tid);cancelAnimationFrame(raf);}
function over(){stop();var nb=sc>best;if(nb){best=sc;store('wl_flake',best);$('#f-bs').textContent=best;}WL.add(sc/3);end(ov,'Zeit um!',sc,nb?'Neuer Rekord, du bist ein Flockenmeister!':'Punkte. Noch eine Runde?','Nochmal',nb?null:'Rekord: '+best);ov.querySelector('.btn').onclick=start;board();}
function upd(dt){spn-=dt;if(spn<=0){spn=Math.max(.22,.5-(30-tl)*.01);var r=Math.random();it.push({x:24+Math.random()*312,y:-20,v:80+Math.random()*80+(30-tl)*4,k:r<.1?'star':r<.24?'ice':'flake',r:r<.1?17:15,a:Math.random()*6});}
it.forEach(function(i){i.y+=i.v*dt;i.a+=dt;});it=it.filter(function(i){if(i.y>600){if(i.k==='flake')combo=0;return false;}return true;});
fx.forEach(function(f){f.l+=dt;f.y-=30*dt;});fx=fx.filter(function(f){return f.l<.7});}
function draw(now){bg(g,now,'#0b1633','#1d3f7a');bgstars(g,now,31);
it.forEach(function(i){g.save();g.translate(i.x,i.y);g.rotate(i.a*.6);
if(i.k==='flake'){g.strokeStyle='#fff';g.lineWidth=2.4;g.lineCap='round';g.shadowColor='#bfe3ff';g.shadowBlur=8;for(var a=0;a<3;a++){g.rotate(Math.PI/3);g.beginPath();g.moveTo(-i.r,0);g.lineTo(i.r,0);g.moveTo(-i.r*.5,-4);g.lineTo(-i.r*.3,0);g.lineTo(-i.r*.5,4);g.stroke();}}
else if(i.k==='star'){g.rotate(-i.a*.6);g.fillStyle='#ffd27a';g.shadowColor='#ffd27a';g.shadowBlur=18;g.beginPath();for(var a2=0;a2<10;a2++){var R=a2%2?7:i.r;g.lineTo(Math.cos(a2*Math.PI/5-Math.PI/2)*R,Math.sin(a2*Math.PI/5-Math.PI/2)*R);}g.closePath();g.fill();}
else{g.fillStyle='#35466a';g.beginPath();g.arc(0,0,i.r,0,6.3);g.fill();g.fillStyle='#6f87b6';g.beginPath();g.arc(-5,-5,4.5,0,6.3);g.fill();g.strokeStyle='#9fb5da';g.lineWidth=1.5;g.beginPath();g.arc(0,0,i.r,0,6.3);g.stroke();}
g.restore();});
g.font='800 18px system-ui';g.textAlign='center';fx.forEach(function(f){g.globalAlpha=1-f.l/.7;g.fillStyle=f.c;g.fillText(f.t,f.x,f.y);});g.globalAlpha=1;
if(combo>=3){g.fillStyle='#ffd27a';g.font='800 16px system-ui';g.fillText('Combo x'+Math.min(4,1+Math.floor(combo/3)),180,540);}}
c.addEventListener('pointerdown',function(e){if(!run)return;var p=ptr(c,e);for(var k=it.length-1;k>=0;k--){var i=it[k];if(Math.hypot(i.x-p.x,i.y-p.y)<i.r+16){var m=Math.min(4,1+Math.floor(combo/3)),pt;if(i.k==='flake'){combo++;pt=m;}else if(i.k==='star'){pt=5;}else{combo=0;pt=-3;}sc=Math.max(0,sc+pt);$('#f-sc').textContent=sc;fx.push({x:i.x,y:i.y,l:0,t:(pt>0?'+':'')+pt,c:pt>0?'#9dffd6':'#ff8a8f'});if(pt<0&&navigator.vibrate)navigator.vibrate(40);it.splice(k,1);break;}}});
$('#f-go').onclick=start;draw(0);
return{stop:stop};})();
/* ========== Schneemann ========== */
var snow=(function(){
var c=$('#sm'),g=dpr(c),ov=$('#m-ov'),run=false,raf=0,t0=0,step=0,fx=[],best=store('wl_snow'),wrong=0,pieces,done=[];
if(best)$('#m-bs').textContent=(best/10).toFixed(1)+'s';
var NAMES=['Körper','Kopf','Hut','Nase','Schal'];
function layout(){var arr=[0,1,2,3,4].map(function(i){return{i:i,x:0,y:0};});
for(var k=arr.length-1;k>0;k--){var j=Math.floor(Math.random()*(k+1));var t=arr[k];arr[k]=arr[j];arr[j]=t;}
arr.forEach(function(a,n){a.x=50+(n%3)*130/1+Math.random()*10;a.y=360+Math.floor(n/3)*90+Math.random()*10;});pieces=arr;}
function start(){layout();step=0;wrong=0;fx=[];run=true;ov.classList.add('hide');t0=performance.now();$('#m-sc').textContent=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(function f(n){draw(n);if(run)raf=requestAnimationFrame(f);});}
function stop(){run=false;cancelAnimationFrame(raf);}
function over(){run=false;var t=Math.round(((performance.now()-t0)/100)+wrong*20);var nb=!best||t<best;if(nb){best=t;store('wl_snow',t);$('#m-bs').textContent=(t/10).toFixed(1)+'s';}WL.add(6);end(ov,'Der Schneemann steht!',(t/10).toFixed(1)+'s',(wrong?wrong+' Fehlgriff'+(wrong>1?'e':'')+' (+2s je Fehler). ':'Ohne Fehler! ')+(nb?'Neue Bestzeit!':''),'Nochmal',nb?null:'Bestzeit: '+(best/10).toFixed(1)+'s');ov.querySelector('.btn').onclick=function(){done=[];start();};board();}
function piece(i,x,y,s){g.save();g.translate(x,y);g.scale(s,s);
if(i===0){g.fillStyle='#fff';g.shadowColor='#9fd4ff';g.shadowBlur=10;g.beginPath();g.arc(0,0,40,0,6.3);g.fill();g.shadowBlur=0;g.fillStyle='#2c3a5a';[-16,0,16].forEach(function(b){g.beginPath();g.arc(0,b,3.2,0,6.3);g.fill();});}
if(i===1){g.fillStyle='#fff';g.beginPath();g.arc(0,0,28,0,6.3);g.fill();g.fillStyle='#222';g.beginPath();g.arc(-10,-6,3,0,6.3);g.arc(10,-6,3,0,6.3);g.fill();g.beginPath();for(var a=0;a<5;a++){g.arc(-12+a*6,10+Math.sin(a/4*3.14)*4,1.6,0,6.3);g.moveTo(-12+a*6+1.6,10);}g.fill();}
if(i===2){g.fillStyle='#222';g.fillRect(-26,6,52,8);g.fillRect(-16,-22,32,30);g.fillStyle='#c8232a';g.fillRect(-16,-4,32,7);}
if(i===3){g.fillStyle='#ff8a2b';g.beginPath();g.moveTo(-6,-4);g.lineTo(26,0);g.lineTo(-6,4);g.closePath();g.fill();}
if(i===4){g.fillStyle='#e0383e';g.fillRect(-26,-6,52,12);g.fillStyle='#ffd27a';[-16,0,16].forEach(function(b){g.fillRect(b-2,-6,4,12);});g.fillStyle='#e0383e';g.fillRect(8,6,10,22);}
g.restore();}
function draw(now){bg(g,now,'#0b1633','#244a86');bgstars(g,now,12);g.fillStyle='#eaf4ff';g.beginPath();g.moveTo(0,330);g.quadraticCurveTo(180,290,360,330);g.lineTo(360,560);g.lineTo(0,560);g.closePath();g.fill();
$('#m-tl').textContent=((now-t0)/1000+wrong*2).toFixed(1);
var ph=['#e8f2ff'];g.globalAlpha=.25;g.fillStyle='#000';g.beginPath();g.ellipse(180,300,50,8,0,0,6.3);g.fill();g.globalAlpha=1;
var pos=[[180,260],[180,205],[180,170],[184,205],[180,232]];
for(var k=0;k<step;k++){var o=[0,1,4,3,2];}
var drawOrder=[0,1,4,3,2];drawOrder.forEach(function(i){if(done[i])piece(i,pos[i][0],pos[i][1]+(i===2?-14:0),1);});
g.fillStyle='rgba(255,255,255,.6)';g.font='700 15px system-ui';g.textAlign='center';
if(run&&step<5)g.fillText('Als Nächstes: '+NAMES[step],180,40);
pieces.forEach(function(p){if(!done[p.i])piece(p.i,p.x,p.y,.7+.04*Math.sin(now/300+p.i));});
fx.forEach(function(f){f.l+=.016;g.globalAlpha=Math.max(0,1-f.l);g.fillStyle=f.c;g.fillText(f.t,f.x,f.y-f.l*30);});g.globalAlpha=1;}
c.addEventListener('pointerdown',function(e){if(!run)return;var p=ptr(c,e);for(var k=0;k<pieces.length;k++){var q=pieces[k];if(done[q.i])continue;if(Math.hypot(q.x-p.x,q.y-p.y)<42){if(q.i===step){done[q.i]=1;step++;fx.push({x:q.x,y:q.y,l:0,t:'✓',c:'#9dffd6'});$('#m-sc').textContent=step;if(step===5){draw(performance.now());over();}}else{wrong++;fx.push({x:q.x,y:q.y,l:0,t:'+2s',c:'#ff8a8f'});if(navigator.vibrate)navigator.vibrate(40);}return;}}});
$('#m-go').onclick=function(){done=[];start();};done=[];layout();draw(0);
$('#m-go').addEventListener('click',function(){done=[];},true);
return{stop:stop};})();
/* ========== Memory ========== */
(function(){
var emo=['🎅','🧦','🍚','🦊','🐿️','🐧','🎁','⭐'],first=null,lock=false,moves=0,pairs=0,t0=0,tid=0,best=store('wl_mem');
if(best)$('#mb').textContent=best+' Z.';
function mem(){var d=emo.concat(emo).sort(function(){return Math.random()-.5});moves=0;pairs=0;first=null;lock=false;t0=0;clearInterval(tid);$('#mv').textContent=0;$('#pr').textContent=0;$('#mt').textContent=0;$('#mmsg').textContent='';
$('#mem').innerHTML=d.map(function(e,i){return'<button class="mcard" data-e="'+e+'" aria-label="Karte '+(i+1)+'"><span class="in"><span class="a">❄</span><span class="b">'+e+'</span></span></button>';}).join('');}
$('#mem').addEventListener('click',function(ev){var c=ev.target.closest('.mcard');if(!c||lock||c.classList.contains('up')||c.classList.contains('ok'))return;
if(!t0){t0=Date.now();tid=setInterval(function(){$('#mt').textContent=Math.round((Date.now()-t0)/1000)},500);}
c.classList.add('up');if(!first){first=c;return;}
moves++;$('#mv').textContent=moves;lock=true;
if(first.dataset.e===c.dataset.e){first.classList.replace('up','ok');c.classList.replace('up','ok');pairs++;$('#pr').textContent=pairs;first=null;lock=false;
if(pairs===8){clearInterval(tid);var s=Math.round((Date.now()-t0)/1000);var nb=!best||moves<best;if(nb){best=moves;store('wl_mem',moves);$('#mb').textContent=moves+' Z.';}WL.add(moves<=14?10:5);$('#mmsg').textContent=(moves<=12?'Wichtel-Meisterklasse! ':'Geschafft! ')+moves+' Züge in '+s+' Sekunden.'+(nb?' Neuer Rekord!':'');board();}}
else{var a=first;first=null;setTimeout(function(){a.classList.remove('up');c.classList.remove('up');lock=false;},750);}});
$('#mnew').onclick=mem;mem();})();
/* ========== Rekordtafel ========== */
function rank(v,steps,labels,inv){var i=0;for(var k=0;k<steps.length;k++){if(inv?v<=steps[k]:v>=steps[k])i=k+1;}return labels[Math.min(i,labels.length-1)];}
function board(){var a=store('wl_sled')||0,b=store('wl_flake')||0,s=store('wl_snow'),m=store('wl_mem');
var rows=[['🛷 Schlitten fliegen',a?a+' Punkte':'noch nicht gespielt',a?rank(a,[10,25,50,90],['Wichtel-Lehrling','Rentier-Reiter','Schlitten-Pilot','Nordpol-Pilot','Weihnachts-Legende']):'–'],
['❄️ Schneeflocken fangen',b?b+' Punkte':'noch nicht gespielt',b?rank(b,[15,30,50,75],['Flocken-Fan','Flocken-Fänger','Flocken-Profi','Flocken-Meister','Schneekönig']):'–'],
['⛄ Schneemann bauen',s?(s/10).toFixed(1)+' s':'noch nicht gespielt',s?rank(s,[200,120,80,55],['Schneemann-Neuling','Schneemann-Bauer','Frosty-Fan','Eis-Architekt','Schnee-Künstler'],true):'–'],
['🎅 Wichtel-Memory',m?m+' Züge':'noch nicht gespielt',m?rank(m,[22,18,14,11],['Memory-Anfänger','Gute Augen','Scharfer Blick','Gedächtnis-Wichtel','Memory-Meister'],true):'–']];
$('#board').innerHTML=rows.map(function(r){return'<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 2px;border-bottom:1px solid var(--line)"><b>'+r[0]+'</b><span style="opacity:.85">'+r[1]+'</span><span style="color:var(--gold);font-weight:800">'+r[2]+'</span></div>';}).join('')+'<p style="margin-top:12px;opacity:.7;font-size:.9rem">Die Rekorde bleiben auf diesem Gerät gespeichert.</p>';}
board();
var h=(location.hash||'').slice(1);if(['sled','flake','snow','mem'].indexOf(h)>=0)show(h);
})();

/* Tab- und Start-Verhalten: Spiel immer komplett im Bild */
(function(){var tabs=document.querySelector('.tabs');if(!tabs)return;
function top(){try{tabs.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){tabs.scrollIntoView();}}
tabs.addEventListener('click',function(e){if(e.target.closest('button'))setTimeout(top,60);});
document.addEventListener('click',function(e){var b=e.target.closest('.ov .btn');if(b)setTimeout(top,60);});
})();
