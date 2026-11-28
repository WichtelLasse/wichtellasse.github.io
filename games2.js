(function(){"use strict";
var $=function(s,r){return(r||document).querySelector(s);};
var tabs=$('.tabs'),memPane=$('#p-mem');if(!tabs||!memPane)return;
var host=memPane.parentNode;
function st(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function stars(n){try{if(window.WL&&n>0)WL.add(n);}catch(e){}}
function sound(f,d,ty,v){try{if(window.WL&&WL.muted&&WL.muted())return;var A=sound.A=sound.A||new(window.AudioContext||window.webkitAudioContext)();if(A.state==='suspended')A.resume();var o=A.createOscillator(),g=A.createGain(),t=A.currentTime;o.type=ty||'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v||.12,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(A.destination);o.start(t);o.stop(t+d+.05);}catch(e){}}
var active=null;
function addTab(id,label,onShow){
 var b=document.createElement('button');b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.dataset.p=id;b.textContent=label;tabs.appendChild(b);
 var p=document.createElement('div');p.className='pane';p.id='p-'+id;p.hidden=true;host.appendChild(p);
 b.addEventListener('click',function(){
  [].forEach.call(document.querySelectorAll('.tabs button'),function(x){x.setAttribute('aria-selected',x===b?'true':'false');});
  [].forEach.call(document.querySelectorAll('.pane'),function(x){x.hidden=x!==p;});
  active=id;if(onShow)onShow(p);
 });
 return p;}
[].forEach.call(document.querySelectorAll('.tabs button'),function(b){if(!b.dataset.p||!/^(f2048|reindeer|bells|ice)$/.test(b.dataset.p))b.addEventListener('click',function(){active=null;});});
function hud(items){return'<div class="memtop" style="margin-bottom:10px">'+items.join('')+'</div>';}
var BTN='border:0;border-radius:999px;padding:12px 26px;font:800 1rem var(--font);background:var(--gold);color:var(--ink);cursor:pointer';

/* ---------- 1) Flocken-Fusion (2048) ---------- */
(function(){
 var p=addTab('f2048','🔢 Fusion');var N=4,g,score,best=st('wl_f2048',0),over,won;
 p.innerHTML=hud(['<span>Punkte: <b id="fu-s">0</b></span>','<span>🏆 <b id="fu-b">'+best+'</b></span>'])+'<div class="stage" id="fu-st" style="touch-action:none"><div id="fu-g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#0b1633;border:1px solid var(--line);border-radius:18px;padding:8px"></div><div class="ov hide" id="fu-ov"><h3 id="fu-t"></h3><p id="fu-p"></p><button class="btn" id="fu-go">Nochmal</button></div></div><p class="keys">Wische oder nutze die Pfeiltasten. Gleiche Zahlen verschmelzen. Erreiche 1024, den Nordstern!</p>';
 var col={0:'#ffffff10',2:'#dff1ff',4:'#b9e0ff',8:'#8fcdfd',16:'#5db5f7',32:'#3d96e8',64:'#6a7cf0',128:'#9a6af0',256:'#d86af0',512:'#f06aa8',1024:'#ffb347',2048:'#ffd27a'};
 function draw(){var h='';for(var r=0;r<N;r++)for(var c=0;c<N;c++){var v=g[r][c];h+='<div style="aspect-ratio:1;border-radius:12px;display:grid;place-items:center;font:900 '+(v>=1000?'1.2':v>=100?'1.5':'1.9')+'rem var(--font);color:'+(v&&v<=16?'#0b1633':'#fff')+';background:'+(col[v]||'#ffd27a')+'">'+(v?v:'')+'</div>';}
  $('#fu-g',p).innerHTML=h;$('#fu-s',p).textContent=score;$('#fu-b',p).textContent=best;}
 function add(){var e=[];for(var r=0;r<N;r++)for(var c=0;c<N;c++)if(!g[r][c])e.push([r,c]);if(!e.length)return;var x=e[Math.floor(Math.random()*e.length)];g[x[0]][x[1]]=Math.random()<.88?2:4;}
 function reset(){g=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];score=0;over=false;won=false;add();add();$('#fu-ov',p).classList.add('hide');draw();}
 function line(a){var b=a.filter(Boolean),o=[];for(var i=0;i<b.length;i++){if(b[i]===b[i+1]){o.push(b[i]*2);score+=b[i]*2;i++;}else o.push(b[i]);}while(o.length<N)o.push(0);return o;}
 function move(d){if(over)return;var old=JSON.stringify(g),r,c,a;
  if(d==='L'||d==='R'){for(r=0;r<N;r++){a=g[r].slice();if(d==='R')a.reverse();a=line(a);if(d==='R')a.reverse();g[r]=a;}}
  else{for(c=0;c<N;c++){a=[];for(r=0;r<N;r++)a.push(g[r][c]);if(d==='D')a.reverse();a=line(a);if(d==='D')a.reverse();for(r=0;r<N;r++)g[r][c]=a[r];}}
  if(JSON.stringify(g)===old)return;sound(440+Math.min(score,2000)/8,.08,'triangle',.07);add();if(score>best){best=score;sv('wl_f2048',best);}draw();
  var max=0,can=false;for(r=0;r<N;r++)for(c=0;c<N;c++){max=Math.max(max,g[r][c]);if(!g[r][c]||(c<3&&g[r][c]===g[r][c+1])||(r<3&&g[r][c]===g[r+1][c]))can=true;}
  if(max>=1024&&!won){won=true;over=true;stars(25);fin('Nordstern erreicht!','Wahnsinn, 1024! Du bist ein echter Wichtel-Mathematiker.');return;}
  if(!can){over=true;stars(Math.round(score/150));fin('Das Brett ist voll','Du hast '+score+' Punkte geschafft.');}}
 function fin(t,m){$('#fu-t',p).textContent=t;$('#fu-p',p).textContent=m;$('#fu-ov',p).classList.remove('hide');}
 $('#fu-go',p).onclick=reset;
 var sx,sy;var s=$('#fu-st',p);
 s.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
 s.addEventListener('touchend',function(e){var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))move(dx>0?'R':'L');else move(dy>0?'D':'U');},{passive:true});
 s.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
 document.addEventListener('keydown',function(e){if(active!=='f2048')return;var m={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',a:'L',d:'R',w:'U',s:'D'}[e.key];if(m){e.preventDefault();move(m);}});
 reset();
})();

/* ---------- 2) Rentier-Flug ---------- */
(function(){
 var p=addTab('reindeer','🦌 Rentier-Flug');var best=st('wl_reindeer',0);
 p.innerHTML='<div class="stage"><canvas id="rd" width="360" height="560"></canvas><div class="hudbar"><span class="pill">🌲 <b id="rd-s">0</b></span><span class="pill">🏆 <b id="rd-b">'+best+'</b></span></div><div class="ov" id="rd-ov"><h3>Rentier-Flug</h3><p>Tippe, damit das Rentier flattert. Fliege durch die Lücken zwischen den Eiszapfen. Das wird schwer!</p><button class="btn" id="rd-go">Los</button></div></div><p class="keys">Handy: tippen · Computer: Leertaste oder Klick</p>';
 var cv=$('#rd',p),g=cv.getContext('2d'),W=360,H=560,y=260,vy=0,pipes=[],sc=0,run=false,raf,last,t0;
 function reset(){y=260;vy=0;pipes=[];sc=0;run=true;last=performance.now();t0=last;$('#rd-s',p).textContent=0;spawn(520);$('#rd-ov',p).classList.add('hide');cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
 function spawn(x){var gap=Math.max(128,175-sc*2.2);pipes.push({x:x,gy:90+Math.random()*(H-180-gap),gap:gap,ok:false});}
 function flap(){if(!run)return;vy=-6.4;sound(620,.07,'square',.04);}
 function die(){run=false;var nb=sc>best;if(nb){best=sc;sv('wl_reindeer',best);$('#rd-b',p).textContent=best;}stars(Math.round(sc/2));var o=$('#rd-ov',p);o.querySelector('h3').textContent=sc>=20?'Unglaublich!':'Autsch!';o.querySelector('p').textContent=sc+' Eiszapfen-Lücken geschafft.'+(nb&&sc?' Neuer Rekord!':'');o.querySelector('.btn').textContent='Nochmal';o.classList.remove('hide');}
 function loop(n){var dt=Math.min(2,(n-last)/16.67);last=n;
  vy+=.36*dt;y+=vy*dt;var sp=(2.3+Math.min(sc*.04,1.4))*dt;
  pipes.forEach(function(q){q.x-=sp;if(!q.ok&&q.x+44<90){q.ok=true;sc++;$('#rd-s',p).textContent=sc;sound(880,.1,'triangle',.06);}});
  if(pipes.length&&pipes[0].x<-60)pipes.shift();if(pipes[pipes.length-1].x<W-210)spawn(W+30);
  var hit=y<12||y>H-14;pipes.forEach(function(q){if(90+13>q.x&&90-13<q.x+44&&(y-11<q.gy||y+11>q.gy+q.gap))hit=true;});
  draw(n);if(hit){die();return;}if(active==='reindeer'&&!p.hidden)raf=requestAnimationFrame(loop);else run=false;}
 function draw(n){var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#0b1633');gr.addColorStop(1,'#1c3c6e');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.fillStyle='#ffffff55';for(var i=0;i<30;i++){g.fillRect((i*83+n*.01*(i%3+1))%W,(i*47)%H,2,2);}
  pipes.forEach(function(q){g.fillStyle='#cfe9ff';g.fillRect(q.x,0,44,q.gy);g.fillRect(q.x,q.gy+q.gap,44,H);g.fillStyle='#9fd0f5';g.beginPath();g.moveTo(q.x-4,q.gy);g.lineTo(q.x+48,q.gy);g.lineTo(q.x+22,q.gy+22);g.closePath();g.fill();g.beginPath();g.moveTo(q.x-4,q.gy+q.gap);g.lineTo(q.x+48,q.gy+q.gap);g.lineTo(q.x+22,q.gy+q.gap-22);g.closePath();g.fill();});
  g.fillStyle='#f4f8ff';g.fillRect(0,H-12,W,12);
  g.save();g.translate(90,y);g.rotate(Math.max(-.5,Math.min(.9,vy*.07)));
  g.strokeStyle='#e9c9a0';g.lineWidth=3;g.beginPath();g.moveTo(-3,-9);g.lineTo(-8,-22);g.moveTo(-6,-16);g.lineTo(-14,-18);g.moveTo(5,-9);g.lineTo(9,-22);g.moveTo(7,-16);g.lineTo(15,-18);g.stroke();
  g.fillStyle='#8b5a32';g.beginPath();g.ellipse(0,0,15,11,0,0,6.3);g.fill();g.fillStyle='#e9c9a0';g.beginPath();g.ellipse(4,3,8,6,0,0,6.3);g.fill();
  g.fillStyle='#e0383e';g.beginPath();g.arc(15,0,4.5,0,6.3);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(7,-4,2.6,0,6.3);g.fill();g.fillStyle='#000';g.beginPath();g.arc(8,-4,1.2,0,6.3);g.fill();
  g.restore();}
 $('#rd-go',p).onclick=function(){reset();};
 cv.addEventListener('pointerdown',function(e){e.preventDefault();flap();});
 document.addEventListener('keydown',function(e){if(active==='reindeer'&&(e.code==='Space'||e.key==='ArrowUp')){e.preventDefault();if(run)flap();}});
 draw(0);
})();

/* ---------- 3) Glockenspiel (Simon) ---------- */
(function(){
 var p=addTab('bells','🔔 Glockenspiel');var best=st('wl_bells',0),seq=[],pos=0,busy=true,round=0;
 var F=[392,494,587,784],C=['#e0383e','#3ab36a','#3d96e8','#ffd27a'];
 p.innerHTML=hud(['<span>Runde: <b id="bl-r">0</b></span>','<span>🏆 <b id="bl-b">'+best+'</b></span>'])+'<div class="stage" style="max-width:340px"><div id="bl-g" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></div></div><div class="memmsg" id="bl-m" aria-live="polite">Merke dir die Reihenfolge der Glocken.</div><div style="text-align:center"><button id="bl-go" style="'+BTN+'">Start</button></div>';
 var gr=$('#bl-g',p);for(var i=0;i<4;i++){var b=document.createElement('button');b.dataset.i=i;b.setAttribute('aria-label','Glocke '+(i+1));b.style.cssText='aspect-ratio:1;border:0;border-radius:24px;background:'+C[i]+';opacity:.55;font-size:2.6rem;cursor:pointer;transition:.12s;-webkit-tap-highlight-color:transparent';b.textContent='🔔';gr.appendChild(b);}
 var bs=gr.children;
 function lit(i,d){bs[i].style.opacity=1;bs[i].style.transform='scale(1.06)';bs[i].style.boxShadow='0 0 30px '+C[i];sound(F[i],.35,'triangle',.14);setTimeout(function(){bs[i].style.opacity=.55;bs[i].style.transform='';bs[i].style.boxShadow='';},d||300);}
 function play(){busy=true;$('#bl-m',p).textContent='Hör gut zu…';var k=0,d=Math.max(260,520-seq.length*18);var t=setInterval(function(){if(active!=='bells'){clearInterval(t);return;}lit(seq[k],d-90);k++;if(k>=seq.length){clearInterval(t);setTimeout(function(){busy=false;pos=0;$('#bl-m',p).textContent='Du bist dran!';},d);}},d);}
 function next(){seq.push(Math.floor(Math.random()*4));round=seq.length;$('#bl-r',p).textContent=round;setTimeout(play,600);}
 function fail(){var nb=round-1>best;if(nb){best=round-1;sv('wl_bells',best);$('#bl-b',p).textContent=best;}stars(Math.round((round-1)*1.2));$('#bl-m',p).textContent='Falsch! Du hast '+(round-1)+' Runden geschafft.'+(nb&&round>1?' Neuer Rekord!':'');busy=true;sound(150,.5,'sawtooth',.1);$('#bl-go',p).textContent='Nochmal';}
 gr.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||busy)return;var i=+b.dataset.i;lit(i,200);if(i!==seq[pos]){fail();return;}pos++;if(pos===seq.length){busy=true;$('#bl-m',p).textContent='Richtig!';next();}});
 $('#bl-go',p).onclick=function(){seq=[];round=0;this.textContent='Neustart';next();};
})();

/* ---------- 4) Eis-Räumer (Minesweeper) ---------- */
(function(){
 var p=addTab('ice','🧊 Eis-Räumer');var R=9,Cn=9,M=10,best=st('wl_ice',0),cells,first,done,flagMode,t0,tid,flags;
 p.innerHTML=hud(['<span>🚩 <b id="ic-f">10</b></span>','<span>Zeit: <b id="ic-t">0</b>s</span>','<span>🏆 <b id="ic-b">'+(best?best+'s':'–')+'</b></span>'])+'<div class="stage" style="max-width:420px"><div id="ic-g" style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px"></div></div><div class="memmsg" id="ic-m" aria-live="polite">Decke alle Felder ohne Eisklumpen auf. Die Zahl zeigt, wie viele Eisklumpen direkt daneben liegen.</div><div style="text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button id="ic-fl" style="'+BTN+'">Modus: Aufdecken</button><button id="ic-new" style="'+BTN+';background:#ffffff1c;color:var(--ice)">Neues Spiel</button></div><p class="keys">Handy: unten auf «Flagge» umschalten · Computer: Rechtsklick = Flagge</p>';
 var gr=$('#ic-g',p),cols=['','#3d96e8','#3ab36a','#e0383e','#6a4cf0','#b8501e','#13a0a0','#222','#777'];
 function nb(r,c,f){for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;var a=r+dr,b=c+dc;if(a>=0&&b>=0&&a<R&&b<Cn)f(a,b);}}
 function reset(){cells=[];for(var r=0;r<R;r++){cells.push([]);for(var c=0;c<Cn;c++)cells[r].push({m:false,o:false,f:false,n:0});}first=true;done=false;flags=0;flagMode=false;clearInterval(tid);$('#ic-t',p).textContent=0;$('#ic-fl',p).textContent='Modus: Aufdecken';$('#ic-m',p).textContent='Decke alle Felder ohne Eisklumpen auf.';render();}
 function place(r0,c0){var k=0;while(k<M){var r=Math.floor(Math.random()*R),c=Math.floor(Math.random()*Cn);if(cells[r][c].m||(Math.abs(r-r0)<=1&&Math.abs(c-c0)<=1))continue;cells[r][c].m=true;k++;}
  for(var r1=0;r1<R;r1++)for(var c1=0;c1<Cn;c1++){var n=0;nb(r1,c1,function(a,b){if(cells[a][b].m)n++;});cells[r1][c1].n=n;}}
 function open(r,c){var x=cells[r][c];if(x.o||x.f)return;x.o=true;if(!x.m&&x.n===0)nb(r,c,open);}
 function render(){var h='',fc=0;for(var r=0;r<R;r++)for(var c=0;c<Cn;c++){var x=cells[r][c];if(x.f)fc++;var bg=x.o?(x.m?'#e0383e':'#dff1ff'):'#5db5f7',tx='';if(x.o){tx=x.m?'🧊':(x.n?'<span style="color:'+cols[x.n]+'">'+x.n+'</span>':'');}else if(x.f)tx='🚩';
   h+='<button data-r="'+r+'" data-c="'+c+'" style="aspect-ratio:1;border:0;border-radius:8px;background:'+bg+';font:900 1.1rem var(--font);display:grid;place-items:center;padding:0;cursor:pointer;color:#0b1633">'+tx+'</button>';}
  gr.innerHTML=h;$('#ic-f',p).textContent=M-fc;}
 function finish(win){done=true;clearInterval(tid);if(!win){for(var r=0;r<R;r++)for(var c=0;c<Cn;c++)if(cells[r][c].m)cells[r][c].o=true;render();$('#ic-m',p).textContent='Boom! Das war ein Eisklumpen. Versuch es nochmal.';sound(140,.5,'sawtooth',.12);return;}
  var t=Math.round((Date.now()-t0)/1000);var nbst=!best||t<best;if(nbst){best=t;sv('wl_ice',t);$('#ic-b',p).textContent=t+'s';}stars(12);$('#ic-m',p).textContent='Geschafft in '+t+' Sekunden!'+(nbst?' Neuer Rekord!':'');sound(988,.3,'triangle',.1);}
 function tap(r,c,flag){if(done)return;var x=cells[r][c];if(flag||flagMode){if(!x.o){x.f=!x.f;render();}return;}if(x.f||x.o)return;if(first){place(r,c);first=false;t0=Date.now();tid=setInterval(function(){$('#ic-t',p).textContent=Math.round((Date.now()-t0)/1000);},500);}
  if(x.m){x.o=true;finish(false);return;}open(r,c);render();var left=0;for(var a=0;a<R;a++)for(var b=0;b<Cn;b++)if(!cells[a][b].o&&!cells[a][b].m)left++;if(!left)finish(true);}
 gr.addEventListener('click',function(e){var b=e.target.closest('button');if(b)tap(+b.dataset.r,+b.dataset.c,false);});
 gr.addEventListener('contextmenu',function(e){var b=e.target.closest('button');if(b){e.preventDefault();tap(+b.dataset.r,+b.dataset.c,true);}});
 $('#ic-fl',p).onclick=function(){flagMode=!flagMode;this.textContent='Modus: '+(flagMode?'Flagge':'Aufdecken');};
 $('#ic-new',p).onclick=reset;reset();
})();
})();
