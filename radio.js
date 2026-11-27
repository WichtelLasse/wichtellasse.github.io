(function(){"use strict";
var $=function(s,r){return(r||document).querySelector(s)};
var S={on:false,speak:true,music:true},gen=0,AC=null,master=null,stopT=0,oi=0,mi=0;
var N={C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99};
var SONGS=[
{n:"Stille Nacht (Melodie)",u:.2,t:[["G4",3],["A4",1],["G4",2],["E4",6],["G4",3],["A4",1],["G4",2],["E4",6],["D5",4],["D5",2],["B4",6],["C5",4],["C5",2],["G4",6],["A4",4],["A4",2],["C5",3],["B4",1],["A4",2],["G4",3],["A4",1],["G4",2],["E4",6],["A4",4],["A4",2],["C5",3],["B4",1],["A4",2],["G4",3],["A4",1],["G4",2],["E4",6],["D5",4],["D5",2],["F5",3],["D5",1],["B4",2],["C5",12],["E5",3],["C5",1],["G4",2],["E4",6],["G4",3],["F4",1],["D4",2],["C4",12]]},
{n:"Jingle Bells (Melodie)",u:.26,t:[["E4",2],["E4",2],["E4",4],["E4",2],["E4",2],["E4",4],["E4",2],["G4",2],["C4",3],["D4",1],["E4",8],["F4",2],["F4",2],["F4",3],["F4",1],["F4",2],["E4",2],["E4",2],["E4",1],["E4",1],["E4",2],["D4",2],["D4",2],["E4",2],["D4",4],["G4",4]]},
{n:"Wichtel-Jingle (selbst komponiert)",u:.22,t:[["C5",2],["E5",2],["G5",4],["A4",2],["C5",2],["E5",4],["G4",2],["A4",2],["C5",2],["E5",2],["D5",4],["C5",8],["E5",2],["G5",2],["E5",2],["C5",2],["D5",4],["G4",4],["C5",8]]}];
var NEWS=[
["Eilmeldung: Zuckerstangen-Tunnel gesperrt","Im Zuckerstangen-Tunnel ist ein Schlitten mit zu vielen Lebkuchen stecken geblieben. Verletzt wurde niemand, nur der Lebkuchen hat ein paar Krümel verloren."],
["Jetzt schwärmen die Wichtel aus","Tausende Wichtel packen ihre Säcke und starten ihre Runde. Die Reporter melden: Alle sind gut gelaunt und haben Reservemützen dabei."],
["Neue Wichtel im Dorf","Drei neue Wichtel wurden heute im Dorf aufgenommen. Sie heissen Zimtli, Funki und Knusperchen und bekommen als Erstes eine rote Zipfelmütze."],
["Schneefall-Rekord","Heute fielen im Wichteldorf zwölf Millionen Schneeflocken. Der Schneemann-Rat meldet: Das sind genau drei Millionen mehr als gestern."],
["Unfall auf der Schlittenspur 7","Ein Rentier ist kurz abgebogen, weil es einen Zimtstern gesehen hat. Es gab einen kleinen Auffahrunfall mit Schneebällen. Alle sind wohlauf."],
["Backstube meldet Rekord","Die Wichtel-Backstube hat heute 5000 Plätzchen gebacken. 4999 davon sind noch da. Das letzte wird gerade untersucht."],
["Mützen-Mode","Der neue Trend im Dorf: Zipfelmützen mit Glöckchen. Die Glöckchen klingeln bei jedem Schritt, was Anschleichen deutlich schwieriger macht."],
["Rentier-Rennen","Beim Rentier-Rennen gewann gestern knapp die Nummer vier. Der Zweite protestierte, weil er unterwegs ein Foto von einem Schneemann machen wollte."],
["Geschenkpapier knapp","Die Papierfabrik meldet: Rot ist ausverkauft, Grün gibt es noch. Die Wichtel packen deshalb gerade sehr grün ein."],
["Polarlicht über dem Dorf","Heute Nacht tanzt das Polarlicht in Grün und Violett. Die Wichtel bringen Decken und heissen Kakao auf die Dächer."],
["Glöckchen verschwunden","Zehn Glöckchen sind in der Werkstatt verschwunden. Die Spur führt zu einem Kater, der heute auffällig leise klingelt."],
["Wichtelrat tagt","Der Wichtelrat berät heute, ob Schneebälle künftig Namen tragen dürfen. Eine Entscheidung wird beim Kakao erwartet."],
["Grosse Schlittenwäsche","Heute ist Waschtag für alle Schlitten. Der Schaum ist rosa, weil jemand die Erdbeerseife erwischt hat."],
["Schach-Turnier unentschieden","Das Schach-Turnier im Dorf endete unentschieden, weil beide Spieler zwischendurch eingeschlafen sind."],
["Zimtstern-Alarm","In der Dorfmitte duftet es so stark nach Zimt, dass drei Wichtel ihre Nase nicht mehr finden. Sie ist aber nur in der Mütze."],
["Eisbahn eröffnet","Die neue Eisbahn am Dorfrand ist offen. Erster Gast: ein Pinguin, der behauptet, er sei nur zufällig vorbeigekommen."],
["Lichterkette repariert","Nach einem Stromausfall im Tannenwald leuchten die Lichterketten wieder. Verantwortlich war ein sehr neugieriges Eichhörnchen."]];
var IV=[
["Zimtli, neue Wichtelin",[["Wie fühlst du dich?","Etwas aufgeregt. Meine Mütze ist noch zu gross."],["Was ist dein Lieblingsgeruch?","Frische Plätzchen, ganz klar."]]],
["Knusperchen, Bäckerin",[["Wie lautet dein Geheimrezept?","Verrate ich nicht. Nur so viel: Es hat mit Zimt zu tun."],["Und wenn jemand nascht?","Dann bekommt er einen Kakao und eine Mahnung."]]],
["Funki, Rentierpfleger",[["Was fressen Rentiere gern?","Flechten und Karotten. Und heimlich Zuckerstangen."],["Welches Rentier ist am schnellsten?","Nummer vier. Aber Nummer sieben sagt, er sei schneller."]]],
["Opa Schneeflocke, Dorfältester",[["Wie alt sind Sie?","Ich zähle nicht mehr. Mein Bart ist aber 112 Zentimeter lang."],["Ihr bester Rat?","Immer warme Socken und ein freundliches Wort."]]],
["Glöckli, Werkstattchefin",[["Was wird gerade gebaut?","Eine Holzeisenbahn mit Dampf aus echtem Zuckerwatte-Rauch."],["Ist das nicht klebrig?","Sehr. Wir tragen Handschuhe."]]],
["Pips, Schneeball-Trainer",[["Wie trainiert man Schneebälle?","Man rollt sie jeden Morgen zehnmal um den Brunnen."],["Und was, wenn sie schmelzen?","Dann werden es Wasserbälle. Auch gut."]]]];
var POLLS=[
["p1","Welcher Duft soll durchs Dorf wehen?","Zimt","Tannennadeln",412,388],
["p2","Was gehört auf die Spitze des Dorfbaums?","Ein Stern","Ein Engel",530,301],
["p3","Heisser Kakao: mit oder ohne Marshmallows?","Mit","Ohne",655,120],
["p4","Welche Mützenfarbe ist die schönste?","Rot","Grün",470,360]];
var TRAFFIC=[["Verkehr im Wichteldorf","Auf der Schlittenspur drei staut es sich wegen eines Schneemann-Transports. Bitte fahrt vorsichtig und winkt freundlich."],["Verkehr im Wichteldorf","Auf dem Rentier-Highway ist alles frei. Nur bei der Zuckerstangen-Kreuzung gibt es kurz Zimtstau."],["Verkehr im Wichteldorf","Eine Kolonne von Lebkuchen-Lastwagen biegt gerade in die Backstube ab. Bitte Platz machen."]];
var ADS=[["Werbung","Zimtstern-Fabrik: Jetzt neu mit extra viel Zimt. Für alle, die Sterne lieber essen als zählen."],["Werbung","Glöckchen-Service Klingeling: Wir polieren dein Glöckchen, bis es richtig bimmelt."],["Werbung","Mützen-Meister Zipfel: Deine Mütze zu gross? Wir machen sie passend."]];
var JOKES=[["Wichtelwitz","Was macht ein Schneemann am liebsten im Frühling? Er überlegt sich, ob er in den Urlaub fliegt oder einfach wegfliesst."],["Wichtelwitz","Warum sind Wichtel so gute Sänger? Weil sie immer eine Mütze voller Töne dabei haben."],["Wichtelwitz","Was ist weiss, kalt und sehr höflich? Ein Schneemann, der sich entschuldigt, wenn er schmilzt."]];
var STORIES=[
["Das Glöckchen, das nicht klingeln wollte","Im Wichteldorf lebte ein kleines Glöckchen, das nicht klingeln wollte. Alle anderen Glöckchen bimmelten fröhlich, nur dieses blieb stumm. Eines Abends schneite es so dicht, dass ein kleiner Wichtel den Weg nach Hause nicht mehr fand. Er war müde und fror. Da fing das Glöckchen ganz leise an zu klingeln, ganz zart, wie ein Sternchen. Der Wichtel hörte den Ton und folgte ihm bis zur warmen Stube. Seit diesem Abend wusste das Glöckchen: Es muss nicht laut sein, um wichtig zu sein. Gute Nacht."],
["Der Schneemann und der Mond","Ein Schneemann stand mitten auf einer Wiese und schaute jeden Abend zum Mond hinauf. Eines Nachts fragte er: Bist du auch aus Schnee? Der Mond lächelte und sagte: Fast. Ich bin aus Licht. Der Schneemann freute sich, denn nun hatte er einen Freund, der jede Nacht vorbeikam. Und wenn die Wolken den Mond versteckten, dann wusste der Schneemann: Er ist trotzdem da. Er wartete geduldig, bis es wieder hell wurde. Schlaf gut."],
["Wie das Wichteldorf zu seinem Stern kam","Vor langer Zeit hatte das Wichteldorf keinen Stern auf dem grossen Baum. Die Wichtel suchten und suchten. Ein kleiner Wichtel sagte: Wir brauchen keinen gekauften Stern. Wir basteln einen. Alle brachten etwas mit: Goldpapier, Glitzer, Kleber und viel Geduld. Am Abend leuchtete der Stern zum ersten Mal, ein wenig schief, aber sehr hell. Seitdem sagen die Wichtel: Der schönste Stern ist der, den man gemeinsam macht. Gute Nacht."]];
function F(k){return N[k];}
function ctx(){if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=1;master.connect(AC.destination);}if(AC.state==='suspended')AC.resume();return AC;}
function playSong(s,done){if(!S.music){var q=setTimeout(done,6000);stopT=q;return;}var c=ctx();var t=c.currentTime+.1,u=s.u,tot=0;if(master){master.gain.cancelScheduledValues(c.currentTime);master.gain.setValueAtTime(1,c.currentTime);}s.t.forEach(function(n){var d=n[1]*u,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=F(n[0]);g.gain.setValueAtTime(.0001,t+tot);g.gain.linearRampToValueAtTime(.16,t+tot+.02);g.gain.exponentialRampToValueAtTime(.0001,t+tot+d*.95);o.connect(g);g.connect(master);o.start(t+tot);o.stop(t+tot+d);tot+=d;});stopT=setTimeout(done,(tot+.8)*1000);}
function stopAll(){gen++;clearTimeout(stopT);try{if(master&&AC){master.gain.cancelScheduledValues(AC.currentTime);master.gain.setValueAtTime(0,AC.currentTime);setTimeout(function(){if(master)master.gain.value=1;},60);}}catch(e){}try{window.speechSynthesis&&speechSynthesis.cancel();}catch(e){}}
function voice(){try{var v=speechSynthesis.getVoices();return v.filter(function(x){return /^de/i.test(x.lang);})[0]||null;}catch(e){return null;}}
function say(txt,cb){var fired=0;function end(){if(fired)return;fired=1;cb();}if(!S.speak||!window.speechSynthesis||!window.SpeechSynthesisUtterance){setTimeout(end,Math.max(3500,txt.length*55));return;}try{var u=new SpeechSynthesisUtterance(txt);u.lang='de-DE';var v=voice();if(v)u.voice=v;u.rate=.95;u.pitch=1.1;u.onend=end;u.onerror=end;speechSynthesis.speak(u);setTimeout(end,Math.max(8000,txt.length*140));}catch(e){setTimeout(end,4000);}}
function seg(label,title,html){$('#rlab').textContent=label;$('#rtit').textContent=title;$('#rbody').innerHTML=html||'';}
function pick(a,key){a._o=a._o&&a._o.length?a._o:a.map(function(x,i){return i;}).sort(function(){return Math.random()-.5;});return a[a._o.pop()];}
var ORDER=['m','n','m','i','m','p','m','n','m','v','m','j','m','i','m','w','m','n'];
function next(){if(!S.on)return;var k=ORDER[oi%ORDER.length];oi++;run(k);}
function run(k){var g0=++gen;function ok(f){return function(){if(g0===gen&&S.on)f();};}
 if(k==='m'){var s=SONGS[mi++%SONGS.length];seg('🎵 Wichtel-Musik',s.n,'<p>Gleich geht es weiter mit Meldungen aus dem Wichteldorf.</p>');playSong(s,ok(next));return;}
 if(k==='n'){var n=pick(NEWS);seg('📰 Wichtel-News',n[0],'<p>'+n[1]+'</p>');say(n[0]+'. '+n[1],ok(function(){setTimeout(ok(next),1200);}));return;}
 if(k==='v'||k==='w'||k==='j'){var a=pick(k==='v'?TRAFFIC:k==='w'?ADS:JOKES);seg(k==='v'?'🚦 Verkehr':k==='w'?'📣 Werbung':'😄 Witz',a[0],'<p>'+a[1]+'</p>');say(a[0]+'. '+a[1],ok(function(){setTimeout(ok(next),1200);}));return;}
 if(k==='i'){var iv=pick(IV),i=0;seg('🎤 Interview','Reporter Pip Plapper spricht mit '+iv[0],'');(function step(){if(i>=iv[1].length){setTimeout(ok(next),1200);return;}var q=iv[1][i];i++;var el=document.createElement('p');el.innerHTML='<b>Pip:</b> '+q[0];$('#rbody').appendChild(el);say(q[0],ok(function(){var e2=document.createElement('p');e2.innerHTML='<b>'+iv[0].split(',')[0]+':</b> '+q[1];$('#rbody').appendChild(e2);say(q[1],ok(step));}));})();return;}
 if(k==='p'){var p=pick(POLLS),votes=WL.g('wl_rv',{});seg('🗳️ Abstimmung im Wichteldorf',p[1],'');var box=$('#rbody');var done=0;
  function show(){var v=votes[p[0]],a=p[4]+(v===0?1:0),b=p[5]+(v===1?1:0),tot=a+b;box.innerHTML='<div class="prow"><span>'+p[2]+'</span><i style="width:'+Math.round(a/tot*100)+'%"></i><b>'+Math.round(a/tot*100)+' %</b></div><div class="prow"><span>'+p[3]+'</span><i style="width:'+Math.round(b/tot*100)+'%"></i><b>'+Math.round(b/tot*100)+' %</b></div>'+(v===undefined?'':'<p class="note">Deine Stimme ist dabei.</p>');}
  function ask(){box.innerHTML='<div class="row"><button class="btn" id="pa">'+p[2]+'</button><button class="btn ghost" id="pb">'+p[3]+'</button></div><p class="note">Stimm ab, es dauert nur einen Moment. Für deine erste Stimme gibt es einen Stern.</p>';
   function vote(x){if(done)return;done=1;if(votes[p[0]]===undefined){votes[p[0]]=x;WL.s('wl_rv',votes);WL.add(1);}else votes=WL.g('wl_rv',votes);show();setTimeout(ok(next),6000);}
   $('#pa').onclick=function(){vote(0);};$('#pb').onclick=function(){vote(1);};}
  if(votes[p[0]]!==undefined){done=1;show();say(p[1],ok(function(){setTimeout(ok(next),5000);}));}else{ask();say('Abstimmung im Wichteldorf. '+p[1]+' '+p[2]+' oder '+p[3]+'?',function(){});setTimeout(ok(function(){if(!done){done=1;show();setTimeout(ok(next),5000);}}),30000);}return;}}
function setOn(v){S.on=v;var b=$('#rbtn');b.textContent=v?'⏸️ Radio aus':'▶️ Radio an';$('#rair').classList.toggle('on',v);if(v){ctx();next();}else{stopAll();seg('📻 Wichtelfunk Nordpol','Radio ist aus','<p>Drück auf «Radio an», dann geht es los.</p>');}}
$('#rbtn').onclick=function(){setOn(!S.on);};
$('#rskip').onclick=function(){if(S.on){stopAll();next();}};
$('#rsp').onclick=function(){S.speak=!S.speak;this.textContent=S.speak?'🗣️ Sprecher: an':'🗣️ Sprecher: aus';if(!S.speak)try{speechSynthesis.cancel();}catch(e){}};
$('#rmu').onclick=function(){S.music=!S.music;this.textContent=S.music?'🎶 Musik: an':'🎶 Musik: aus';};
/* Geschichten */
var sh='';STORIES.forEach(function(s,i){sh+='<div class="gcard" style="align-items:flex-start;text-align:left"><b>'+s[0]+'</b><small>ca. 1 Minute</small><div class="row"><button class="btn" data-i="'+i+'">▶️ Vorlesen</button><button class="btn ghost" data-t="'+i+'">📖 Lesen</button></div><p class="st" id="st'+i+'" hidden>'+s[1]+'</p></div>';});
$('#rst').innerHTML=sh;var sg=0;
$('#rst').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.t!==undefined){var p=$('#st'+b.dataset.t);p.hidden=!p.hidden;return;}if(b.dataset.i===undefined)return;if(S.on)setOn(false);try{speechSynthesis.cancel();}catch(x){}var i=+b.dataset.i,g1=++sg;$('#st'+i).hidden=false;if(b.textContent.indexOf('Stopp')>=0){b.textContent='▶️ Vorlesen';return;}document.querySelectorAll('#rst [data-i]').forEach(function(x){x.textContent='▶️ Vorlesen';});b.textContent='⏹️ Stopp';var parts=STORIES[i][1].split('. ');(function step(j){if(g1!==sg||j>=parts.length){if(g1===sg)b.textContent='▶️ Vorlesen';return;}say(parts[j]+(j<parts.length-1?'.':''),function(){step(j+1);});})(0);});
seg('📻 Wichtelfunk Nordpol','Radio ist aus','<p>Drück auf «Radio an», dann geht es los.</p>');
window.addEventListener('pagehide',function(){stopAll();});
})();
