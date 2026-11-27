(function(){"use strict";
var LF=window.LF;if(!LF||!LF.map)return;
var HOME=[47.4059,8.6822];
var CH=[[45.82,5.96],[47.81,10.5]],ZH=[[47.17,8.36],[47.70,8.99]],QU=[[47.394,8.664],[47.418,8.700]];
var WX={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌦️',56:'🌧️',57:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',66:'🌧️',67:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',77:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'};
var CIT=[['Zürich',47.3769,8.5417,6],['Bern',46.948,7.4474,6],['Basel',47.5596,7.5886,6],['Genf',46.2044,6.1432,6],['Lugano',46.0037,8.9511,6],['Luzern',47.0502,8.3093,6],['St. Gallen',47.4245,9.3767,6],['Chur',46.8499,9.5329,6.5],['Lausanne',46.5197,6.6323,7],
['Winterthur',47.4988,8.7241,9],['Uster',47.3471,8.7209,9.5],['Dübendorf',47.3979,8.6186,9.5],['Wetzikon',47.3226,8.7976,9.5],['Rapperswil',47.2266,8.8224,9.5],['Horgen',47.2593,8.5983,9.5],['Bülach',47.5214,8.5412,9.5],['Volketswil',47.3894,8.6906,9],
['Greifensee',47.3667,8.6833,12.5],['Fällanden',47.3697,8.6213,12.5],['Schwerzenbach',47.3817,8.6607,12.5]];
var RAD=Math.PI/180;
function hav(a,b){var R=6371,dl=(b.lat-a.lat)*RAD,dn=(b.lon-a.lon)*RAD,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a.lat*RAD)*Math.cos(b.lat*RAD)*Math.sin(dn/2)*Math.sin(dn/2);return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));}
function lerp(A,B,n){var o=[];for(var k=0;k<=n;k++){var f=k/n;o.push([A.lat+(B.lat-A.lat)*f,A.lon+(B.lon-A.lon)*f]);}return o;}
function inB(la,lo,b){return la>=b[0][0]&&la<=b[1][0]&&lo>=b[0][1]&&lo<=b[1][1];}
var G=null,map=null,box,el,bar,lvBtns=[],manual=null,cur=0,sat=false,tileT,tileS,lasse,home,dn,done,glow,plan,home2,cityM=[],wxd={},lastKey='',lastGeo=0,geoTxt='',lastWx=0;
function css(){var s=document.createElement('style');s.textContent='.mapbox .badge{z-index:6}#lmap{position:absolute;inset:0;z-index:4;display:none;border-radius:inherit;overflow:hidden;background:#0b1633;font-family:system-ui,sans-serif}#lmap .leaflet-control-attribution{font-size:9px;background:#0a122bcc;color:#cfe}#lmap .leaflet-control-attribution a{color:#ffd27a}'+
 '.kl{position:relative;width:46px;height:46px}.kl i{position:absolute;inset:6px;border-radius:50%;background:rgba(255,210,122,.35);border:2px solid #ffd27a;animation:klp 1.4s infinite}.kl span{position:absolute;left:0;right:0;top:3px;text-align:center;font-size:26px;line-height:40px}@keyframes klp{0%{transform:scale(.7);opacity:1}100%{transform:scale(1.5);opacity:0}}'+
 '.kh,.kc{width:max-content}.kh{background:#0a122bdd;border:1px solid #ffd27a;color:#ffe9b8;font:800 13px system-ui,sans-serif;padding:4px 9px;border-radius:999px;white-space:nowrap;transform:translate(-50%,-100%)}'+
 '.kc{display:flex;align-items:center;gap:5px;white-space:nowrap;transform:translate(7px,-50%);font:700 12px system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;cursor:pointer}.kc:before{content:"";width:9px;height:9px;border-radius:50%;background:#fff;border:2px solid #0a122b;margin-left:-14px;margin-right:5px;flex:none}'+
 '#lvbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 0}#lvbar button{background:#ffffff0d;border:1px solid #ffffff33;color:#fff;border-radius:999px;padding:8px 13px;font:700 .85rem system-ui,sans-serif;cursor:pointer;min-height:38px}#lvbar button.on{background:#ffd27a;color:#0a122b;border-color:#ffd27a}';document.head.appendChild(s);}
