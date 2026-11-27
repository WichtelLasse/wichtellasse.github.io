(function(){"use strict";
if(!window.THREE)return;
var TH=THREE,RAD=Math.PI/180,FOV=32;
function V(lat,lon,r){lat*=RAD;lon*=RAD;return new TH.Vector3(r*Math.cos(lat)*Math.cos(lon),r*Math.sin(lat),-r*Math.cos(lat)*Math.sin(lon));}
function line(A,B,n){var o=[];for(var k=0;k<=n;k++){var f=k/n;o.push({lat:A.lat+(B.lat-A.lat)*f,lon:A.lon+(B.lon-A.lon)*f});}return o;}
function route(Rt,upto){var o=[];for(var i=1;i<Rt.length;i++){if(upto!=null&&i>upto)break;var seg=line(Rt[i-1],Rt[i],40);if(i>1)seg.shift();o=o.concat(seg);}return o;}
function dedupe(p){var o=[];p.forEach(function(q){var l=o[o.length-1];if(!l||l.distanceTo(q)>1e-4)o.push(q);});return o;}
function txtTex(txt,col,w,h,font){var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d');g.font=font;g.textBaseline='middle';g.lineJoin='round';g.lineWidth=7;g.strokeStyle='rgba(5,10,26,.9)';g.strokeText(txt,10,h/2);g.fillStyle=col;g.fillText(txt,10,h/2);var t=new TH.CanvasTexture(c);t.minFilter=TH.LinearFilter;return t;}
function emoTex(e){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');g.font='90px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(e,64,70);var t=new TH.CanvasTexture(c);return t;}
function haloTex(){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d'),r=g.createRadialGradient(64,64,4,64,64,64);r.addColorStop(0,'rgba(255,210,122,.9)');r.addColorStop(.35,'rgba(255,210,122,.35)');r.addColorStop(1,'rgba(255,210,122,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new TH.CanvasTexture(c);}
function fallbackTex(land){var W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1d4f86');gr.addColorStop(.5,'#2a6aa8');gr.addColorStop(1,'#1d4f86');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='#cfe3d0';g.strokeStyle='#f1f8f2';g.lineWidth=2;(land||[]).forEach(function(p){g.beginPath();p.forEach(function(q,i){var x=(q[0]+180)/360*W,y=(90-q[1])/180*H;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.fill();g.stroke();});
 g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=1;for(var la=-60;la<=60;la+=30){var y=(90-la)/180*H;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}for(var lo=-150;lo<=180;lo+=30){var x=(lo+180)/360*W;g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
 return new TH.CanvasTexture(c);}
function init(cv,T,opt){
 opt=opt||{};var W=cv.width,H=cv.height;
 var R=new TH.WebGLRenderer({canvas:cv,antialias:true});R.setPixelRatio(1);R.setSize(W,H,false);R.setClearColor(0x050a1a,1);
 var scene=new TH.Scene(),cam=new TH.PerspectiveCamera(FOV,W/H,.05,200);scene.add(cam);
 var amb=new TH.AmbientLight(0xffffff,.8);scene.add(amb);var dl=new TH.DirectionalLight(0xffffff,.75);dl.position.set(2,1.5,3);cam.add(dl);
 var sp=[];for(var i=0;i<1600;i++){var u=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-u*u);sp.push(60*r*Math.cos(a),60*u,60*r*Math.sin(a));}
 var sg=new TH.BufferGeometry();sg.setAttribute('position',new TH.Float32BufferAttribute(sp,3));scene.add(new TH.Points(sg,new TH.PointsMaterial({color:0xffffff,size:1.4,sizeAttenuation:false,transparent:true,opacity:.8})));
 var earth=new TH.Group();scene.add(earth);
 var mat=new TH.MeshPhongMaterial({map:fallbackTex(opt.land),shininess:6,specular:0x112233});
 var sph=new TH.Mesh(new TH.SphereGeometry(1,96,64),mat);earth.add(sph);
 try{var ld=new TH.TextureLoader();ld.setCrossOrigin('anonymous');ld.load('https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg',function(t){try{t.anisotropy=R.capabilities.getMaxAnisotropy();mat.map=t;mat.needsUpdate=true;}catch(e){}},undefined,function(){});}catch(e){}
 var atm=new TH.Mesh(new TH.SphereGeometry(1.14,64,48),new TH.ShaderMaterial({vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vN;void main(){float i=pow(max(0.0,0.72-dot(vN,vec3(0.0,0.0,1.0))),3.0);gl_FragColor=vec4(0.35,0.65,1.0,1.0)*i*1.6;}',side:TH.BackSide,blending:TH.AdditiveBlending,transparent:true,depthWrite:false}));scene.add(atm);
 /* Routen */
 var routes=[];function addR(a){if(a&&a.length&&routes.indexOf(a)<0)routes.push(a);}addR(T.RN);addR(T.RS);(T.TRIPS||[]).forEach(function(x){addR(x[1]&&x[1].R);});
 routes.forEach(function(Rt){var pts=route(Rt).map(function(q){return V(q.lat,q.lon,1.006);});var g=new TH.BufferGeometry().setFromPoints(pts);var l=new TH.Line(g,new TH.LineDashedMaterial({color:0xffffff,dashSize:.012,gapSize:.022,transparent:true,opacity:.55}));l.computeLineDistances();earth.add(l);});
 /* Staedte */
 var cities={},list=[];
 routes.forEach(function(Rt,ri){Rt.forEach(function(q,i){if(cities[q.n])return;var home=(Rt===T.RN&&i===6);var nm=(home?'🏠 ':'')+q.n;
  var dot=new TH.Mesh(new TH.SphereGeometry(.011,12,12),new TH.MeshBasicMaterial({color:0xffffff}));dot.position.copy(V(q.lat,q.lon,1.008));earth.add(dot);
  var tw=txtTex(nm,'#e6f3ff',320,64,'700 30px system-ui,sans-serif'),tg=txtTex(nm,'#ffd27a',320,64,'800 30px system-ui,sans-serif');
  var sp2=new TH.Sprite(new TH.SpriteMaterial({map:tw,transparent:true,depthTest:false}));sp2.center.set(0,.5);sp2.position.copy(V(q.lat,q.lon,1.03));sp2.renderOrder=5;earth.add(sp2);
  cities[q.n]={dot:dot,sp:sp2,tw:tw,tg:tg,gold:false,asp:5,nm:nm,lat:q.lat,lon:q.lon,n:q.n};list.push(cities[q.n]);});});
 function setGold(n,v){var c=cities[n];if(!c||c.gold===v)return;c.gold=v;c.dot.material.color.set(v?0xffd27a:0xffffff);c.sp.material.map=v?c.tg:c.tw;c.sp.material.needsUpdate=true;}
 function setWx(m){Object.keys(m).forEach(function(n){var c=cities[n];if(!c)return;var nm=c.nm+' '+m[n];var tw=txtTex(nm,'#e6f3ff',420,64,'700 30px system-ui,sans-serif'),tg=txtTex(nm,'#ffd27a',420,64,'800 30px system-ui,sans-serif');if(c.tw)c.tw.dispose();if(c.tg)c.tg.dispose();c.tw=tw;c.tg=tg;c.asp=420/64;c.sp.material.map=c.gold?tg:tw;c.sp.material.needsUpdate=true;});}
 /* Lasse */
 var lm=new TH.Group();earth.add(lm);var core=new TH.Mesh(new TH.SphereGeometry(.017,16,16),new TH.MeshBasicMaterial({color:0xffd27a}));lm.add(core);
 var ring=new TH.Mesh(new TH.SphereGeometry(.024,16,16),new TH.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.7}));lm.add(ring);
 var halo=new TH.Sprite(new TH.SpriteMaterial({map:haloTex(),transparent:true,depthTest:false,blending:TH.AdditiveBlending}));halo.renderOrder=6;lm.add(halo);
 var ec={},emo=new TH.Sprite(new TH.SpriteMaterial({map:emoTex('🏡'),transparent:true,depthTest:false}));emo.center.set(0,0);emo.renderOrder=7;lm.add(emo);var curE='';
 function setEmo(e){if(e===curE)return;curE=e;if(!ec[e])ec[e]=emoTex(e);emo.material.map=ec[e];emo.material.needsUpdate=true;}
 var trail=null,trailT=0;
 function setTrail(s){if(trail){earth.remove(trail);trail.children.forEach(function(m){m.geometry.dispose();m.material.dispose();});trail=null;}if(s.ph!=='trip'||!s.R)return;
  var up=s.mv?s.i-1:s.i;var b0=s.R[Math.max(0,up)],p=route(s.R,Math.max(0,up));if(!p.length)p=[{lat:b0.lat,lon:b0.lon}];p=p.concat(line(b0,{lat:s.lat,lon:s.lon},40));var v=dedupe(p.map(function(q){return V(q.lat,q.lon,1.009);}));if(v.length<2)return;
  try{var cu=new TH.CatmullRomCurve3(v);var g=new TH.TubeGeometry(cu,Math.min(400,v.length*2),.0055,6,false);trail=new TH.Group();trail.add(new TH.Mesh(g,new TH.MeshBasicMaterial({color:0xb9ffe9})));var g2=new TH.TubeGeometry(cu,Math.min(400,v.length*2),.016,8,false);trail.add(new TH.Mesh(g2,new TH.MeshBasicMaterial({color:0x7dffd0,transparent:true,opacity:.28,blending:TH.AdditiveBlending,depthWrite:false})));earth.add(trail);}catch(e){trail=null;}}
 /* Steuerung */
 var yaw=-Math.PI/2,pitch=.5,d=3.6,dT=3.6,mode='follow',vy=0,vp=0,drag=false,pts={},lp=0;
 function clampP(){pitch=Math.max(-1.45,Math.min(1.45,pitch));}
 function clampD(){dT=Math.max(1.5,Math.min(9,dT));}
 cv.style.touchAction='none';cv.style.cursor='grab';cv.style.userSelect='none';
 cv.addEventListener('pointerdown',function(e){try{cv.setPointerCapture(e.pointerId);}catch(x){}pts[e.pointerId]={x:e.clientX,y:e.clientY};var n=Object.keys(pts).length;if(n===1){drag=true;mode='free';vy=vp=0;cv.style.cursor='grabbing';ui();}if(n===2){var a=Object.keys(pts).map(function(k){return pts[k];});lp=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
 cv.addEventListener('pointermove',function(e){var p=pts[e.pointerId];if(!p)return;var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;var ks=Object.keys(pts);
  if(ks.length>=2){var a=pts[ks[0]],b=pts[ks[1]],dist=Math.hypot(a.x-b.x,a.y-b.y);if(lp>0){dT*=lp/dist;clampD();d=dT;}lp=dist;return;}
  var rc=cv.getBoundingClientRect(),k=2*Math.max(.25,d-1)*Math.tan(FOV/2*RAD)/rc.height;vy=dx*k;vp=dy*k;yaw+=vy;pitch+=vp;clampP();});
 var dn=null;cv.addEventListener('pointerdown',function(e){dn={x:e.clientX,y:e.clientY,t:Date.now()};});
 function tap(e){if(!opt.onCity||!dn||Date.now()-dn.t>400||Math.hypot(e.clientX-dn.x,e.clientY-dn.y)>8)return;var rc=cv.getBoundingClientRect(),best=null,bd=34;list.forEach(function(c){if(!c.dot.visible)return;c.dot.getWorldPosition(wp);var p=wp.clone().project(cam);var x=rc.left+(p.x+1)/2*rc.width,y=rc.top+(1-p.y)/2*rc.height,dd=Math.hypot(x-e.clientX,y-e.clientY);if(dd<bd){bd=dd;best=c;}});if(best)opt.onCity(best.n,best.lat,best.lon);}
 function up(e){tap(e);delete pts[e.pointerId];if(!Object.keys(pts).length){drag=false;cv.style.cursor='grab';}lp=0;}
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',function(e){e.preventDefault();dT*=Math.exp(e.deltaY*.0012);clampD();},{passive:false});
 /* Knoepfe */
 var box=cv.parentNode;if(getComputedStyle(box).position==='static')box.style.position='relative';
 var bar=document.createElement('div');bar.id='lgbar';bar.style.cssText='position:absolute;left:10px;bottom:10px;right:10px;display:flex;gap:6px;flex-wrap:wrap;z-index:5;align-items:center';
 function mk(t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='background:#0a122bcc;border:1px solid #ffffff44;color:#fff;border-radius:999px;padding:8px 13px;font:700 .85rem system-ui,sans-serif;cursor:pointer;min-height:38px';b.onclick=fn;bar.appendChild(b);return b;}
 var bL=mk('📍 Lasse',function(){mode='follow';dT=Math.min(dT,4.2);ui();}),bW=mk('🌍 Ganze Welt',function(){mode='world';dT=4.6;ui();}),bP=mk('＋',function(){dT/=1.35;clampD();}),bM=mk('－',function(){dT*=1.35;clampD();});
 var hint=document.createElement('span');hint.textContent='Ziehen zum Drehen';hint.style.cssText='font:600 .75rem system-ui,sans-serif;opacity:.7;color:#fff;margin-left:4px';bar.appendChild(hint);box.appendChild(bar);
 function ui(){[[bL,'follow'],[bW,'world']].forEach(function(x){x[0].style.background=mode===x[1]?'#ffd27a':'#0a122bcc';x[0].style.color=mode===x[1]?'#0a122b':'#fff';});}ui();
 var lastB=0,wp=new TH.Vector3(),fr=0,cw=W,ch=H;function fit(){var rc=cv.getBoundingClientRect();if(rc.width<20||rc.height<20)return;var k=Math.min(2.5,window.devicePixelRatio||1),w=Math.round(rc.width*k),h=Math.round(rc.height*k);if(w!==cw||h!==ch){cw=w;ch=h;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}}
 function draw(now,s){
  if(fr++%20===0)fit();
  var lat=+s.lat||0,lon=+s.lon||0;
  if(mode==='follow'){var ty=-Math.PI/2-lon*RAD,tp=Math.max(-1.3,Math.min(1.3,lat*RAD));var dy=((ty-yaw+Math.PI*3)%(Math.PI*2))-Math.PI;yaw+=dy*.06;pitch+=(tp-pitch)*.06;}
  else if(mode==='world'){yaw+=.0025;pitch+=(.35-pitch)*.02;}
  else if(!drag){yaw+=vy;pitch+=vp;vy*=.93;vp*=.93;clampP();}
  d+=(dT-d)*.12;cam.position.set(0,0,d);earth.rotation.set(pitch,yaw,0);
  var pu=(Math.sin(now/260)+1)/2;lm.position.copy(V(lat,lon,1.012));halo.scale.setScalar(.14+.05*pu);ring.scale.setScalar(.9+.4*pu);emo.scale.setScalar(.085*Math.max(.5,d/4.4));emo.position.set(.012,.012,0);
  setEmo(s.ph==='trip'?(s.veh==='Pinguin-Express'?'🐧':(s.mv?'🛷':'☕')):(s.f==='sleep'?'💤':(s.place==='vk'?'🚪':(s.place==='sp'?'🧊':'🏡'))));
  if(now-lastB>500){lastB=now;var reach={};if(s.ph==='trip'&&s.R){var nI=s.mv?s.i:s.i+1;s.R.forEach(function(q,i){if(i<nI)reach[q.n]=1;});}else if(T.RN){var hi=(s.place==='vk')?6:0;if(T.RN[hi])reach[T.RN[hi].n]=1;}
   Object.keys(cities).forEach(function(n){setGold(n,!!reach[n]);});setTrail(s);}
  var ls=.30*Math.max(.55,d/4.4);list.forEach(function(c){c.sp.getWorldPosition(wp);var n=wp.clone().normalize();var vis=n.z>1/d+.06;c.sp.visible=vis;c.dot.visible=n.z>1/d-.02;c.sp.scale.set(ls*(c.asp||5)/5,ls*.2,1);});
  R.render(scene,cam);}
 return {draw:draw,setWx:setWx,cities:function(){return list.map(function(c){return {n:c.n,lat:c.lat,lon:c.lon};});}};}
window.LG={init:init};
})();
