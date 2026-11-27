(function(){"use strict";
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
function H(el,h){el.innerHTML=h;}
function stars(){$('#wstars').textContent=WL.stars();}
var tabs=$$('.tabs button'),panes=$$('.pane'),fabStop=null;
function show(p){tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.p===p?'true':'false');});panes.forEach(function(x){x.hidden=x.id!=='p-'+p;});if(fabStop)fabStop();if(p==='dorf')dorf();if(p==='schatz')schatz();if(p==='fabrik')fabIdle();if(p==='reise')reise();try{history.replaceState(null,'','#'+p);}catch(e){}}
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
var RS=[
['⛰️','Schweiz','Lasse startet im Schnee der Alpen. Ein dickes Murmeltier sitzt mitten auf dem Weg und pfeift.',[['Leise vorbeischleichen',0,1,'Du schleichst mutig vorbei. Das Murmeltier nickt dir zu.'],['Ein Stück Käse anbieten',1,0,'Das Murmeltier freut sich und pfeift dir ein Lied.'],['Laut zurückpfeifen',-1,2,'Es pfeift lauter. Du bist heiser, aber sehr mutig.']],['🧀','Alpenkäse']],
['🌌','Norwegen','Am Fjord tanzt das Polarlicht. Auf einer Brücke steht ein Troll und will ein Rätsel hören, bevor du weiterdarfst.',[['Ein Rätsel erzählen',0,2,'Der Troll denkt lange nach und lässt dich lachend durch.'],['Ihm eine Mütze schenken',2,-1,'Der Troll trägt die Mütze sofort. Dir wird ganz warm ums Herz.'],['Einfach weitergehen',-1,1,'Der Troll schaut dumm. Du bist frech, aber vorbei.']],['🧶','Wollsocken']],
['🏜️','Ägypten','Nachts wird es in der Wüste kalt. Neben einer Pyramide kaut ein Kamel an deinem Schal.',[['Schal zurückholen',0,1,'Du ziehst sanft. Das Kamel gibt ihn her, mit etwas Sand.'],['Dem Kamel den Schal lassen',-1,2,'Du frierst, aber das Kamel schaut dich dankbar an.'],['Ein Lagerfeuer machen',2,0,'Das Feuer wärmt dich und das Kamel gleich mit.']],['🏺','kleine Tonvase']],
['🦜','Brasilien','Im Regenwald ruft ein Papagei deinen Namen. Er hat gelauscht und weiss, dass du auf Reise bist.',[['Mit ihm plaudern',1,1,'Ihr plaudert lange. Er zeigt dir den kürzesten Weg.'],['Ihm ein Plätzchen geben',1,0,'Er krächzt vor Freude und wiederholt Danke, Danke.'],['Leise weiterschleichen',-1,2,'Der Papagei ruft dir leise nach: Viel Glück!']],['🥭','Mango']],
['🦘','Australien','In der Hitze hüpft ein Känguru heran. Dir ist so warm, dass deine Zipfelmütze fast schmilzt.',[['Mütze abnehmen',-1,1,'Du wirst kühler, aber kurz friert dein Kopf.'],['Zusammen hüpfen',0,2,'Ihr hüpft quer über die Wiese. Du bist ausser Atem und stolz.'],['Im Schatten ausruhen',2,0,'Ein kurzer Schlaf im Schatten. Du bist wieder frisch.']],['🪃','Mini-Bumerang']],
['🐧','Antarktis','Letzte Station: Eis, Wind und ein Pinguin, der dir den Weg nach Hause zeigen will. Der Heimweg ist weit.',[['Dem Pinguin folgen',1,1,'Der Pinguin watschelt voran und ihr kommt gut durch den Sturm.'],['Auf dem Bauch rutschen',0,2,'Wie ein Schlitten! Du rutschst in Rekordzeit.'],['Mit dem Pinguin kuscheln',2,0,'Ihr wärmt euch gegenseitig. Du bist bereit für den Heimflug.']],['🐚','Eismuschel']]];
function reise(){var P=$('#p-reise'),S=WL.g('wl_reise',null);if(!S||typeof S.st!=='number')S={st:0,w:3,m:3,so:[],fb:''};
 function save(){WL.s('wl_reise',S);}
 function bar(v){var t='';for(var i=0;i<8;i++)t+=i<v?'■':'□';return t;}
 var h='<div class="note" style="margin-bottom:10px">Wärme '+bar(S.w)+' · Mut '+bar(S.m)+'</div>';
 if(S.fb&&S.st<RS.length)h+='<div class="card" style="padding:12px 14px;margin-bottom:12px">'+S.fb+'</div>';
 if(S.st>=RS.length){var gain=5+S.w+S.m,first=!WL.g('wl_reisep',0),msg='';if(first){WL.s('wl_reisep',1);WL.add(gain);stars();msg='Du bekommst '+gain+' Sterne für deine erste Weltreise.';}else msg='Diese Reise gibt keine neuen Sterne, aber sie macht Spass.';
  h+='<h3>Zurück im Wichteldorf</h3><p>'+S.fb+'</p><p>Lasse ist einmal um die Welt gereist. Wärme '+S.w+' von 8, Mut '+S.m+' von 8.</p><p><b>Deine Mitbringsel:</b> '+S.so.map(function(x){return x[0]+' '+x[1];}).join(' · ')+'</p><p class="note">'+msg+'</p><button class="btn" type="button" data-r="1">Nochmal reisen</button>';
 }else{var st=RS[S.st];h+='<div class="note">Station '+(S.st+1)+' von '+RS.length+'</div><h3>'+st[0]+' '+st[1]+'</h3><p>'+st[2]+'</p><div class="col" style="display:grid;gap:8px;margin-top:12px">';st[3].forEach(function(o,i){h+='<button class="btn ghost" type="button" data-o="'+i+'">'+o[0]+'</button>';});h+='</div>';}
 H(P,h);
 P.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.r){S={st:0,w:3,m:3,so:[],fb:''};save();reise();return;}if(b.dataset.o===undefined||S.st>=RS.length)return;var st=RS[S.st],o=st[3][+b.dataset.o];S.w=Math.max(0,Math.min(8,S.w+o[1]));S.m=Math.max(0,Math.min(8,S.m+o[2]));S.so.push(st[4]);S.fb=o[3];S.st++;save();reise();};}
stars();var hh=(location.hash||'#dorf').slice(1);show(['dorf','schatz','fabrik','reise'].indexOf(hh)>=0?hh:'dorf');
})();
