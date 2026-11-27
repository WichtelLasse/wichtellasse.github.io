(function(){"use strict";
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
function H(el,h){el.innerHTML=h;}
function stars(){$('#wstars').textContent=WL.stars();}
var tabs=$$('.tabs button'),panes=$$('.pane'),fabStop=null;
function show(p){tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.p===p?'true':'false');});panes.forEach(function(x){x.hidden=x.id!=='p-'+p;});if(fabStop)fabStop();if(p==='dorf')dorf();if(p==='schatz')schatz();if(p==='fabrik')fabIdle();try{history.replaceState(null,'','#'+p);}catch(e){}}
tabs.forEach(function(b){b.onclick=function(){show(b.dataset.p);};});
var BD=[['haus','🏠','Haus',5],['tanne','🌲','Tanne',3],['schnee','⛄','Schneemann',4],['laterne','🏮','Laterne',3],['back','🥐','Backstube',8],['stall','🦌','Rentierstall',10],['fabrik','🏭','Spielzeugfabrik',12],['bahn','⛸️','Eisbahn',15],['turm','🗼','Aussichtsturm',20]];
function bd(id){return BD.filter(function(b){return b[0]===id})[0];}
function dv(){var d=WL.g('wl_dorf',null);if(!d||d.length!==9)d=[null,null,null,null,null,null,null,null,null];return d;}
function dorf(){var d=dv(),n=d.filter(Boolean).length,h='<div class="dgrid">';
 d.forEach(function(id,i){var b=id&&bd(id);h+='<button type="button" class="plot'+(b?' on':'')+'" data-i="'+i+'">'+(b?'<span class="pe">'+b[1]+'</span><small>'+b[2]+'</small>':'<span class="pe" style="opacity:.35">＋</span><small>frei</small>')+'</button>';});
 h+='</div><div class="row"><span class="starbar">🏘️ '+n+' von 9 Plätzen</span><button class="btn" id="dcol">⭐ Dorf-Sterne holen</button></div><p class="out" id="dout"></p><div id="dpick"></div><p class="note">Jedes Gebäude bringt dir alle 6 Stunden einen halben Stern. Das Dorf liegt nur auf deinem Gerät.</p>';
 H($('#p-dorf'),h);
 $$('.plot').forEach(function(b){b.onclick=function(){pick(+b.dataset.i);};});
 $('#dcol').onclick=function(){var t=WL.g('wl_dorft',0),now=Date.now(),cnt=dv().filter(Boolean).length;if(!cnt){$('#dout').textContent='Baue zuerst etwas, dann gibt es Sterne.';return;}var steps=Math.floor((now-(t||now-6*3600e3))/(6*3600e3));if(steps<1){var m=Math.ceil(((t||now)+6*3600e3-now)/60000);$('#dout').textContent='Noch '+Math.floor(m/60)+' h '+(m%60)+' min bis zu den nächsten Sternen.';return;}steps=Math.min(steps,4);var s=Math.max(1,Math.round(cnt*.5*steps));WL.s('wl_dorft',now);WL.add(s);stars();$('#dout').textContent='Du hast '+s+' ⭐ geholt.';};}
function pick(i){var d=dv(),el=$('#dpick');if(d[i]){var b=bd(d[i]);H(el,'<div class="cvbox" style="margin-top:12px"><p><b>'+b[1]+' '+b[2]+'</b></p><div class="row"><button class="btn ghost" id="drm">Abreissen</button><button class="btn ghost" id="dno">Zurück</button></div></div>');$('#drm').onclick=function(){d[i]=null;WL.s('wl_dorf',d);dorf();};$('#dno').onclick=function(){H(el,'');};return;}
 var h='<div class="cvbox" style="margin-top:12px"><p class="lbl">Was soll hier hin?</p><div class="row">';BD.forEach(function(b){h+='<button class="chip" data-id="'+b[0]+'">'+b[1]+' '+b[2]+' · '+b[3]+' ⭐</button>';});h+='</div></div>';H(el,h);
 $$('.chip',el).forEach(function(c){c.onclick=function(){var b=bd(c.dataset.id);if(WL.stars()<b[3]){$('#dout').textContent='Dafür fehlen dir noch '+(b[3]-WL.stars())+' ⭐.';return;}if(!WL.spend(b[3]))return;d[i]=b[0];WL.s('wl_dorf',d);if(WL.sfx)WL.sfx('buy');stars();dorf();};});}