function ico(html,sz,anc){return LF.divIcon({className:'',html:html,iconSize:sz||[0,0],iconAnchor:anc||[0,0]});}
function build(){
 el.style.display='block';
 map=LF.map(el,{zoomSnap:.25,zoomControl:true,attributionControl:true,minZoom:6,maxZoom:15,maxBounds:[[44.8,4.9],[48.7,11.6]],maxBoundsViscosity:.9});
 tileT=LF.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',{maxZoom:15,attribution:'© <a href="https://www.swisstopo.admin.ch" target="_blank" rel="noopener">swisstopo</a>'});
 tileS=LF.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',{maxZoom:15,attribution:'© <a href="https://www.swisstopo.admin.ch" target="_blank" rel="noopener">swisstopo</a>'});
 tileT.addTo(map);map.fitBounds(CH);
 glow=LF.polyline([],{color:'#7dffd0',weight:14,opacity:.25,lineCap:'round'}).addTo(map);
 plan=LF.polyline([],{color:'#ffffff',weight:3,opacity:.8,dashArray:'2 9',lineCap:'round'}).addTo(map);
 dn=LF.polyline([],{color:'#7dffd0',weight:5,opacity:1,lineCap:'round'}).addTo(map);
 home2=LF.polyline([],{color:'#ffd27a',weight:4,opacity:.95,dashArray:'3 8',lineCap:'round'}).addTo(map);
 home=LF.marker(HOME,{icon:ico('<div class="kh">🏠 Zuhause</div>'),zIndexOffset:500,interactive:false}).addTo(map);
 lasse=LF.marker(HOME,{icon:ico('<div class="kl"><i></i><span id="kle">🛷</span></div>',[46,46],[23,23]),zIndexOffset:1000,interactive:false}).addTo(map);
 CIT.forEach(function(c){var m=LF.marker([c[1],c[2]],{icon:ico('<div class="kc" data-n="'+c[0]+'">'+c[0]+'</div>'),zIndexOffset:100});m._c=c;m.on('click',function(){if(c[0]==='Volketswil')setLevel(3);else if(c[0]==='Zürich')setLevel(2);});cityM.push(m);});
 map.on('zoomend moveend',cityVis);

}
function mkBar(){ bar=document.createElement('div');bar.id='lvbar';
 [['🌍 Welt',0],['🇨🇭 Schweiz',1],['Kanton Zürich',2],['🏠 Volketswil',3]].forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x[0];b.onclick=function(){setLevel(x[1]);};bar.appendChild(b);lvBtns.push(b);});
 var ba=document.createElement('button');ba.type='button';ba.textContent='📍 Auto';ba.onclick=function(){manual=null;mark();};bar.appendChild(ba);lvBtns.push(ba);
 var bs=document.createElement('button');bs.type='button';bs.textContent='🛰️ Luftbild';bs.onclick=function(){sat=!sat;if(sat){map.removeLayer(tileT);tileS.addTo(map);}else{map.removeLayer(tileS);tileT.addTo(map);}bs.classList.toggle('on',sat);};bar.appendChild(bs);
 box.parentNode.insertBefore(bar,box.nextSibling);
 mark();}
function cityVis(){var z=map.getZoom(),bd=map.getBounds().pad(.1);cityM.forEach(function(m){var show=z>=m._c[3]&&bd.contains(m.getLatLng());if(show&&!map.hasLayer(m)){m.addTo(map);paintCity(m);}else if(!show&&map.hasLayer(m))map.removeLayer(m);});}
function paintCity(m){var n=m._c[0],w=wxd[n],e=m.getElement&&m.getElement();if(e){var d=e.querySelector('.kc');if(d)d.textContent=n+(w?' '+w:'');}}
function setLevel(k){manual=k;mark();}
function mark(){if(!lvBtns.length)return;var want=manual==null?cur:manual;lvBtns.forEach(function(b,i){var on=(i===4?manual==null:(i===want&&manual!=null));b.classList.toggle('on',on);});}
function applyLevel(k){var lg=document.getElementById('lgbar');
 if(k===0){el.style.display='none';if(lg)lg.style.display='';return;}
 el.style.display='block';if(lg)lg.style.display='none';var first=!map;if(first){try{build();}catch(e){map=null;el.style.display='none';if(lg)lg.style.display='';return;}}map.invalidateSize();
 var b=k===1?CH:(k===2?ZH:QU);
 map.fitBounds(b,{animate:!first,duration:1.2,padding:[8,8]});setTimeout(cityVis,1300);}
