(function(){
"use strict";
var $=function(s){return document.querySelector(s)},$$=function(s){return[].slice.call(document.querySelectorAll(s))};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function store(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r===null?null:r;}localStorage.setItem(k,v);}catch(e){return null;}}
var inited={};
function show(p){$$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.p===p)});$$('.pane').forEach(function(x){x.hidden=x.id!=='p-'+p});
if(p!=='race')race.stop();village.pause(p!=='dorf');if(p==='dorf'&&!inited.d){inited.d=1;village.init();}
try{history.replaceState(null,'','#'+p)}catch(e){}}
$$('.tabs button').forEach(function(b){b.onclick=function(){show(b.dataset.p)}});
/* ===== 3D Dorf ===== */
var village=(function(){
var running=false,paused=false,api={};
api.pause=function(v){paused=v;};
api.init=function(){
if(!window.THREE){$('#no3').hidden=false;return;}
var T=THREE,c=$('#v3'),ren;
try{ren=new T.WebGLRenderer({canvas:c,antialias:true});}catch(e){$('#no3').hidden=false;return;}
ren.setPixelRatio(Math.min(devicePixelRatio||1,2));
var scene=new T.Scene(),cam=new T.PerspectiveCamera(50,1.6,.1,300);
var night=true;
function rs(){var w=c.clientWidth,h=c.clientHeight;ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
rs();addEventListener('resize',rs);
var amb=new T.AmbientLight(0x6f86c8,.55),sun=new T.DirectionalLight(0xbfd4ff,.7);sun.position.set(20,30,10);scene.add(amb,sun);
var moon=new T.Mesh(new T.SphereGeometry(3,24,24),new T.MeshBasicMaterial({color:0xfdf6d8}));moon.position.set(-60,45,-80);scene.add(moon);
var ground=new T.Mesh(new T.CylinderGeometry(42,46,2,48),new T.MeshStandardMaterial({color:0xf2f7ff,roughness:.95}));ground.position.y=-1;scene.add(ground);
var hills=new T.Mesh(new T.CylinderGeometry(120,120,.5,48),new T.MeshStandardMaterial({color:0xdde8f8}));hills.position.y=-2.2;scene.add(hills);
var houses=[],lights=[],smokes=[];
var defs=[['Wichtelhaus von Lasse',0,-6,0xc8232a,1.25],['Die Guetzli-Bäckerei',-14,-2,0xd98a3d,1],['Süssigkeitenladen',13,-4,0xb34aa8,1],['Die Werkstatt',-8,12,0x3f7fd4,1.1],['Wichtel-Akademie',10,13,0x2f9e6b,1.3],['Das Rentier-Stall',-22,10,0x7a5a3a,.9],['Die Post vom Nordpol',24,6,0xe0a82e,.9]];
defs.forEach(function(d,i){var g=new T.Group(),s=d[4];
var body=new T.Mesh(new T.BoxGeometry(6*s,4*s,5*s),new T.MeshStandardMaterial({color:d[3],roughness:.8}));body.position.y=2*s;
var roof=new T.Mesh(new T.ConeGeometry(4.9*s,3*s,4),new T.MeshStandardMaterial({color:0xf4f8ff}));roof.position.y=5.5*s;roof.rotation.y=Math.PI/4;
var door=new T.Mesh(new T.BoxGeometry(1.2*s,2*s,.2),new T.MeshStandardMaterial({color:0x4a2f1a}));door.position.set(0,1*s,2.55*s);
g.add(body,roof,door);
[-1.8,1.8].forEach(function(wx){var w=new T.Mesh(new T.BoxGeometry(1.1*s,1.1*s,.2),new T.MeshBasicMaterial({color:0xffd27a}));w.position.set(wx*s,2.6*s,2.55*s);g.add(w);});
var pl=new T.PointLight(0xffc266,.9,14);pl.position.set(0,2.5*s,4*s);g.add(pl);lights.push(pl);
var ch=new T.Mesh(new T.BoxGeometry(.9*s,2*s,.9*s),new T.MeshStandardMaterial({color:0x5a3a2a}));ch.position.set(1.6*s,6*s,-.6*s);g.add(ch);
g.position.set(d[1],0,d[2]);g.rotation.y=Math.atan2(-d[1],-d[2]+30)*.35;g.userData={name:d[0],i:i,chim:new T.Vector3(1.6*s,7.2*s,-.6*s)};
scene.add(g);houses.push(g);});
/* Rauch */
var smokeG=new T.SphereGeometry(.5,8,8),smokeM=new T.MeshBasicMaterial({color:0xcfd8ea,transparent:true,opacity:.5});
houses.forEach(function(h){for(var k=0;k<4;k++){var m=new T.Mesh(smokeG,smokeM.clone());m.userData={h:h,t:k/4};scene.add(m);smokes.push(m);}});
/* Bäume */
function tree(x,z,s){var g=new T.Group();var tr=new T.Mesh(new T.CylinderGeometry(.3*s,.4*s,1.5*s,6),new T.MeshStandardMaterial({color:0x5a3b22}));tr.position.y=.75*s;g.add(tr);
for(var i=0;i<3;i++){var co=new T.Mesh(new T.ConeGeometry((2.2-i*.55)*s,(2.4-i*.2)*s,7),new T.MeshStandardMaterial({color:0x1f6b46,roughness:.9}));co.position.y=(2+i*1.4)*s;g.add(co);var sn=new T.Mesh(new T.ConeGeometry((1.3-i*.35)*s,1.0*s,7),new T.MeshStandardMaterial({color:0xffffff}));sn.position.y=(2.9+i*1.4)*s;g.add(sn);}
g.position.set(x,0,z);scene.add(g);}
for(var i=0;i<46;i++){var a=Math.random()*6.283,r=20+Math.random()*20;tree(Math.cos(a)*r,Math.sin(a)*r,.8+Math.random()*.9);}
/* Laternen */
[[-4,4],[4,3],[0,8],[-12,6],[12,6]].forEach(function(p){var pole=new T.Mesh(new T.CylinderGeometry(.08,.1,3,6),new T.MeshStandardMaterial({color:0x2a2a2a}));pole.position.set(p[0],1.5,p[1]);var lamp=new T.Mesh(new T.SphereGeometry(.3,10,10),new T.MeshBasicMaterial({color:0xffe08a}));lamp.position.set(p[0],3.1,p[1]);var l=new T.PointLight(0xffd27a,.7,10);l.position.set(p[0],3.1,p[1]);scene.add(pole,lamp,l);lights.push(l);});
/* Schneemann */
(function(){var g=new T.Group(),m=new T.MeshStandardMaterial({color:0xffffff});[[1,1],[.75,2.2],[.5,3.1]].forEach(function(a){var s=new T.Mesh(new T.SphereGeometry(a[0],16,16),m);s.position.y=a[1];g.add(s);});var n=new T.Mesh(new T.ConeGeometry(.12,.6,8),new T.MeshStandardMaterial({color:0xff8a2b}));n.rotation.x=Math.PI/2;n.position.set(0,3.1,.55);g.add(n);var h=new T.Mesh(new T.CylinderGeometry(.35,.35,.5,12),new T.MeshStandardMaterial({color:0x222222}));h.position.y=3.75;g.add(h);g.position.set(5,0,8);scene.add(g);})();
/* Sterne und Schnee */
var sg=new T.BufferGeometry(),sp=[];for(var i=0;i<500;i++){var a=Math.random()*6.283,b=Math.random()*1.3+.1,r=150;sp.push(Math.cos(a)*Math.cos(b)*r,Math.sin(b)*r,Math.sin(a)*Math.cos(b)*r);}sg.setAttribute('position',new T.Float32BufferAttribute(sp,3));
var stars=new T.Points(sg,new T.PointsMaterial({color:0xffffff,size:1.2,sizeAttenuation:false}));scene.add(stars);
var N=900,fp=new Float32Array(N*3),fv=[];for(i=0;i<N;i++){fp[i*3]=(Math.random()-.5)*90;fp[i*3+1]=Math.random()*40;fp[i*3+2]=(Math.random()-.5)*90;fv.push(2+Math.random()*3);}
var fg=new T.BufferGeometry();fg.setAttribute('position',new T.BufferAttribute(fp,3));var flakes=new T.Points(fg,new T.PointsMaterial({color:0xffffff,size:.45,transparent:true,opacity:.9}));scene.add(flakes);
function setNight(n){night=n;var k=n;scene.background=new T.Color(k?0x070d1f:0x8cc6ff);scene.fog=new T.Fog(k?0x070d1f:0x8cc6ff,50,150);amb.intensity=k?.55:.95;amb.color.set(k?0x6f86c8:0xffffff);sun.intensity=k?.6:1.1;sun.color.set(k?0xbfd4ff:0xfff4d6);moon.visible=k;stars.visible=k;lights.forEach(function(l){l.intensity=k?.9:.05;});$('#dn').textContent=k?'🌙':'☀️';}
setNight(true);$('#dn').onclick=function(){setNight(!night);};
/* Kamera */
var yaw=.6,pit=.45,dist=62,ty=0,tp=.45,td=62,drag=null,pts={},pd=0,moved=0;
c.addEventListener('pointerdown',function(e){pts[e.pointerId]=e;c.setPointerCapture(e.pointerId);moved=0;var k=Object.keys(pts);if(k.length===2){var a=pts[k[0]],b=pts[k[1]];pd=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}drag={x:e.clientX,y:e.clientY};});
c.addEventListener('pointermove',function(e){if(!pts[e.pointerId])return;var k=Object.keys(pts);if(k.length===2){pts[e.pointerId]=e;var a=pts[k[0]],b=pts[k[1]],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);td=Math.max(22,Math.min(95,td-(d-pd)*.2));pd=d;moved=9;return;}
pts[e.pointerId]=e;if(drag){var dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);ty-=dx*.006;tp=Math.max(.12,Math.min(1.2,tp+dy*.004));drag={x:e.clientX,y:e.clientY};}});
function up(e){var was=moved<6&&Object.keys(pts).length===1;delete pts[e.pointerId];if(was)pick(e);drag=null;}
c.addEventListener('pointerup',up);c.addEventListener('pointercancel',function(e){delete pts[e.pointerId];drag=null;});
c.addEventListener('wheel',function(e){e.preventDefault();td=Math.max(22,Math.min(95,td+e.deltaY*.05));},{passive:false});
var ray=new T.Raycaster(),tip=$('#tip3'),tt=0;
function pick(e){var r=c.getBoundingClientRect(),m=new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(m,cam);
var hit=ray.intersectObjects(houses,true);if(hit.length){var o=hit[0].object;while(o&&!o.userData.name)o=o.parent;if(o){tip.textContent='🏠 '+o.userData.name;tip.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){tip.classList.remove('on')},2600);}}}
var l=performance.now();
function frame(n){requestAnimationFrame(frame);if(paused||document.hidden)return;var dt=Math.min(.05,(n-l)/1000);l=n;
if(!drag&&!reduce&&Object.keys(pts).length===0)ty+=dt*.04;
yaw+=(ty-yaw)*Math.min(1,dt*8);pit+=(tp-pit)*Math.min(1,dt*8);dist+=(td-dist)*Math.min(1,dt*6);
cam.position.set(Math.sin(yaw)*Math.cos(pit)*dist,Math.sin(pit)*dist+2,Math.cos(yaw)*Math.cos(pit)*dist);cam.lookAt(0,3,0);
var P=fg.attributes.position;for(var i=0;i<N;i++){var y=P.array[i*3+1]-fv[i]*dt;if(y<0)y=40;P.array[i*3+1]=y;P.array[i*3]+=Math.sin(n/1500+i)*dt*.5;}P.needsUpdate=true;
smokes.forEach(function(m){var u=m.userData;u.t=(u.t+dt*.2)%1;var ch=u.h.userData.chim;m.position.set(u.h.position.x+ch.x+u.t*3,ch.y+u.t*7,u.h.position.z+ch.z);m.scale.setScalar(.6+u.t*1.6);m.material.opacity=.5*(1-u.t);});
lights.forEach(function(L,i){if(night)L.intensity=.8+.12*Math.sin(n/350+i*2);});
ren.render(scene,cam);}
requestAnimationFrame(frame);
};
return api;})();
/* ===== Rennen ===== */
var race=(function(){
var c=$('#rc'),d=Math.min(devicePixelRatio||1,2);c.width=360*d;c.height=560*d;var g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);
var ov=$('#r-ov'),run=false,raf=0,o={},level=+store('wl_rlv')||1,keys={},rest=store('wl_race');
$('#r-l').textContent=level;
function reset(){o={x:180,tx:180,dist:0,v:130,boost:0,ld:0,lx:260,ob:[],it:[],pa:[],spn:0,t:0,hit:0,fin:0,tilt:0};$('#r-t').textContent=3000;}
function start(){reset();run=true;ov.classList.add('hide');var l=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(function f(n){var dt=Math.min(.04,(n-l)/1000);l=n;upd(dt);draw(n);if(run)raf=requestAnimationFrame(f);});}
function stop(){run=false;cancelAnimationFrame(raf);}
function over(win){run=false;if(win){level++;store('wl_rlv',level);store('wl_race',Math.max(+rest||0,level-1));}
ov.innerHTML='<h3>'+(win?'Du gewinnst! 🏆':'Lasse war schneller')+'</h3><p>'+(win?'Du hast Lasse geschlagen. Nächste Runde wird schwerer: Runde '+level+'.':'Das war knapp. Versuch es nochmal, du schaffst das!')+'</p><button class="btn">'+(win?'Nächste Runde':'Revanche')+'</button>';ov.classList.remove('hide');ov.querySelector('.btn').onclick=start;$('#r-l').textContent=level;}
function upd(dt){o.t+=dt;var ax=(keys.l?-1:0)+(keys.r?1:0);if(ax)o.tx=Math.max(50,Math.min(310,o.tx+ax*300*dt));var ox=o.x;o.x+=(o.tx-o.x)*Math.min(1,dt*9);o.tilt=(o.x-ox)*2;
var base=150+(o.boost>0?90:0)-(o.hit>0?70:0);o.v+=(base-o.v)*Math.min(1,dt*3);if(o.boost>0)o.boost-=dt;if(o.hit>0)o.hit-=dt;o.dist+=o.v*dt;
var lr=125+level*14+ (o.dist-o.ld>150?-10:0)+ (o.ld-o.dist>200?-22:0);o.ld+=lr*dt;$('#r-d').textContent=Math.min(3000,Math.round(o.dist));$('#r-v').textContent='⚡ '+Math.round(o.v);
o.spn-=dt;if(o.spn<=0){o.spn=.5;var r=Math.random(),x=45+Math.random()*270;if(r<.65)o.ob.push({x:x,y:-40,k:Math.random()<.5?'rock':'tree'});else o.it.push({x:x,y:-30});}
o.ob.forEach(function(b){b.y+=o.v*dt;if(o.hit<=0&&Math.abs(b.x-o.x)<26&&Math.abs(b.y-470)<30){o.hit=.9;o.v=70;if(navigator.vibrate)navigator.vibrate(60);}});
o.it.forEach(function(b){b.y+=o.v*dt;if(!b.d&&Math.abs(b.x-o.x)<28&&Math.abs(b.y-470)<30){b.d=1;o.boost=1.6;}});
o.ob=o.ob.filter(function(b){return b.y<620});o.it=o.it.filter(function(b){return b.y<620&&!b.d});
if(!reduce)o.pa.push({x:o.x-6+Math.random()*12,y:500,l:0});o.pa.forEach(function(p){p.l+=dt;p.y+=80*dt});o.pa=o.pa.filter(function(p){return p.l<.4});
if(o.dist>=3000)over(true);else if(o.ld>=3000)over(false);}
function sledShape(x,y,col,hat,a){g.save();g.globalAlpha=a;g.translate(x,y);g.strokeStyle='#cfd8e8';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(-22,22);g.lineTo(22,22);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(-20,4);g.lineTo(20,4);g.lineTo(16,20);g.lineTo(-16,20);g.closePath();g.fill();g.fillStyle='#f3c9a0';g.beginPath();g.arc(0,-4,8,0,6.3);g.fill();g.fillStyle=hat;g.beginPath();g.moveTo(-9,-6);g.quadraticCurveTo(0,-26,11,-8);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(-9,-8,20,4);g.restore();}
function draw(now){var gr=g.createLinearGradient(0,0,0,560);gr.addColorStop(0,'#09122c');gr.addColorStop(1,'#1b3a72');g.fillStyle=gr;g.fillRect(0,0,360,560);
g.fillStyle='#e8f2ff';g.fillRect(30,0,300,560);g.fillStyle='#d3e3fa';var so=(o.dist*.8)%70;for(var i=-1;i<9;i++)g.fillRect(30,i*70+so,300,3);
g.fillStyle='#b5cdf0';g.fillRect(30,0,4,560);g.fillRect(326,0,4,560);
if(o.dist>2700){var fy=470-(3000-o.dist)*1.9+ -0;g.fillStyle='#000';g.fillRect(30,fy,300,10);g.fillStyle='#fff';for(var k=0;k<15;k++)if(k%2)g.fillRect(30+k*20,fy,20,10);}
o.it.forEach(function(b){g.fillStyle='#ffd27a';g.shadowColor='#ffd27a';g.shadowBlur=14;g.beginPath();g.moveTo(b.x+4,b.y-14);g.lineTo(b.x-8,b.y+2);g.lineTo(b.x,b.y+2);g.lineTo(b.x-4,b.y+14);g.lineTo(b.x+8,b.y-2);g.lineTo(b.x,b.y-2);g.closePath();g.fill();g.shadowBlur=0;});
o.ob.forEach(function(b){if(b.k==='rock'){g.fillStyle='#6f7e9a';g.beginPath();g.ellipse(b.x,b.y,22,15,0,0,6.3);g.fill();g.fillStyle='#fff';g.beginPath();g.ellipse(b.x,b.y-7,16,6,0,0,6.3);g.fill();}else{g.fillStyle='#1f6b46';g.beginPath();g.moveTo(b.x,b.y-26);g.lineTo(b.x-20,b.y+14);g.lineTo(b.x+20,b.y+14);g.closePath();g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(b.x,b.y-26);g.lineTo(b.x-9,b.y-8);g.lineTo(b.x+9,b.y-8);g.closePath();g.fill();}});
o.pa.forEach(function(p){g.globalAlpha=1-p.l/.4;g.fillStyle=o.boost>0?'#ffd27a':'#fff';g.beginPath();g.arc(p.x,p.y,2.6,0,6.3);g.fill();});g.globalAlpha=1;
var diff=o.ld-o.dist,ly=470-Math.max(-60,Math.min(560,diff*1.6));
if(ly<560&&ly>-40)sledShape(o.lx,ly,'#2d6bd1','#2d6bd1',.95);
if(o.hit<=0||Math.floor(now/80)%2)sledShape(o.x,470,'#b5282f','#c8232a',1);
g.fillStyle='#ffffff22';g.fillRect(340,40,8,480);g.fillStyle='#ffd27a';g.beginPath();g.arc(344,520-Math.min(1,o.dist/3000)*480,6,0,6.3);g.fill();g.fillStyle='#4a8dff';g.beginPath();g.arc(344,520-Math.min(1,o.ld/3000)*480,6,0,6.3);g.fill();
if(diff>60&&ly>=560){g.fillStyle='#8fb7ff';g.font='700 14px system-ui';g.textAlign='center';g.fillText('Lasse ist '+Math.round(diff)+' m hinter dir',180,545);}
if(diff<-60){g.fillStyle='#ff8a8f';g.font='700 14px system-ui';g.textAlign='center';g.fillText('Lasse liegt '+Math.round(-diff)+' m vorn!',180,40);}}
function pm(e){if(!run)return;var r=c.getBoundingClientRect();o.tx=Math.max(50,Math.min(310,(e.clientX-r.left)*360/r.width));}
c.addEventListener('pointerdown',pm);c.addEventListener('pointermove',pm);
addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){keys.l=1;if(run)e.preventDefault();}if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){keys.r=1;if(run)e.preventDefault();}});
addEventListener('keyup',function(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')keys.l=0;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')keys.r=0;});
$('#r-go').onclick=start;reset();draw(0);
return{stop:stop};})();
/* ===== Orchester ===== */
(function(){
var AC=window.AudioContext||window.webkitAudioContext,ctx=null;
var N=[['C',261.63,'#ff8a8f'],['D',293.66,'#ffb870'],['E',329.63,'#ffe27a'],['F',349.23,'#b6f08a'],['G',392,'#7dffd0'],['A',440,'#7fd1ff'],['H',493.88,'#a99bff'],['C',523.25,'#ff9be0']];
var K='asdfghjk',bells=$('#bells');
bells.innerHTML=N.map(function(n,i){return'<button class="bell" data-i="'+i+'" style="background:linear-gradient(#fff8,'+n[2]+')" aria-label="Glocke '+n[0]+'">'+n[0]+'</button>';}).join('');
function snd(i){if(!AC)return;if(!ctx)ctx=new AC();if(ctx.state==='suspended')ctx.resume();var t=ctx.currentTime,f=N[i][1];
[[1,.5],[2.76,.18],[5.4,.08]].forEach(function(p){var o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f*p[0];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(p[1],t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+1.6/p[0]**.3);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+1.8);});}
var mode=null,seq=[],pos=0,rec=false,recd=[],t0=0,msg=$('#omsg');
var SONGS={sn:['Stille Nacht',[4,5,4,2,4,5,4,2,3,3,6,0,0,4,5,5,7,6,5,4,5,4,2,5,5,7,6,5,4,5,4,2,3,3,1,3,6,7,2,4,3,1,0]],jb:['Jingle Bells',[2,2,2,2,2,2,2,4,0,1,2,3,3,3,3,3,2,2,2,2,1,1,2,1,4]]};
/* Notennummern: 0=C,1=D,2=E,3=F,4=G,5=A,6=H,7=hohes C */
function hi(){$$('.bell').forEach(function(b){b.classList.remove('next')});if(mode&&pos<seq.length)bells.children[seq[pos]].classList.add('next');}
function play(i){var b=bells.children[i];b.classList.add('on');setTimeout(function(){b.classList.remove('on')},180);snd(i);
if(rec)recd.push([i,performance.now()-t0]);
if(mode&&pos<seq.length){if(i===seq[pos]){pos++;if(pos>=seq.length){msg.textContent='Wunderbar! '+SONGS[mode][0]+' komplett gespielt. 🎶';mode=null;}else msg.textContent=SONGS[mode][0]+': '+pos+'/'+seq.length;}hi();}}
bells.addEventListener('pointerdown',function(e){var b=e.target.closest('.bell');if(b){e.preventDefault();play(+b.dataset.i);}});
addEventListener('keydown',function(e){if(e.repeat||$('#p-orch').hidden||/INPUT/.test((e.target||{}).tagName))return;var i=K.indexOf(e.key.toLowerCase());if(i>=0)play(i);});
function learn(k){mode=k;seq=SONGS[k][1];pos=0;rec=false;msg.textContent='Spiel mit: Tippe die leuchtende Glocke. '+SONGS[k][0];hi();}
$('#o-sn').onclick=function(){learn('sn')};$('#o-jb').onclick=function(){learn('jb')};
$('#o-rec').onclick=function(){mode=null;hi();if(!rec){rec=true;recd=[];t0=performance.now();$('#o-rec').textContent='⏹ Stopp';msg.textContent='Aufnahme läuft…';}else{rec=false;$('#o-rec').textContent='⏺ Aufnehmen';msg.textContent=recd.length?recd.length+' Töne aufgenommen. Drück Abspielen.':'Nichts aufgenommen.';}};
$('#o-play').onclick=function(){if(!recd.length){msg.textContent='Erst etwas aufnehmen.';return;}mode=null;hi();msg.textContent='Deine Melodie…';var s=recd[0][1];recd.forEach(function(r){setTimeout(function(){var b=bells.children[r[0]];b.classList.add('on');setTimeout(function(){b.classList.remove('on')},180);snd(r[0]);},r[1]-s);});};
if(!AC)msg.textContent='Dein Browser kann leider keinen Ton abspielen.';
})();
/* ===== Adventsrätsel ===== */
(function(){
var R=[
['Ich falle leise vom Himmel, bin weiss und kalt, und in deiner warmen Hand verschwinde ich.',['schnee']],
['Im Wohnzimmer stehe ich grün und glitzere. Kugeln und Lichter hängen an meinen Zweigen.',['tannenbaum','christbaum','weihnachtsbaum']],
['Je mehr du von mir wegnimmst, desto grösser werde ich.',['loch']],
['Ich habe einen roten Mantel, einen weissen Bart und komme am 6. Dezember mit einem Sack.',['samichlaus','nikolaus','santaklaus','niklaus']],
['Ich habe ein Geweih und ziehe den Schlitten durch die Nacht. Mein berühmter Kollege hat eine rote Nase.',['rentier']],
['Ich habe Zähne, aber ich beisse nie.',['kamm']],
['Ich werde nass, während ich dich trockne.',['handtuch','tuch']],
['Ich habe schwarze und weisse Tasten, aber ich bin kein Computer.',['klavier','piano']],
['Ich habe Zeiger, aber keine Hände zum Klatschen. Ich zeige dir, wann es Zeit zum Schlafen ist.',['uhr','wanduhr']],
['Ich bin braun oder weiss, süss und komme in Papier verpackt. Im Samichlaussäckli bin ich fast immer dabei.',['schokolade','schoggi']],
['Ich habe Länder und Meere, aber kein Wasser. Ich habe Strassen, aber niemand wohnt dort.',['karte','landkarte','weltkarte']],
['Ich leuchte, werde beim Brennen immer kürzer und bin aus Wachs.',['kerze']],
['Ich bin rund, orange und rieche gut. Am Samichlaustag stecke ich im Stiefel.',['mandarine','mandarinli','orange','klementine']],
['Ich habe einen Rücken, aber keine Beine. Ich habe viele Seiten und erzähle Geschichten.',['buch']],
['Mein Körper besteht aus drei weissen Kugeln, meine Nase ist eine Karotte. In der Sonne werde ich traurig.',['schneemann']],
['Ich sehe aus wie du, wenn du mich ansiehst, aber ich sage nie ein Wort.',['spiegel']],
['Ich komme einmal im Jahr. Hinter meinen 24 Türchen wartet jeden Tag etwas.',['adventskalender','kalender']],
['Ich bin klein, trage eine rote Mütze und arbeite im Wichteldorf. Wer bin ich?',['wichtel','elf','zwerg']],
['Unter dem Baum liegen wir eingepackt und warten darauf, geöffnet zu werden.',['geschenke','geschenk','paeckli','päckli','pakete']],
['Ich leuchte nachts kurz am Himmel und habe einen langen Schweif. Man darf sich etwas wünschen.',['sternschnuppe']],
['Ich bin süss, werde im Ofen gebacken und mit Förmchen ausgestochen. Im Advent riecht das ganze Haus nach mir.',['guetzli','plaetzchen','plätzchen','keks','kekse','weihnachtsguetzli']],
['Ich bin die Nacht mit den vielen Kerzen, die direkt vor dem grossen Tag kommt.',['heiligabend','heiligenabend','heilig abend']],
['Ich bin der Tag, an dem alle zusammenkommen und alles ankommt.',['weihnachten','weihnachtstag','25 dezember']],
['Auf mir sitzt Lasse, wenn er unterwegs ist. Ich habe Kufen und gleite durch den Schnee.',['schlitten']]];
R=R.slice(0,24);while(R.length<24)R.push(['Wer bin ich?',['wichtel']]);
function norm(s){return s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');}
function today(){var f=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return f;}
function open(n){return today()>=('2026-12-'+(n<10?'0':'')+n);}
var solved={};try{solved=JSON.parse(store('wl_quest')||'{}')}catch(e){}
var grid=$('#qgrid'),cur=0;
function draw(){grid.innerHTML=R.map(function(r,i){var n=i+1,o=open(n),s=solved[n];return'<button class="qd'+(s?' ok':'')+(cur===n?' cur':'')+'" data-n="'+n+'"'+(o?'':' disabled')+' aria-label="Türchen '+n+'">'+(s?'✓':n)+'</button>';}).join('');}
function pick(n){cur=n;draw();var s=solved[n];$('#qh').textContent='Türchen '+n;$('#qt').textContent=R[n-1][0];$('#qin').hidden=!!s;$('#qb').hidden=!!s;$('#qin').value='';$('#qm').textContent=s?'Gelöst: '+s+' ✓':'';$('#qm').style.color='var(--mint)';}
grid.addEventListener('click',function(e){var b=e.target.closest('.qd');if(b&&!b.disabled)pick(+b.dataset.n);});
function check(){var n=cur;if(!n)return;var a=norm($('#qin').value);if(!a)return;var ok=R[n-1][1].some(function(x){return norm(x)===a});if(ok){solved[n]=$('#qin').value.trim();store('wl_quest',JSON.stringify(solved));pick(n);var c=Object.keys(solved).length;$('#qm').textContent='Richtig! ✓ '+(c===24?'Alle 24 Rätsel gelöst, Lasse ist stolz auf dich! 🎉':c+' von 24 gelöst.');}else{$('#qm').style.color='#ff8a8f';$('#qm').textContent='Nicht ganz. Probier es nochmal.';}}
$('#qb').onclick=check;$('#qin').addEventListener('keydown',function(e){if(e.key==='Enter')check();});
draw();
var nopen=R.filter(function(r,i){return open(i+1)}).length;
if(!nopen)$('#qh').textContent='Es geht am 1. Dezember los';
})();
var h=(location.hash||'').slice(1);if(['dorf','race','orch','quest'].indexOf(h)>=0)show(h);else show('dorf');
})();

/* Tab- und Start-Verhalten: Spiel immer komplett im Bild */
(function(){var tabs=document.querySelector('.tabs');if(!tabs)return;
function top(){try{tabs.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){tabs.scrollIntoView();}}
tabs.addEventListener('click',function(e){if(e.target.closest('button'))setTimeout(top,60);});
document.addEventListener('click',function(e){var b=e.target.closest('.ov .btn');if(b)setTimeout(top,60);});
})();
