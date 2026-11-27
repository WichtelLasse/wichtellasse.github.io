(function(){"use strict";
function g(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}}
function s(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
var SK=[
{id:'classic',n:'Klassik',p:0,b:'#b5282f',t:'#ffd27a',h:'#c8232a',tr:'#e8f6ff',d:'Der gute alte Wichtelschlitten.'},
{id:'gold',n:'Goldschlitten',p:30,b:'#d9a520',t:'#fff0a0',h:'#c8232a',tr:'#ffd27a',d:'Glänzt sogar im Dunkeln.'},
{id:'deer',n:'Rentier-Express',p:60,b:'#7a4a2a',t:'#e9c9a0',h:'#5a3a22',tr:'#d9b48a',x:'antlers',d:'Mit Geweih und Schwung.'},
{id:'rocket',n:'Raketen-Schlitten',p:100,b:'#9aa7bd',t:'#ff6b3a',h:'#2d6bd1',tr:'#ffb347',x:'rocket',d:'Raketenantrieb, Achtung heiss!'},
{id:'rainbow',n:'Regenbogen-Flitzer',p:150,b:'#8a5cff',t:'#ffffff',h:'#ff4fa8',tr:'rainbow',x:'rainbow',d:'Hinterlässt eine Regenbogenspur.'}];
var tt=0;
function toast(m){var el=document.getElementById('wl-toast');if(!el){el=document.createElement('div');el.id='wl-toast';el.style.cssText='position:fixed;left:50%;top:78px;transform:translateX(-50%) translateY(-20px);background:#0a122bee;border:1px solid #ffd27a;color:#fff;padding:8px 18px;border-radius:999px;font:800 1rem system-ui;z-index:300;opacity:0;transition:.3s;pointer-events:none';document.body.appendChild(el);}
el.textContent=m;el.style.opacity=1;el.style.transform='translateX(-50%) translateY(0)';clearTimeout(tt);tt=setTimeout(function(){el.style.opacity=0;el.style.transform='translateX(-50%) translateY(-20px)';},2200);}
var AC=null;
function muted(){return g('wl_mute',false);}
function tone(f,d,ty,v,at){try{if(muted())return;AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();var o=AC.createOscillator(),gn=AC.createGain(),t0=AC.currentTime+(at||0);o.type=ty||'sine';o.frequency.value=f;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(v||.12,t0+.01);gn.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(gn);gn.connect(AC.destination);o.start(t0);o.stop(t0+d+.05);}catch(e){}}
function sfx(k){if(k==='star'){tone(988,.18,'triangle',.1);tone(1319,.3,'triangle',.1,.09);}else if(k==='buy'){tone(523,.15,'square',.06);tone(659,.15,'square',.06,.1);tone(784,.3,'square',.06,.2);}else if(k==='click'){tone(600,.05,'square',.04);}}
function muteBtn(){if(document.getElementById('wl-mute'))return;var b=document.createElement('button');b.id='wl-mute';b.setAttribute('aria-label','Ton an/aus');b.style.cssText='position:fixed;right:12px;bottom:12px;width:44px;height:44px;border-radius:50%;border:1px solid #ffd27a;background:#0a122bee;color:#fff;font-size:20px;z-index:300;cursor:pointer';function r(){b.textContent=muted()?'🔇':'🔊';}r();b.onclick=function(){s('wl_mute',!muted());r();if(!muted())sfx('click');};document.body.appendChild(b);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',muteBtn);else muteBtn();
var WL={SK:SK,sfx:sfx,muted:muted,toast:toast,g:g,s:s,
stars:function(){return g('wl_stars',0);},
add:function(n){n=Math.round(n);if(n<=0)return;s('wl_stars',g('wl_stars',0)+n);toast('⭐ +'+n+' Sterne');sfx('star');},
spend:function(n){var c=g('wl_stars',0);if(c<n)return false;s('wl_stars',c-n);return true;},
owned:function(){var o=g('wl_owned',['classic']);return o;},
buy:function(id){var k=SK.filter(function(x){return x.id===id})[0];if(!k)return false;var o=WL.owned();if(o.indexOf(id)>=0)return true;if(!WL.spend(k.p))return false;o.push(id);s('wl_owned',o);sfx('buy');return true;},
skin:function(){var id=g('wl_skin','classic'),k=SK.filter(function(x){return x.id===id})[0]||SK[0];if(WL.owned().indexOf(k.id)<0)return SK[0];return k;},
use:function(id){if(WL.owned().indexOf(id)>=0){s('wl_skin',id);return true;}return false;},
trail:function(k,t){return k.tr==='rainbow'?'hsl('+((t*180)%360)+',100%,65%)':k.tr;},
drawSled:function(g2,x,y,tilt,k,now){k=k||WL.skin();var t=(now||0)/1000;g2.save();g2.translate(x,y);g2.rotate(Math.max(-.3,Math.min(.3,tilt*.05)));
if(k.x==='rocket'){g2.fillStyle='rgba(255,'+(140+Math.sin(t*30)*40)+',40,.9)';g2.beginPath();g2.moveTo(-8,22);g2.lineTo(0,46+Math.sin(t*40)*6);g2.lineTo(8,22);g2.closePath();g2.fill();}
g2.fillStyle='#3d2a18';g2.fillRect(-22,18,44,4);g2.strokeStyle='#cfd8e8';g2.lineWidth=3;g2.lineCap='round';g2.beginPath();g2.moveTo(-24,26);g2.lineTo(24,26);g2.quadraticCurveTo(32,26,30,16);g2.stroke();
if(k.x==='antlers'){g2.strokeStyle='#e9c9a0';g2.lineWidth=3;[-1,1].forEach(function(s){g2.beginPath();g2.moveTo(s*14,2);g2.lineTo(s*20,-12);g2.moveTo(s*18,-6);g2.lineTo(s*26,-10);g2.moveTo(s*20,-12);g2.lineTo(s*22,-20);g2.stroke();});}
g2.fillStyle=k.b;g2.beginPath();g2.moveTo(-22,4);g2.lineTo(22,4);g2.lineTo(18,20);g2.lineTo(-18,20);g2.closePath();g2.fill();g2.fillStyle=k.t;g2.fillRect(-18,8,36,3);
if(k.x==='rocket'){g2.fillStyle='#ff6b3a';g2.beginPath();g2.moveTo(22,4);g2.lineTo(34,14);g2.lineTo(22,20);g2.closePath();g2.fill();}
g2.fillStyle='#f3c9a0';g2.beginPath();g2.arc(0,-4,9,0,6.3);g2.fill();g2.fillStyle=k.h;g2.beginPath();g2.moveTo(-10,-6);g2.quadraticCurveTo(0,-28,12,-8);g2.closePath();g2.fill();g2.fillStyle='#fff';g2.fillRect(-10,-8,22,4);g2.beginPath();g2.arc(13,-9,3.5,0,6.3);g2.fill();g2.fillStyle='#222';g2.fillRect(-4,-5,2,2);g2.fillRect(3,-5,2,2);g2.restore();}
};
window.WL=WL;
})();