function want(s){if(s.ph!=='trip'&&s.place==='vk')return 3;if(s.ph==='trip'){var la=+s.lat,lo=+s.lon;if(hav({lat:la,lon:lo},{lat:HOME[0],lon:HOME[1]})<4)return 3;if(inB(la,lo,ZH))return 2;if(inB(la,lo,CH))return 1;}return 0;}
var cnt=0,pend=-1,shown=-1;
function hud(s){
 var hh=document.querySelector('.hud');if(!hh)return;
 if(!document.getElementById('kover')){var a=document.createElement('div');a.className='m';a.style.gridColumn='1/-1';a.innerHTML='<small>Fliegt gerade über</small><b id="kover" style="font-size:1.05rem;font-family:inherit;line-height:1.35">…</b>';var b=document.createElement('div');b.className='m';b.style.gridColumn='1/-1';b.innerHTML='<small>Reise-Zähler</small><b id="kkm" style="font-size:1.05rem;font-family:inherit;line-height:1.35">…</b>';var first=hh.children[0];hh.insertBefore(a,first.nextSibling);hh.insertBefore(b,a.nextSibling);}
 var o=document.getElementById('kover'),k=document.getElementById('kkm');
 if(s.ph==='trip'&&s.R){
  var Rt=s.R,tot=0,dn2=0,up=s.mv?s.i-1:s.i;for(var i=1;i<Rt.length;i++){var d=hav(Rt[i-1],Rt[i]);tot+=d;if(i<=up)dn2+=d;}var b0=Rt[Math.max(0,up)];dn2+=hav(b0,{lat:s.lat,lon:s.lon});if(!s.mv)dn2=Math.min(dn2,tot);
  var f=function(x){return Math.round(x).toLocaleString('de-CH').replace(/’/g,"'")+' km';};k.textContent=f(dn2)+' geflogen · noch '+f(Math.max(0,tot-dn2));
  o.textContent=s.mv?(geoTxt||'…'):'Pause in '+s.at;
 }else{k.textContent='Gerade nicht unterwegs';o.textContent=s.place==='vk'?'Volketswil (Kindhausen)':'–';}
}
function geo(s,now){if(s.ph!=='trip'||!s.mv||now-lastGeo<40000)return;lastGeo=now;
 fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+s.lat+'&longitude='+s.lon+'&localityLanguage=de').then(function(r){return r.json();}).then(function(j){var t=j.countryName||j.locality||'';if(j.countryName&&j.principalSubdivision&&j.countryCode==='CH')t='Schweiz, Kanton '+j.principalSubdivision.replace(/^Kanton /,'');else if(j.countryName&&j.principalSubdivision&&j.principalSubdivision!==j.countryName)t=j.countryName+' ('+j.principalSubdivision+')';if(!t&&window.KM_region)t=window.KM_region(s.lat,s.lon);geoTxt=t;}).catch(function(){if(window.KM_region)geoTxt=window.KM_region(s.lat,s.lon);});}
function wx(now){if(now-lastWx<15*60000)return;lastWx=now;var pts=[],seen={};
 CIT.forEach(function(c){pts.push([c[0],c[1],c[2]]);seen[c[0]]=1;});
 if(G&&G.cities)G.cities().forEach(function(c){if(!seen[c.n]&&Math.abs(c.lat)<=89.9){pts.push([c.n,c.lat,c.lon]);seen[c.n]=1;}});
 var url='https://api.open-meteo.com/v1/forecast?latitude='+pts.map(function(p){return p[1].toFixed(3);}).join(',')+'&longitude='+pts.map(function(p){return p[2].toFixed(3);}).join(',')+'&current=temperature_2m,weather_code&timezone=auto';
 fetch(url).then(function(r){return r.json();}).then(function(j){if(!Array.isArray(j))j=[j];var m={};j.forEach(function(x,i){if(!x||!x.current)return;var n=pts[i][0];var t=(WX[x.current.weather_code]||'🌡️')+' '+Math.round(x.current.temperature_2m)+'°';wxd[n]=t;m[n]=t;});if(G&&G.setWx)G.setWx(m);cityM.forEach(function(mm){if(map&&map.hasLayer(mm))paintCity(mm);});}).catch(function(){lastWx=now-14*60000;});}
function update(now,s){
 wx(now);geo(s,now);
 var w=want(s);if(w===pend)cnt++;else{pend=w;cnt=1;}if(cnt>=3&&cur!==pend){cur=pend;if(manual==null)mark();}
 var lv=manual==null?cur:manual;if(lv!==shown){shown=lv;applyLevel(lv);mark();}
 if(now-(update.t||0)<300)return;update.t=now;hud(s);if(lv===0||!map)return;
 var atHome=(s.ph!=='trip'&&s.place==='vk');var pos=atHome?HOME:[+s.lat,+s.lon];lasse.setLatLng(pos);
 var em=s.ph==='trip'?(s.veh==='Pinguin-Express'?'🐧':(s.mv?'🛷':'☕')):(s.f==='sleep'?'💤':(atHome?'🚪':'🏡'));var e=document.getElementById('kle');if(e&&e.textContent!==em)e.textContent=em;
 if(s.ph==='trip'&&s.R){var Rt=s.R,up=Math.max(0,s.mv?s.i-1:s.i),dp=[],pl=[],i;
  for(i=1;i<=up&&i<Rt.length;i++){var sg=lerp(Rt[i-1],Rt[i],40);if(i>1)sg.shift();dp=dp.concat(sg);}if(!dp.length)dp=[[Rt[0].lat,Rt[0].lon]];
  dp=dp.concat(lerp(Rt[up],{lat:s.lat,lon:s.lon},40));
  var from={lat:s.lat,lon:s.lon};for(i=up+1;i<Rt.length;i++){pl=pl.concat(lerp(from,Rt[i],40));from=Rt[i];}
  dn.setLatLngs(dp);glow.setLatLngs(dp);plan.setLatLngs(pl);var last=Rt[Rt.length-1];home2.setLatLngs(last&&last.n==='Volketswil'?[[last.lat,last.lon],HOME]:[]);}
 else{dn.setLatLngs([]);glow.setLatLngs([]);plan.setLatLngs([]);home2.setLatLngs([]);}}
function init(g){G=g;css();box=document.getElementById('map').parentNode;el=document.createElement('div');el.id='lmap';box.appendChild(el);try{mkBar();}catch(e){}}
window.KM={init:init,update:update,setLevel:function(k){if(map)setLevel(k);}};
})();