var CL=[
['Ich bin ein Turm aus Eisen und stehe an einem Fluss, der Seine heisst.',['Paris','Rom','Wien'],0,'🗼','Paris: Der Eiffelturm ist rund 330 Meter hoch.'],
['Mein Turm steht schief, obwohl er ein Glockenturm ist. Wo bin ich?',['Pisa','Bern','Genf'],0,'🔔','Pisa: Der Turm neigt sich seit Jahrhunderten.'],
['Hier ragen riesige Dreiecke aus Stein in die Wüste, nahe der Stadt Kairo.',['Gizeh','Zermatt','Oslo'],0,'🔺','Gizeh: Die Pyramiden sind über 4000 Jahre alt.'],
['Ein flacher Berg überragt diese Stadt am Südzipfel von Afrika.',['Kapstadt','Nairobi','Kairo'],0,'⛰️','Kapstadt: Der Tafelberg sieht aus wie ein Tisch.'],
['Das Opernhaus mit den weissen Segeln steht am Hafen dieser australischen Stadt.',['Sydney','Perth','Auckland'],0,'🎭','Sydney: Das Dach erinnert an Segel.'],
['Eine grosse Christusstatue breitet ihre Arme über diese Stadt in Brasilien aus.',['Rio de Janeiro','Lima','Havanna'],0,'✝️','Rio de Janeiro: Die Statue steht auf dem Corcovado.'],
['In dieser Stadt Italiens steht das Kolosseum, ein riesiges Rund aus Stein.',['Rom','Venedig','Mailand'],0,'🏛️','Rom: Im Kolosseum gab es früher Spektakel für Tausende.'],
['Auf diesem Berg in Nepal und Tibet stehst du höher als auf jedem anderen Berg der Erde.',['Mount Everest','Matterhorn','Mont Blanc'],0,'🏔️','Mount Everest: rund 8849 Meter hoch.']];
function shuf(a){return a.map(function(x){return[Math.random(),x]}).sort(function(p,q){return p[0]-q[0]}).map(function(x){return x[1]});}
function schatz(){var done=Math.min(CL.length,WL.g('wl_schatz',0)),h='<div class="row" style="gap:6px">';
 CL.forEach(function(c,i){h+='<span class="stp'+(i<done?' on':'')+'" title="'+(i<done?c[4]:'noch zu')+'">'+(i<done?c[3]:'❔')+'</span>';});h+='</div>';
 if(done>=CL.length){h+='<div class="cvbox"><p class="qbig">🏆 Schatz gefunden!</p><p style="margin:8px 0">Du hast alle 8 Orte gelöst.</p><button class="btn ghost" id="sre">Nochmal von vorne (ohne Sterne)</button></div>';H($('#p-schatz'),h);$('#sre').onclick=function(){WL.s('wl_schatz',0);WL.s('wl_schatzr',1);schatz();};return;}
 var c=CL[done],opts=shuf(c[1].map(function(o,k){return{t:o,ok:k===c[2]};}));
 h+='<div class="cvbox" style="margin-top:14px"><p class="note" style="margin:0">Hinweis '+(done+1)+' von 8</p><p class="qbig">'+c[0]+'</p>';
 opts.forEach(function(o){h+='<button class="qopt" data-ok="'+(o.ok?1:0)+'">'+o.t+'</button>';});h+='<p class="qfact" id="sf"></p></div>';
 H($('#p-schatz'),h);
 $$('.qopt').forEach(function(b){b.onclick=function(){if(b.dataset.ok==='1'){$$('.qopt').forEach(function(x){x.disabled=true;});b.classList.add('ok');var rep=WL.g('wl_schatzr',0),s=rep?0:3+(done===CL.length-1?10:0);if(s)WL.add(s);WL.s('wl_schatz',done+1);$('#sf').textContent='Richtig! '+c[4]+(s?' (+'+s+' ⭐)':'');setTimeout(schatz,2600);}else{b.disabled=true;b.classList.add('no');$('#sf').textContent='Das war es nicht. Probier eine andere Antwort.';}};});}
