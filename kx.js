(function(){"use strict";
var LF=window.LF,KM=window.KM,T=null;if(!LF||!KM||!KM.map)return;
var HOME=[47.4059,8.6822],map=null,rings=null,stops=null,seen={},cur=null;
var $=function(s){return document.querySelector(s)};
var st=document.createElement('style');st.textContent='#ktl{display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap}#ktl button{font:700 .95rem var(--font);padding:9px 14px;border-radius:12px;border:1px solid var(--line);background:#ffffff0d;color:var(--ice);cursor:pointer}#ktl input{flex:1;min-width:140px;accent-color:#ffd27a}#ktl .kt{font-weight:700;font-size:.9rem;min-width:7.5em}.kring{background:none;border:0;color:#ffd27a;font:700 12px system-ui;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap}.kstop{font:600 14px system-ui;color:#10203c;max-width:240px}.kstop img{width:100%;border-radius:8px;margin:6px 0 4px;display:block}.kstop b{font-size:15px}';document.head.appendChild(st);
function fmt(ms){try{return new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));}catch(e){return new Date(ms).toLocaleString();}}
var u0=KM.update;KM.update=function(now,s){cur=s;if(s&&s.ph==='trip'&&s.R){var up=Math.max(0,s.mv?s.i-1:s.i);for(var i=0;i<=up&&i<s.R.length;i++)seen[s.R[i].n]=1;}return u0(now,s);};
var bar=document.createElement('div');bar.id='ktl';
bar.innerHTML='<button type="button" id="ktp">⏱️ Zeitraffer</button><input type="range" id="ktr" hidden><span class="kt" id="ktt" hidden></span><button type="button" id="ktl2" hidden>● Live</button>';
var anchor=document.getElementById('lvbar');
function place(){anchor=document.getElementById('lvbar');if(anchor&&!bar.parentNode){anchor.parentNode.insertBefore(bar,anchor.nextSibling);return true;}return !!bar.parentNode;}
var play=0,iv=0;
function live(){clearInterval(iv);iv=0;delete window.__now;$('#ktr').hidden=true;$('#ktt').hidden=true;$('#ktl2').hidden=true;$('#ktp').textContent='⏱️ Zeitraffer';play=0;}
function setT(v){window.__now=v;$('#ktr').value=v;$('#ktt').textContent=fmt(v);}
function start(){var n=Date.now(),r=$('#ktr');r.min=n-6*3600e3;r.max=n;r.step=60000;r.hidden=false;$('#ktt').hidden=false;$('#ktl2').hidden=false;setT(n-6*3600e3);play=1;$('#ktp').textContent='⏸️ Pause';iv=setInterval(function(){if(!play)return;var v=(window.__now||0)+120000;if(v>=Date.now()){live();return;}setT(v);},100);}
function wire(){$('#ktp').onclick=function(){if(!window.__now&&!iv){start();return;}play=!play;this.textContent=play?'⏸️ Pause':'▶️ Weiter';};
 $('#ktr').oninput=function(){play=0;$('#ktp').textContent='▶️ Weiter';setT(+this.value);};
 $('#ktl2').onclick=live;}
wire();
function addRing(btnBar){
 rings=LF.layerGroup();[100,500,1000,2500].forEach(function(km){
  LF.circle(HOME,{radius:km*1000,color:'#ffd27a',weight:1.5,opacity:.8,fill:false,dashArray:'6 8',interactive:false}).addTo(rings);
  LF.marker([HOME[0]+km/111.19,HOME[1]],{interactive:false,icon:LF.divIcon({className:'kring',html:km+' km von Zuhause',iconSize:[0,0]})}).addTo(rings);});
 rings.addTo(map);
 var on=true,b=document.createElement('button');b.type='button';b.textContent='⭕ Ring';b.onclick=function(){on=!on;if(on)rings.addTo(map);else map.removeLayer(rings);b.style.opacity=on?1:.5;};
 btnBar.appendChild(b);
 function z(){var show=map.getZoom()<=9&&on;if(show&&!map.hasLayer(rings))rings.addTo(map);if(!show&&map.hasLayer(rings))map.removeLayer(rings);}
 map.on('zoomend',z);z();}
function km(a,b){var R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)*Math.sin(dn/2);return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));}
function addStops(){
 T=window.LT;if(!T)return;
 var all=[].concat(T.RN,T.RS,T.RB||[]);T.TRIPS.forEach(function(t){all=all.concat((t[1]&&t[1].R)||[]);});
 var by={};all.forEach(function(p){if(p&&p.n&&p.lat<85&&p.lat>-86&&p.n!=='Volketswil'&&p.n!=='Wichteldorf'&&!by[p.n])by[p.n]=p;});
 stops=LF.layerGroup().addTo(map);
 Object.keys(by).forEach(function(n){var p=by[n];
  var m=LF.circleMarker([p.lat,p.lon],{radius:9,color:'#fff',weight:2,fillColor:'#4aa3ff',fillOpacity:.95,bubblingMouseEvents:false}).addTo(stops);
  m.on('click',function(){m.setStyle({fillColor:seen[n]?'#ffd27a':'#4aa3ff'});var ph=window.KM_ph&&window.KM_ph[n],h='<div class="kstop"><b>'+n+'</b><br>';
   if(ph&&window.KM_img)h+='<img loading="lazy" alt="'+n+'" src="'+window.KM_img(ph[0],500)+'"><div>'+ph[1]+'</div>';
   h+='<div style="margin-top:4px;opacity:.75">'+Math.round(km(HOME,[p.lat,p.lon])).toLocaleString('de-CH').replace(/’/g,"'")+' km von Zuhause</div>'+(seen[n]?'<div style="color:#b07a00;font-weight:700">⭐ Lasse war schon hier</div>':'')+'</div>';
   LF.popup({maxWidth:260}).setLatLng(m.getLatLng()).setContent(h).openOn(map);});
  m.on('add',function(){m.setStyle({fillColor:seen[n]?'#ffd27a':'#4aa3ff'});});});
}
var tries=0,iv2=setInterval(function(){tries++;var ok=place();var mp=KM.map&&KM.map();
 if(mp&&!map&&ok){map=mp;try{addRing(anchor);}catch(e){}try{addStops();}catch(e){}}
 if(map||tries>600)clearInterval(iv2);},1000);
})();
