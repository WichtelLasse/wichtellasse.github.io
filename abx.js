(function(){"use strict";
var $=function(s,r){return(r||document).querySelector(s)};
var tabs=$('.tabs');if(!tabs||!window.WL)return;
var anchor=$('#p-kugel');
function addTab(id,label){var b=document.createElement('button');b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.dataset.p=id;b.textContent=label;tabs.appendChild(b);b.onclick=function(){var g0=tabs.querySelector('button[data-p=garage]');if(g0)g0.click();tabs.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false');});document.querySelectorAll('.pane').forEach(function(q){q.hidden=q.id!=='p-'+id;});};var p=document.createElement('div');p.className='pane';p.id='p-'+id;p.hidden=true;(anchor||document.querySelector('main .wrap')).parentNode.insertBefore(p,null);return p;}
var st=document.createElement('style');st.textContent='.qopt{display:block;width:100%;text-align:left;margin:8px 0;padding:13px 16px;border-radius:14px;border:1px solid var(--line);background:#ffffff0d;color:var(--ice);font:700 1rem var(--font);cursor:pointer}.qopt:disabled{cursor:default}.qopt.ok{background:#2ecf8a;color:#06281a;border-color:#2ecf8a}.qopt.no{background:#e0545b;color:#fff;border-color:#e0545b}.qbar{height:8px;background:#ffffff1a;border-radius:99px;overflow:hidden;margin:6px 0 14px}.qbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--mint));width:0;transition:width .4s}.qfact{margin-top:10px;font-weight:600;opacity:.9;min-height:2.6em}.qbig{font-size:1.25rem;font-weight:800;line-height:1.35}';document.head.appendChild(st);
function watch(p,on,off){var was=!p.hidden;new MutationObserver(function(){var now=!p.hidden;if(now&&!was)on();if(!now&&was)off();was=now;}).observe(p,{attributes:true,attributeFilter:['hidden']});}
var QS=[
['Wie heisst die Hauptstadt der Schweiz?',['Bern','Zürich','Genf','Basel'],0,'Bern ist die Bundesstadt. Viele denken an Zürich, aber dort ist nur die grösste Stadt.'],
['Welches Tier zieht in der Weihnachtsgeschichte den Schlitten?',['Pferd','Rentier','Esel','Husky'],1,'Rentiere sind Hirsche, die im hohen Norden leben.'],
['Worauf liegt der geografische Nordpol?',['Auf einer Insel','Auf Festland','Auf treibendem Meereis','Auf einem Berg'],2,'Am Nordpol gibt es kein Land, nur Eis über dem Meer.'],
['Wie nennt man die tanzenden Lichter am Nachthimmel im Norden?',['Sternschnuppen','Polarlicht','Blitze','Glühwürmchen'],1,'Polarlichter entstehen, wenn Teilchen der Sonne auf die Luft treffen.'],
['Welches Tier lebt am Südpol, aber nicht am Nordpol?',['Eisbär','Walross','Pinguin','Polarfuchs'],2,'Pinguine leben im Süden. Eisbären nur im Norden.'],
['Wie viele Arme hat ein typischer Schneekristall?',['4','5','6','8'],2,'Schneekristalle haben sechs Arme, keine zwei sind genau gleich.'],
['Welche Note ist in der Schweiz die beste?',['1','6','10','5.5'],1,'In der Schweiz ist die 6 die beste und die 1 die schlechteste Note.'],
['Welches Gewürz passt zu Milchreis?',['Zimt','Pfeffer','Curry','Paprika'],0,'Milchreis mit Zimt und Zucker ist ein Klassiker.'],
['Welcher Kontinent ist am kältesten?',['Europa','Asien','Antarktis','Australien'],2,'In der Antarktis wurden schon unter minus 89 Grad gemessen.'],
['Bei wie vielen Grad Celsius gefriert Wasser?',['0','10','-10','5'],0,'Bei 0 Grad wird aus Wasser Eis.'],
['Was ist die Hauptstadt von Norwegen?',['Bergen','Oslo','Stockholm','Helsinki'],1,'Oslo hat ein Opernhaus, das wie ein Eisberg aussieht.'],
['In welcher Stadt steht das Kolosseum?',['Paris','Athen','Rom','Madrid'],2,'Das Kolosseum in Rom ist fast 2000 Jahre alt.'],
['In welchem Land stehen die Pyramiden von Gizeh?',['Ägypten','Mexiko','Peru','Indien'],0,'Die Pyramiden von Gizeh stehen bei Kairo in Ägypten.'],
['Wie heisst der höchste Berg der Welt?',['Matterhorn','Mount Everest','Mont Blanc','Kilimandscharo'],1,'Der Mount Everest ist rund 8849 Meter hoch.'],
['Welches Tier hält im Winter einen langen Winterschlaf?',['Murmeltier','Wolf','Fuchs','Hirsch'],0,'Murmeltiere schlafen im Bau bis zu sechs Monate.'],
['Wie nennt man die Zeit vor Weihnachten?',['Fasnacht','Advent','Ostern','Herbst'],1,'Advent heisst Ankunft. Er beginnt vier Sonntage vor Weihnachten.'],
['Wie viele Kerzen hat ein Adventskranz?',['3','4','5','6'],1,'Jeden Sonntag im Advent kommt eine Kerze dazu.'],
['Wie viele Tage hat der Dezember?',['28','30','31','29'],2,'Der Dezember hat 31 Tage, wie Januar, März, Mai, Juli, August und Oktober.'],
['Woraus bauen Menschen in der Arktis traditionell ein Iglu?',['Holz','Schneeblöcken','Stein','Fell'],1,'Ein Iglu aus Schnee hält erstaunlich warm.'],
['Wie heisst ein junges Rentier?',['Kalb','Fohlen','Lamm','Welpe'],0,'Rentierkälber können schon nach wenigen Stunden laufen.'],
['Welches Raubtier mit weissem Fell lebt in der Arktis?',['Eisbär','Tiger','Löwe','Wolfsfuchs'],0,'Der Eisbär ist das grösste Landraubtier der Welt.'],
['Welcher Ozean liegt rund um den Nordpol?',['Atlantik','Pazifik','Nordpolarmeer','Indischer Ozean'],2,'Das Nordpolarmeer ist der kleinste und flachste Ozean.'],
['Welche Farbe hat die Mütze eines Wichtels meistens?',['Grün','Blau','Rot','Gelb'],2,'Rote Zipfelmützen tragen fast alle Wichtel.']];
var qp=addTab('quiz','🧠 Quiz');var qs=null;
function quizStart(){var pool=QS.map(function(q,i){return i;}).sort(function(){return Math.random()-.5;}).slice(0,8);qs={ids:pool,i:0,ok:0,done:false};quizRender();}
function quizRender(){var b=WL.g('wl_quizbest',0);var h='<div class="cvbox" style="max-width:520px">';
 if(!qs){h+='<p class="qbig">Wichtel-Quiz</p><p style="margin:8px 0 14px">Acht Fragen über Nordpol, Schnee und Wichtel. Jede richtige Antwort gibt 2 ⭐, und bei allen richtig gibt es 5 ⭐ extra.</p><button class="btn" id="qgo">Los geht’s</button><p class="note">Dein Rekord: '+b+' von 8 richtig</p>';}
 else if(qs.done){var star=qs.ok*2+(qs.ok===8?5:0);h+='<p class="qbig">'+qs.ok+' von 8 richtig!</p><p style="margin:8px 0">'+(qs.ok===8?'Perfekt, alle richtig! 🏆':qs.ok>=5?'Stark gemacht! 🎉':'Gut geübt, versuch es nochmal! ❄️')+'</p><p class="out">+'+star+' ⭐ gutgeschrieben</p><div class="row"><button class="btn" id="qgo">Nochmal</button></div>';}
 else{var q=QS[qs.ids[qs.i]];h+='<div class="qbar"><i style="width:'+(qs.i/8*100)+'%"></i></div><p class="note" style="margin:0 0 6px">Frage '+(qs.i+1)+' von 8</p><p class="qbig">'+q[0]+'</p>';q[1].forEach(function(o,k){h+='<button class="qopt" data-k="'+k+'">'+o+'</button>';});h+='<p class="qfact" id="qf"></p><div class="row"><button class="btn" id="qnext" hidden>Weiter</button></div>';}
 qp.innerHTML=h+'</div>';
 var go=qp.querySelector('#qgo');if(go)go.onclick=quizStart;
 qp.querySelectorAll('.qopt').forEach(function(btn){btn.onclick=function(){var q=QS[qs.ids[qs.i]],k=+btn.dataset.k;qp.querySelectorAll('.qopt').forEach(function(x,j){x.disabled=true;if(j===q[2])x.classList.add('ok');else if(j===k)x.classList.add('no');});if(k===q[2]){qs.ok++;if(WL.sfx)WL.sfx('star');}qp.querySelector('#qf').textContent=(k===q[2]?'Richtig! ':'Leider nicht. ')+q[3];var nx=qp.querySelector('#qnext');nx.hidden=false;nx.textContent=qs.i===7?'Ergebnis':'Weiter';nx.onclick=function(){qs.i++;if(qs.i>=8){qs.done=true;var s=qs.ok*2+(qs.ok===8?5:0);WL.add(s);if(qs.ok>WL.g('wl_quizbest',0))WL.s('wl_quizbest',qs.ok);}quizRender();};};});}
watch(qp,function(){qs=null;quizRender();},function(){});
var sp=addTab('duell','❄️ Schneeball');
sp.innerHTML='<div class="cvbox"><canvas id="scv" width="360" height="520"></canvas><div class="row"><span class="starbar">🎯 <span id="sh">0</span> Treffer</span><span class="starbar">❤️ <span id="sl">3</span></span><span class="starbar">⏱️ <span id="st">40</span> s</span></div><p class="note">Zieh den Finger oder die Maus links und rechts, um auszuweichen. Dein Schneeball fliegt von allein. Triff Lasse so oft du kannst!</p></div>';
var cv=$('#scv'),g=cv.getContext('2d'),W=360,H=520,raf=0,run=0,over=0;
var P,L,balls,mine,t0,last,hits,lives,tl,fire,thr,dz,msg,px;
function ptr(e){var r=cv.getBoundingClientRect();return (e.clientX-r.left)*W/r.width;}
cv.style.touchAction='none';cv.style.maxWidth='100%';
cv.addEventListener('pointermove',function(e){if(run)px=Math.max(24,Math.min(W-24,ptr(e)));});
cv.addEventListener('pointerdown',function(e){if(!run){duelStart();return;}px=Math.max(24,Math.min(W-24,ptr(e)));});
function duelStart(){px=W/2;L={x:W/2,dir:1,s:70};balls=[];mine=[];hits=0;lives=3;tl=40;fire=0;thr=1;dz=0;msg='';t0=performance.now();last=t0;run=1;over=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(duelTick);}
function duelStop(){run=0;cancelAnimationFrame(raf);}
function hud(){$('#sh').textContent=hits;$('#sl').textContent=lives;$('#st').textContent=Math.max(0,Math.ceil(tl));}
function drawLasse(x,y,d){g.save();g.translate(x,y);g.rotate(d>0?Math.sin(d*18)*.25:0);g.fillStyle='#3a5d9e';g.fillRect(-16,6,32,30);g.fillStyle='#f3c9a0';g.beginPath();g.arc(0,-4,14,0,7);g.fill();g.fillStyle='#c8232a';g.beginPath();g.moveTo(-15,-8);g.quadraticCurveTo(0,-42,17,-10);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(-15,-10,32,5);g.beginPath();g.arc(18,-12,5,0,7);g.fill();g.fillStyle='#222';if(d>0){g.fillText('x',-7,0);g.fillText('x',3,0);}else{g.fillRect(-6,-5,3,3);g.fillRect(3,-5,3,3);}g.restore();}
function drawMe(x,y){g.save();g.translate(x,y);g.fillStyle='#2d6bd1';g.fillRect(-14,2,28,28);g.fillStyle='#f3c9a0';g.beginPath();g.arc(0,-8,12,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(0,-16,11,Math.PI,0);g.fill();g.fillStyle='#222';g.fillRect(-5,-9,3,3);g.fillRect(3,-9,3,3);g.restore();}
function ball(x,y,c){g.fillStyle=c;g.beginPath();g.arc(x,y,8,0,7);g.fill();g.strokeStyle='#9bb8d9';g.lineWidth=1.5;g.stroke();}
function duelTick(now){if(!run)return;var dt=Math.min(.05,(now-last)/1000);last=now;tl=40-(now-t0)/1000;
 var sp=70+(40-tl)*3.2;L.x+=L.dir*sp*dt;if(L.x>W-30){L.x=W-30;L.dir=-1;}if(L.x<30){L.x=30;L.dir=1;}if(Math.random()<dt*.5)L.dir*=-1;if(dz>0)dz-=dt;
 fire-=dt;if(fire<=0){fire=.4;mine.push({x:px,y:455});}
 thr-=dt;if(thr<=0){thr=Math.max(.45,1.0-(40-tl)*.014);var aim=px+(Math.random()-.5)*90;balls.push({x:L.x,y:70,vx:(aim-L.x)/1.1,vy:300+(40-tl)*3});}
 mine.forEach(function(b){b.y-=420*dt;});mine=mine.filter(function(b){if(b.y<75&&Math.abs(b.x-L.x)<26&&dz<=0){hits++;dz=.5;if(window.WL&&WL.sfx)WL.sfx('click');return false;}return b.y>0;});
 balls.forEach(function(b){b.x+=b.vx*dt;b.y+=b.vy*dt;});balls=balls.filter(function(b){if(b.y>440&&b.y<490&&Math.abs(b.x-px)<20){lives--;msg='Aua!';setTimeout(function(){msg='';},500);return false;}return b.y<H+10&&b.x>-10&&b.x<W+10;});
 g.clearRect(0,0,W,H);var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#16315e');gr.addColorStop(1,'#cfe3f5');g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='#eaf4ff';g.fillRect(0,480,W,40);
 for(var i=0;i<14;i++){g.fillStyle='rgba(255,255,255,.55)';g.fillRect((i*83+now/40)%W,(i*57+now/25)%470,2,2);}
 drawLasse(L.x,60,dz);drawMe(px,455);mine.forEach(function(b){ball(b.x,b.y,'#fff');});balls.forEach(function(b){ball(b.x,b.y,'#e9f6ff');});
 if(msg){g.fillStyle='#fff';g.font='800 22px system-ui';g.fillText(msg,px-24,430);}hud();
 if(lives<=0||tl<=0){run=0;over=1;var s=hits+(lives===3?3:0);WL.add(s);if(hits>WL.g('wl_duel',0))WL.s('wl_duel',hits);
  g.fillStyle='rgba(5,10,26,.72)';g.fillRect(0,0,W,H);g.fillStyle='#fff';g.textAlign='center';g.font='800 28px system-ui';g.fillText(lives<=0?'Getroffen!':'Zeit um!',W/2,210);g.font='700 20px system-ui';g.fillText(hits+' Treffer · +'+s+' ⭐',W/2,250);g.font='600 16px system-ui';g.fillText('Rekord: '+WL.g('wl_duel',0)+' · Tippen für nochmal',W/2,285);g.textAlign='left';return;}
 raf=requestAnimationFrame(duelTick);}
function idle(){g.clearRect(0,0,W,H);var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#16315e');gr.addColorStop(1,'#cfe3f5');g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='#eaf4ff';g.fillRect(0,480,W,40);drawLasse(W/2,60,0);drawMe(W/2,455);g.fillStyle='#fff';g.textAlign='center';g.font='800 26px system-ui';g.fillText('Schneeball-Duell',W/2,200);g.font='600 16px system-ui';g.fillText('Tippen zum Starten',W/2,235);g.fillText('Weiche aus und triff Lasse!',W/2,262);g.textAlign='left';}
watch(sp,function(){idle();},function(){duelStop();});
idle();
var lead=$('.lead');if(lead)lead.textContent=lead.textContent.replace('Sechs kleine Spiele','Acht kleine Spiele');
})();