var TY=['🧸','🚂','🎁','🪀','🎨','🪁'],cv=$('#fcv'),g=cv.getContext('2d'),FW=360,FH=300,fr=0,run=0,fs;
function fabIdle(){g.clearRect(0,0,FW,FH);g.fillStyle='#16315e';g.fillRect(0,0,FW,FH);g.fillStyle='#3a3f55';g.fillRect(0,130,FW,70);g.fillStyle='#fff';g.textAlign='center';g.font='800 22px system-ui';g.fillText('Spielzeug-Fliessband',FW/2,70);g.font='600 15px system-ui';g.fillText('Tippen zum Starten',FW/2,100);g.fillText('Bestes Level: '+WL.g('wl_fab',0),FW/2,240);g.textAlign='left';}
fabStop=function(){run=0;cancelAnimationFrame(fr);};
function newTarget(){fs.tg=TY[Math.floor(Math.random()*TY.length)];}
function fabStart(){fs={lvl:1,got:0,lives:3,items:[],sp:0,last:performance.now(),tg:null,fl:0};newTarget();run=1;cancelAnimationFrame(fr);fr=requestAnimationFrame(fabTick);}
cv.style.touchAction='none';
cv.addEventListener('pointerdown',function(e){if(!run){fabStart();return;}var r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*FW/r.width,y=(e.clientY-r.top)*FH/r.height;
 for(var i=fs.items.length-1;i>=0;i--){var it=fs.items[i];if(Math.abs(it.x-x)<26&&Math.abs(it.y-y)<30){fs.items.splice(i,1);if(it.t===fs.tg){fs.got++;fs.fl=.15;if(window.WL&&WL.sfx)WL.sfx('click');if(fs.got>=8){var s=fs.lvl*2;fs.lvl++;fs.got=0;newTarget();WL.add(s);stars();}}else{fs.lives--;}return;}}});
function fabTick(now){if(!run)return;var dt=Math.min(.05,(now-fs.last)/1000);fs.last=now;fs.sp-=dt;if(fs.sp<=0){fs.sp=Math.max(.45,1.2-fs.lvl*.07);var t=Math.random()<.4?fs.tg:TY[Math.floor(Math.random()*TY.length)];fs.items.push({x:-24,y:166,t:t});}
 var v=80+fs.lvl*16;fs.items=fs.items.filter(function(it){it.x+=v*dt;if(it.x>FW+30){if(it.t===fs.tg)fs.lives--;return false;}return true;});
 g.clearRect(0,0,FW,FH);g.fillStyle='#16315e';g.fillRect(0,0,FW,FH);g.fillStyle='#3a3f55';g.fillRect(0,130,FW,70);g.strokeStyle='#5b6283';g.lineWidth=2;for(var k=0;k<14;k++){var bx=((k*30+now*v/1000)%(FW+30))-15;g.beginPath();g.moveTo(bx,130);g.lineTo(bx,200);g.stroke();}
 g.font='36px system-ui';g.textAlign='center';fs.items.forEach(function(it){g.fillText(it.t,it.x,it.y+10);});
 g.fillStyle='#fff';g.font='800 18px system-ui';g.fillText('Tippe alle  '+fs.tg,FW/2,40);g.font='700 15px system-ui';g.fillText('Level '+fs.lvl+' · '+fs.got+'/8 · '+'❤️'.repeat(Math.max(0,fs.lives)),FW/2,70);g.textAlign='left';
 if(fs.lives<=0){run=0;var b=WL.g('wl_fab',0);if(fs.lvl>b)WL.s('wl_fab',fs.lvl);g.fillStyle='rgba(5,10,26,.75)';g.fillRect(0,0,FW,FH);g.fillStyle='#fff';g.textAlign='center';g.font='800 26px system-ui';g.fillText('Fliessband gestoppt!',FW/2,120);g.font='700 18px system-ui';g.fillText('Level '+fs.lvl+' erreicht',FW/2,155);g.font='600 15px system-ui';g.fillText('Tippen für nochmal',FW/2,190);g.textAlign='left';return;}
 fr=requestAnimationFrame(fabTick);}
stars();var hh=(location.hash||'#dorf').slice(1);show(['dorf','schatz','fabrik'].indexOf(hh)>=0?hh:'dorf');
})();
