(function(){"use strict";
var $=function(s){return document.querySelector(s)},HR=3600000;
function rngf(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function shuffle(r,a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function zp(ms){var p={};new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit',month:'numeric',day:'numeric',hour12:false}).formatToParts(new Date(ms)).forEach(function(x){p[x.type]=x.value;});p.h=(+p.hour)%24;p.mi=+p.minute;p.mo=+p.month;p.d=+p.day;return p;}
var WHO={pip:'🎙️ Pip Plapper',spr:'📰 Frieda Funk, Nachrichten',lasse:'🎅 Lasse',knusperchen:'🥐 Knusperchen',funki:'🦌 Funki',gloeckli:'🔔 Glöckli',opa:'👴 Opa Schneeflocke',zimtli:'🧣 Zimtli',flocki:'⛄ Flocki'};
var VC={pip:{p:1.2,r:1.08,g:'m',i:0},spr:{p:1,r:.97,g:'f',i:0},lasse:{p:1.5,r:1.08,g:'m',i:1},knusperchen:{p:1.3,r:1,g:'f',i:1},funki:{p:.95,r:1.12,g:'m',i:2},gloeckli:{p:1.55,r:1.15,g:'f',i:2},opa:{p:.5,r:.8,g:'m',i:3},zimtli:{p:1.7,r:1.1,g:'f',i:3},flocki:{p:1.15,r:1.05,g:'m',i:4}};
var NEWS=[
["Zuckerstangen-Tunnel gesperrt","Im Zuckerstangen-Tunnel ist ein Schlitten mit zu vielen Lebkuchen stecken geblieben. Verletzt wurde niemand, nur der Lebkuchen hat ein paar Krümel verloren."],
["Jetzt schwärmen die Wichtel aus","Tausende Wichtel packen ihre Säcke und starten ihre Runde. Die Reporter melden: Alle sind gut gelaunt und haben Reservemützen dabei."],
["Neue Wichtel im Dorf","Drei neue Wichtel wurden heute im Dorf aufgenommen. Sie heissen Zimtli, Funki und Knusperchen und bekommen als Erstes eine rote Zipfelmütze."],
["Schneefall-Rekord","Heute fielen im Wichteldorf zwölf Millionen Schneeflocken. Der Schneemann-Rat meldet: Das sind genau drei Millionen mehr als gestern."],
["Unfall auf der Schlittenspur sieben","Ein Rentier ist kurz abgebogen, weil es einen Zimtstern gesehen hat. Es gab einen kleinen Auffahrunfall mit Schneebällen. Alle sind wohlauf."],
["Backstube meldet Rekord","Die Backstube hat heute 5000 Plätzchen gebacken. 4999 davon sind noch da. Das letzte wird gerade untersucht."],
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
var NN=["Zimtli","Funki","Knusperchen","Glöckli","Opa Schneeflocke","Flocki","Mützli","Frau Lebkuchen","Rentier Nummer vier","Der Kater Pelzi","Zuckerstangen-Willi","Schneemann Egon"];
var NE=["hat versehentlich die Zuckerstangen-Strasse verstopft","hat einen neuen Rekord im Plätzchen-Stapeln aufgestellt","ist mit dem Schlitten in einen Schneehaufen gerutscht","hat die Lichterkette am Dorfbaum repariert","wurde zum Wichtel des Tages gewählt","hat zehn Glöckchen gefunden, die niemand vermisst hat","hat einen Schneemann mit drei Nasen gebaut","hat im Kakao-Teich eine Runde gedreht","hat die längste Zipfelmütze des Dorfes gestrickt","hat beim Rentier-Rennen den Start verschlafen","hat eine Schneeflocke mit Namen entdeckt","hat das grösste Lebkuchenhaus der Woche gebaut"];
var NR=["Verletzt wurde niemand, nur der Stolz hat einen kleinen Kratzer.","Die Dorfbewohner applaudierten und holten heissen Kakao.","Der Wichtelrat will den Fall am Montag prüfen.","Die Backstube meldet danach extra viel Zimtgeruch.","Ein Pinguin soll alles beobachtet haben.","Die Reporter sind sich einig: So etwas gab es noch nie.","Alle sind wohlauf und gut gelaunt.","Die Rentiere haben mitgeklatscht."];
var CH=[
["knusperchen","Knusperchen","Bäckerin",[["Wie lautet dein Geheimrezept?","Verrate ich nicht. Nur so viel: Es hat mit Zimt zu tun."],["Und wenn jemand nascht?","Dann bekommt er einen Kakao und eine Mahnung."],["Was backst du heute?","Dreitausend Sterne, zweitausend Herzen und ein Brot für die Rentiere."]]],
["funki","Funki","Rentierpfleger",[["Was fressen Rentiere gern?","Flechten und Karotten. Und heimlich Zuckerstangen."],["Welches Rentier ist am schnellsten?","Nummer vier. Aber Nummer sieben sagt, er sei schneller."],["Bürstest du sie jeden Tag?","Jeden Morgen. Sie schnaufen dabei wie kleine Lokomotiven."]]],
["gloeckli","Glöckli","Werkstattchefin",[["Was wird gerade gebaut?","Eine Holzeisenbahn mit Dampf aus Zuckerwatte."],["Ist das nicht klebrig?","Sehr. Wir tragen Handschuhe und lachen viel."],["Hast du ein Lieblingswerkzeug?","Den kleinen Hammer. Er klingt wie ein Glöckchen."]]],
["opa","Opa Schneeflocke","Dorfältester",[["Wie alt sind Sie?","Ich zähle nicht mehr. Mein Bart ist aber hundertzwölf Zentimeter lang."],["Ihr bester Rat?","Immer warme Socken und ein freundliches Wort."],["Was war früher anders?","Früher hatten die Schneeflocken noch Namen. Heute sind es einfach zu viele."]]],
["zimtli","Zimtli","neue Wichtelin",[["Wie fühlst du dich?","Etwas aufgeregt. Meine Mütze ist noch zu gross."],["Was ist dein Lieblingsgeruch?","Frische Plätzchen, ganz klar."],["Hast du schon Freunde?","Ja, einen Schneemann. Er sagt nichts, hört aber super zu."]]],
["flocki","Flocki","Schneeball-Trainer",[["Wie trainiert man Schneebälle?","Man rollt sie jeden Morgen zehnmal um den Brunnen."],["Und wenn sie schmelzen?","Dann werden es Wasserbälle. Auch gut."],["Dein Ziel für diese Saison?","Ein Schneeball, der genau eine Runde um den Dorfbaum fliegt."]]]];
var POLLS=[["Welcher Duft soll durchs Dorf wehen?","Zimt","Tannennadeln"],["Was gehört auf die Spitze des Dorfbaums?","Ein Stern","Ein Engel"],["Heisser Kakao: mit oder ohne Marshmallows?","Mit","Ohne"],["Welche Mützenfarbe ist die schönste?","Rot","Grün"],["Was ist besser im Winter?","Schlitten","Schlittschuhe"],["Wer ist der beste Rentier-Läufer?","Nummer vier","Nummer sieben"]];
var TRAFFIC=["Auf der Schlittenspur drei staut es sich wegen eines Schneemann-Transports. Bitte fahrt vorsichtig und winkt freundlich.","Auf dem Rentier-Highway ist alles frei. Nur bei der Zuckerstangen-Kreuzung gibt es kurz Zimtstau.","Eine Kolonne Lebkuchen-Lastwagen biegt gerade in die Backstube ab. Bitte Platz machen.","Auf der Eisbahn ist Gegenverkehr. Bitte rechts fahren, auch mit Schlittschuhen.","Der Tannenwald-Tunnel ist wegen Schneeschaufeln für eine Stunde einspurig."];
var ADS=["Zimtstern-Fabrik: Jetzt neu mit extra viel Zimt. Für alle, die Sterne lieber essen als zählen.","Glöckchen-Service Klingeling: Wir polieren dein Glöckchen, bis es richtig bimmelt.","Mützen-Meister Zipfel: Deine Mütze zu gross? Wir machen sie passend.","Kakao-Bar am Dorfplatz: Heute doppelt so viele Marshmallows. Solange der Vorrat reicht.","Schlitten-Garage Rutsch und Weg: Jetzt mit warmen Sitzen und eingebautem Glöckchen."];
var JOKES=["Was macht ein Schneemann am liebsten im Frühling? Er überlegt sich, ob er in den Urlaub fliegt oder einfach wegfliesst.","Warum sind Wichtel so gute Sänger? Weil sie immer eine Mütze voller Töne dabei haben.","Was ist weiss, kalt und sehr höflich? Ein Schneemann, der sich entschuldigt, wenn er schmilzt.","Was sagt ein Rentier, das sich verlaufen hat? Ich glaube, ich bin schon wieder im Kreis gelaufen. Ich meine, im Geweih.","Warum nimmt der Schneemann Möhren mit ins Bett? Damit er im Traum immer eine Nase hat."];
var GREETS=["Ein lieber Gruss geht an alle Wichtel, die heute Nachtschicht haben. Ihr macht das grossartig.","Einen herzlichen Gruss an die Backstube. Wir haben Plätzchenduft bis ins Studio.","Ganz liebe Grüsse an alle, die gerade zuhören und ihre Mütze aufhaben.","Ein Gruss an Opa Schneeflocke, der sich heute eine Wärmflasche und einen Kakao verdient hat.","Liebe Grüsse an alle, die zu Hause sitzen und ein Plätzchen in der Hand halten."];
var CHAT=["Liebe Hörerinnen und Hörer, bei uns im Wichteldorf riecht es heute nach Zimt und frisch gebackenen Plätzchen. Bleibt dran, gleich kommt wieder Musik.","Wusstet ihr, dass jede Schneeflocke sechs Arme hat? Keine einzige gleicht der anderen, und wir haben sie alle schon gezählt. Fast.","Falls ihr gerade Plätzchen backt: Vergesst nicht, einen für das Radio übrig zu lassen. Der Techniker hat Hunger.","Draussen schneit es ganz leise. Genau das richtige Wetter für eine Mütze, eine Decke und gute Musik.","Das Wichteldorf wünscht allen einen gemütlichen Abend. Und denkt dran: Ein Lächeln wärmt mehr als jede Mütze."];
var LASSE=[
[["lasse","Hallo, hier ist Lasse! Ein dickes Hallo an Micha. Ich hoffe, du hast einen gemütlichen Abend und warme Füsse."],["pip","Danke, Lasse! Schön, dich im Wichtelfunk zu hören."]],
[["lasse","Hier ist Lasse mit einem Tipp: Zimtsterne schmecken am besten, wenn man sie vorher kurz in den Händen wärmt. Und Micha: Ganz liebe Grüsse von mir!"],["pip","Ein Profi-Tipp. Danke, Lasse!"]],
[["lasse","Kurze Durchsage von Lasse: Heute ist ein guter Tag für heisse Schokolade. Grüsse an Micha und an alle anderen zu Hause."],["pip","Wir schliessen uns an. Weiter geht es mit Musik."]]];
var STORIES=[
"Im Wichteldorf lebte ein kleines Glöckchen, das nicht klingeln wollte. Alle anderen Glöckchen bimmelten fröhlich, nur dieses blieb stumm. Eines Abends schneite es so dicht, dass ein kleiner Wichtel den Weg nach Hause nicht mehr fand. Er war müde und fror. Da fing das Glöckchen ganz leise an zu klingeln, ganz zart, wie ein Sternchen. Der Wichtel hörte den Ton und folgte ihm bis zur warmen Stube. Seit diesem Abend wusste das Glöckchen: Es muss nicht laut sein, um wichtig zu sein. Gute Nacht.",
"Ein Schneemann stand mitten auf einer Wiese und schaute jeden Abend zum Mond hinauf. Eines Nachts fragte er: Bist du auch aus Schnee? Der Mond lächelte und sagte: Fast. Ich bin aus Licht. Der Schneemann freute sich, denn nun hatte er einen Freund, der jede Nacht vorbeikam. Und wenn die Wolken den Mond versteckten, dann wusste der Schneemann: Er ist trotzdem da. Er wartete geduldig, bis es wieder hell wurde. Schlaf gut.",
"Vor langer Zeit hatte das Wichteldorf keinen Stern auf dem grossen Baum. Die Wichtel suchten und suchten. Ein kleiner Wichtel sagte: Wir brauchen keinen gekauften Stern. Wir basteln einen. Alle brachten etwas mit: Goldpapier, Glitzer, Kleber und viel Geduld. Am Abend leuchtete der Stern zum ersten Mal, ein wenig schief, aber sehr hell. Seitdem sagen die Wichtel: Der schönste Stern ist der, den man gemeinsam macht. Gute Nacht."];
var A1=["Zimtstern","Schneeflöckli","Glöckchen","Lebkuchen","Polarlicht","Rentier","Kakao","Zipfelmützen","Schlitten","Tannen","Kerzen","Mondschein"];
var B1={weihnacht:["-Nacht","-Traum","-Wiegenlied","-Glanz"],wichtel:["-Tanz","-Polka","-Express","-Parade"],banger:["-Party","-Drop","-Beat","-Rave"],neujahr:["-Countdown","-Feuerwerk","-Silvester","-Neustart"]};
var AR={weihnacht:["Wichtelchor Nordpol","Frau Zimt","Die Zipfelmützen"],wichtel:["Die Zipfelmützen","DJ Schneeball","Kakao-Kapelle"],banger:["DJ Schneeball","MC Lebkuchen","Die Eisbären-Crew"],neujahr:["Feuerwerk-Orchester","DJ Schneeball","Silvester-Wichtel"]};
var CLS=[{n:"Stille Nacht (Melodie)",u:.2,t:[["G4",3],["A4",1],["G4",2],["E4",6],["G4",3],["A4",1],["G4",2],["E4",6],["D5",4],["D5",2],["B4",6],["C5",4],["C5",2],["G4",6],["A4",4],["A4",2],["C5",3],["B4",1],["A4",2],["G4",3],["A4",1],["G4",2],["E4",6],["A4",4],["A4",2],["C5",3],["B4",1],["A4",2],["G4",3],["A4",1],["G4",2],["E4",6],["D5",4],["D5",2],["F5",3],["D5",1],["B4",2],["C5",12],["E5",3],["C5",1],["G4",2],["E4",6],["G4",3],["F4",1],["D4",2],["C4",12]]},
{n:"Jingle Bells (Melodie)",u:.26,t:[["E4",2],["E4",2],["E4",4],["E4",2],["E4",2],["E4",4],["E4",2],["G4",2],["C4",3],["D4",1],["E4",8],["F4",2],["F4",2],["F4",3],["F4",1],["F4",2],["E4",2],["E4",2],["E4",1],["E4",1],["E4",2],["D4",2],["D4",2],["E4",2],["D4",4],["G4",4]]}];
var MID={C4:60,D4:62,E4:64,F4:65,G4:67,A4:69,B4:71,C5:72,D5:74,E5:76,F5:77,G5:79};
var SHOWS=[[6,10,"Guten Morgen, Wichteldorf"],[10,14,"Zimtstern-Mittag"],[14,18,"Schlittenspur-Nachmittag"],[18,22,"Kakao-Abend"],[22,30,"Polarlicht-Nacht"]];
function showName(h){var x=h<6?h+24:h;for(var i=0;i<SHOWS.length;i++)if(x>=SHOWS[i][0]&&x<SHOWS[i][1])return SHOWS[i][2];return SHOWS[4][2];}
function styleFor(r,p){var x=r(),ny=(p.mo===12&&p.d>=28)||(p.mo===1&&p.d<=3);if(ny)return x<.4?"neujahr":x<.7?"banger":x<.85?"wichtel":x<.95?"weihnacht":"klassik";return x<.38?"weihnacht":x<.68?"wichtel":x<.88?"banger":"klassik";}
function makeSong(r,p){var st=styleFor(r,p);if(st==="klassik"){var c=CLS[Math.floor(r()*CLS.length)],tot=0;c.t.forEach(function(n){tot+=n[1]*c.u;});return{style:"klassik",cls:c,name:c.n,artist:"Wichtelfunk-Orchester",dur:tot+2};}
 var bpm={weihnacht:76+Math.floor(r()*20),wichtel:104+Math.floor(r()*14),banger:122+Math.floor(r()*6),neujahr:116+Math.floor(r()*8)}[st],bars=40+Math.floor(r()*4)*4,seed=Math.floor(r()*1e9);
 return{style:st,seed:seed,bpm:bpm,bars:bars,name:pick(r,A1)+pick(r,B1[st]),artist:pick(r,AR[st]),dur:bars*240/bpm};}
function lines(a){var o=0;a.forEach(function(l){l.o=o;l.d=1+l[1].length*.08;o+=l.d+.6;});return o;}
function zpad(n){return(n<10?"0":"")+n;}
function build(H){var r=rngf(H*7919+13),p=zp(H*HR+1800000),segs=[],t=0;
 function add(ty,dur,o){o=o||{};o.ty=ty;o.s=t;o.d=dur;segs.push(o);t+=dur;}
 function talk(ty,ls,label){var d=lines(ls);add(ty,d,{ls:ls,label:label});}
 function mus(){var sg=makeSong(r,p);add("music",sg.dur,{song:sg,label:"🎵 Musik"});}
 var tm=zp(H*HR+t*1000);
 talk("id",[["pip","Wichtelfunk Nordpol, die Stimme aus dem Wichteldorf. Es ist "+tm.h+" Uhr "+zpad(tm.mi)+"."]],"📻 Wichtelfunk");
 var n1=pick(r,r()<.5?NEWS:[[pick(r,NN)+" "+pick(r,NE),pick(r,NN)+" "+pick(r,NE)+". "+pick(r,NR)]]),n2=pick(r,NEWS);var nn=pick(r,NN),ne=pick(r,NE);
 if(r()<.5)n1=[nn+" "+ne,nn+" "+ne+". "+pick(r,NR)];
 talk("news",[["spr","Hier sind die Nachrichten aus dem Wichteldorf."],["spr",n1[0]+". "+n1[1]],["spr",n2[0]+". "+n2[1]],["spr","Das war es für diese Stunde. Bleiben Sie dran."]],"📰 Nachrichten");
 var kinds=shuffle(r,["talk","interview","traffic","poll","weather","ad","joke","greet"]);
 if(p.h===21)kinds.unshift("story");if(r()<.2)kinds.splice(2,0,"lasse");
 var i=0;
 while(t<3590){mus();if(t>=3590)break;var k=kinds[i++%kinds.length],c=segs.length;
  if(k==="talk")talk("talk",[["pip",pick(r,CHAT)]],"🎙️ Moderation");
  else if(k==="interview"){var ch=pick(r,CH),qa=shuffle(r,ch[3]).slice(0,2),ls=[["pip","Zu Gast bei uns ist "+ch[1]+", "+ch[2]+"."]];qa.forEach(function(x){ls.push(["pip",x[0]]);ls.push([ch[0],x[1]]);});ls.push(["pip","Danke für das Gespräch."]);talk("talk",ls,"🎤 Interview mit "+ch[1]);}
  else if(k==="traffic")talk("talk",[["spr","Der Verkehr im Wichteldorf. "+pick(r,TRAFFIC)]],"🚦 Verkehr");
  else if(k==="poll"){var q=pick(r,POLLS),pc=30+Math.floor(r()*41);talk("poll",[["pip","Abstimmung im Wichteldorf. "+q[0]+" "+q[1]+" oder "+q[2]+"?"],["pip","Das Zwischenergebnis: "+pc+" Prozent für "+q[1]+" und "+(100-pc)+" Prozent für "+q[2]+"."]],"🗳️ Abstimmung");segs[segs.length-1].poll={q:q,pc:pc,id:H+"-"+segs.length};}
  else if(k==="weather"){var wt=pick(r,["leichter Schneefall","dichter Schneefall","klarer Sternenhimmel","Polarlicht","sanfter Flockenwirbel"]),tp=-3-Math.floor(r()*9);talk("talk",[["spr","Das Wichtel-Wetter, erfunden und frisch aus der Zuckerbäckerei: "+wt+", "+tp+" Grad, ein leichter Wind aus Nordwest."]],"🌨️ Wichtel-Wetter");}
  else if(k==="ad")talk("talk",[["pip","Kurze Werbung. "+pick(r,ADS)]],"📣 Werbung");
  else if(k==="joke")talk("talk",[["pip","Der Wichtelwitz. "+pick(r,JOKES)]],"😄 Wichtelwitz");
  else if(k==="greet")talk("talk",[["pip",pick(r,GREETS)]],"💌 Grüsse");
  else if(k==="story"){var st=STORIES[(Math.floor(H/24))%STORIES.length].split(". "),ls2=[["pip","Es ist Zeit für die Gute-Nacht-Geschichte."]];st.forEach(function(s,ix){ls2.push(["pip",s+(ix<st.length-1?".":"")]);});talk("talk",ls2,"🌙 Gute-Nacht-Geschichte");}
  else if(k==="lasse"){var lv=pick(r,LASSE);talk("talk",lv.map(function(x){return[x[0],x[1]];}),"🎅 Lasse im Radio");}
  if(segs.length>c&&t>3600){}}
 var last=segs[segs.length-1];last.d=3600-last.s;if(last.d<4){segs.pop();var pr=segs[segs.length-1];pr.d=3600-pr.s;}
 return segs;}
var cache={};function sched(H){if(!cache[H]){cache[H]=build(H);var ks=Object.keys(cache);if(ks.length>4)delete cache[ks[0]];}return cache[H];}
function which(now){var H=Math.floor(now/HR),off=(now-H*HR)/1000,sc=sched(H),s=sc[sc.length-1],idx=sc.length-1;for(var i=0;i<sc.length;i++)if(off>=sc[i].s&&off<sc[i].s+sc[i].d){s=sc[i];idx=i;break;}var nx=sc[idx+1]||sched(H+1)[0];return{H:H,off:off,seg:s,idx:idx,next:nx};}
var AC=null,comp,out,nb,song=null;
function ctx(){if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();comp=AC.createDynamicsCompressor();out=AC.createGain();out.gain.value=.85;comp.connect(out);out.connect(AC.destination);nb=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(AC.state==="suspended")AC.resume();}
function envl(g,t,a,d,v){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);}
function osc(ty,f,t,d,v,dest,o){o=o||{};var x=AC.createOscillator(),g=AC.createGain();x.type=ty;x.frequency.setValueAtTime(f,t);if(o.f2)x.frequency.exponentialRampToValueAtTime(o.f2,t+d*.5);if(o.lp){var fl=AC.createBiquadFilter();fl.type="lowpass";fl.frequency.value=o.lp;x.connect(fl);fl.connect(g);}else x.connect(g);envl(g,t,o.a||.005,d,v);g.connect(dest);x.start(t);x.stop(t+d+.05);}
function noise(t,d,v,dest,ty,f){var s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=nb;fl.type=ty;fl.frequency.value=f;s.connect(fl);fl.connect(g);envl(g,t,.002,d,v);g.connect(dest);s.start(t,Math.random()*.5);s.stop(t+d+.05);}
function hz(m){return 440*Math.pow(2,(m-69)/12);}
function ply(e,t,dest){switch(e.k){case"bell":osc("triangle",hz(e.n),t,e.d,e.v,dest);osc("sine",hz(e.n)*2,t,e.d*.6,e.v*.35,dest);break;case"pluck":osc("square",hz(e.n),t,e.d,e.v,dest,{lp:1400});break;case"pad":osc("sine",hz(e.n),t,e.d,e.v,dest,{a:.5});osc("sine",hz(e.n)*1.004,t,e.d,e.v,dest,{a:.5});break;case"bass":osc("sawtooth",hz(e.n),t,e.d,e.v,dest,{lp:450});break;case"lead":osc("sawtooth",hz(e.n),t,e.d,e.v,dest,{lp:2600});break;case"brass":osc("sawtooth",hz(e.n),t,e.d,e.v,dest,{lp:1900,a:.01});break;case"kick":osc("sine",150,t,.22,e.v,dest,{f2:45});break;case"hat":noise(t,.05,e.v,dest,"highpass",7000);break;case"clap":noise(t,.12,e.v,dest,"bandpass",1500);break;case"shake":noise(t,.08,e.v,dest,"highpass",9000);break;case"boom":noise(t,.9,e.v,dest,"bandpass",900);break;}}
function gen(sg){var ev=[];function E(k,t,n,d,v){ev.push({k:k,t:t,n:n,d:d,v:v});}
 if(sg.cls){var tt=0,c=sg.cls;c.t.forEach(function(n){var d=n[1]*c.u;E("bell",tt,MID[n[0]],d*1.1,.14);tt+=d;});return ev;}
 var r=rngf(sg.seed),bl=240/sg.bpm,root=pick(r,[57,60,62,65,67]),pr=pick(r,[[0,7,9,5],[0,9,5,7],[0,5,7,5],[9,5,0,7]]),pent=[0,2,4,7,9],st=sg.style,idx=5+Math.floor(r()*3);
 function nt(i){var o=Math.floor(i/5),k=((i%5)+5)%5;return pent[k]+12*o;}
 function motif(){var m=[];for(var i=0;i<8;i++){if(r()<.28)m.push(null);else{idx+=pick(r,[-2,-1,-1,0,1,1,2]);idx=Math.max(2,Math.min(11,idx));m.push(idx);}}return m;}
 var mA=motif(),mB=motif();
 for(var b=0;b<sg.bars;b++){var t0=b*bl,cr=pr[b%4],tones=[cr,cr+(cr===9?3:4),cr+7],m=(b%4<2)?mA:mB,eb=bl/8,intro=b<4,brk=(st==="banger"||st==="neujahr")&&b>=sg.bars-12&&b<sg.bars-8,i;
  if(b%8>=4&&r()<.35)m=motif();
  tones.forEach(function(x){E("pad",t0,root+x,bl*.98,st==="weihnacht"?.035:.025);});
  if(st==="weihnacht"){for(i=0;i<8;i++){if(m[i]!==null&&b>=2)E("bell",t0+i*eb,root+12+nt(m[i]),.8,.09);E("shake",t0+i*eb,0,.08,i%2?.01:.018);}E("pluck",t0,root-12+cr,bl*.5,.08);E("pluck",t0+bl/2,root-12+cr+7,bl*.4,.06);}
  else if(st==="wichtel"){for(i=0;i<8;i++){if(m[i]!==null)E("bell",t0+i*eb,root+12+nt(m[i]),.5,.09);E("shake",t0+i*eb,0,.08,.014);E("pluck",t0+i*eb,root-12+(i%4===2?cr+7:cr),eb*.8,.07);}for(i=0;i<4;i+=2)E("kick",t0+i*bl/4,0,.2,.28);}
  else{var drums=!intro&&!brk;for(i=0;i<4;i++){if(drums)E("kick",t0+i*bl/4,0,.2,st==="banger"?.5:.42);if(!brk||i===0&&false){}E("hat",t0+i*bl/4+bl/8,0,.05,drums?.06:.04);if(drums&&(i===1||i===3))E("clap",t0+i*bl/4,0,.12,.16);}
   if(brk)for(i=0;i<16;i++)E("hat",t0+i*bl/16,0,.04,.03+i*.002);
   if(brk&&b===sg.bars-12)E("boom",t0,0,.9,.12);
   if(st==="banger"){for(i=0;i<8;i++){if(drums)E("bass",t0+i*eb,root-24+cr+(i%2?12:0),eb*.85,.22);if(!intro&&!brk&&m[i]!==null)E("lead",t0+i*eb,root+12+nt(m[i]),eb*.9,.07);}}
   else{for(i=0;i<8;i++){if(drums&&i%2===0)E("bass",t0+i*eb,root-24+cr,eb*1.6,.2);if(m[i]!==null)E("bell",t0+i*eb,root+12+nt(m[i]),.6,.09);}
    if(drums)[1,4,6].forEach(function(q){tones.forEach(function(x){E("brass",t0+q*eb,root+x,eb*.9,.03);});});
    if(b>0&&b%8===0){E("boom",t0,0,.9,.1);}}}
 }
 ev.sort(function(a,b){return a.t-b.t;});return ev;}
var ON=false,cur={key:null,li:-1},mus=null,sp=null,voices=[];
function loadVoices(){try{voices=speechSynthesis.getVoices().filter(function(v){return/^de/i.test(v.lang);});}catch(e){voices=[];}}
loadVoices();try{speechSynthesis.onvoiceschanged=loadVoices;}catch(e){}
var FN=["anna","petra","marlene","vicki","helena","katja","lena","sandy","shelley","flo"],MN=["markus","yannick","hans","martin","reed","eddy","rocko","grandpa"];
function voiceFor(w){var c=VC[w];if(!voices.length)return null;var pool=voices.filter(function(v){var n=v.name.toLowerCase(),f=FN.some(function(x){return n.indexOf(x)>=0}),m=MN.some(function(x){return n.indexOf(x)>=0});return c.g==="f"?(f||!m):(m||!f);});if(!pool.length)pool=voices;return pool[c.i%pool.length];}
function say(w,txt){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(txt),c=VC[w];u.lang="de-DE";var v=voiceFor(w);if(v)u.voice=v;u.pitch=c.p;u.rate=c.r;speechSynthesis.speak(u);}catch(e){}}
function stopMusic(){if(mus){var g=mus.g;try{g.gain.setTargetAtTime(0,AC.currentTime,.08);setTimeout(function(){try{g.disconnect();}catch(e){}},600);}catch(e){}mus=null;}}
function startMusic(sg,off){ctx();var g=AC.createGain();g.gain.value=1;g.connect(comp);var ev=gen(sg);var base=AC.currentTime-off;mus={g:g,ev:ev,i:0,base:base,dur:sg.dur};while(mus.i<ev.length&&ev[mus.i].t+ev[mus.i].d<off)mus.i++;}
function pump(){if(!mus||!AC)return;var pos=AC.currentTime-mus.base,e;while(mus.i<mus.ev.length&&mus.ev[mus.i].t<=pos+4){e=mus.ev[mus.i++];var w=mus.base+e.t;if(w<AC.currentTime)w=AC.currentTime+.01;ply(e,w,mus.g);}
 var left=mus.dur-pos;if(left<2.2&&!mus.fade){mus.fade=1;mus.g.gain.setTargetAtTime(0,AC.currentTime,.6);}}
function sparkle(){ctx();var t=AC.currentTime+.05;[84,88,91,96].forEach(function(n,i){ply({k:"bell",n:n,d:.9,v:.1},t+i*.12,comp);});}
function render(w,force){var sg=w.seg,key=w.H+":"+sg.s,rel=w.off-sg.s,li=-1,i;
 if(sg.ls)for(i=0;i<sg.ls.length;i++)if(rel>=sg.ls[i].o)li=i;
 var nx=w.next,nt=nx.ty==="music"?"🎵 "+nx.song.name:nx.label||"";
 if(key!==cur.key||li!==cur.li||force){var spk="",body="",title="";
  if(sg.ty==="music"){title=sg.song.name;spk="von "+sg.song.artist+" · "+({weihnacht:"Weihnachtsmusik",wichtel:"Wichteldorf-Hit",banger:"Party-Banger",neujahr:"Neujahrs-Knaller",klassik:"Klassiker"})[sg.song.style];body="";}
  else{title=sg.label;var cl=li>=0?sg.ls[li]:null;spk=cl?WHO[cl[0]]:"";for(i=0;i<=li;i++){body+="<p><b>"+(WHO[sg.ls[i][0]]||"").split(" ").slice(1).join(" ")+":</b> "+sg.ls[i][1]+"</p>";}}
  $("#rlab").textContent=sg.ty==="music"?"🎵 Musik":sg.label;$("#rtit").textContent=title;$("#rspk").textContent=spk;$("#rbody").innerHTML=body;
  var pz=zp(w.H*HR+w.off*1000);$("#rshow").textContent="Jetzt: "+showName(pz.h);
  if(sg.poll)pollUI(sg);}
 $("#rbar").style.width=Math.min(100,rel/sg.d*100)+"%";var rem=Math.max(0,Math.round(sg.d-rel));$("#rnext").textContent="Noch "+Math.floor(rem/60)+":"+zpad(rem%60)+" · Als Nächstes: "+nt;}
function pollUI(sg){var P=sg.poll,votes=WL.g("wl_rv",{}),v=votes[P.id],pc=P.pc,a=pc,b=100-pc,h="";if(v!==undefined)h='<p class="note">Deine Stimme ist dabei.</p>';else h='<div class="row"><button class="btn" data-v="0">'+P.q[1]+'</button><button class="btn ghost" data-v="1">'+P.q[2]+'</button></div><p class="note">Stimm mit ab und hol dir einen Stern.</p>';
 var box=document.createElement("div");box.innerHTML='<div class="prow"><span>'+P.q[1]+'</span><i style="width:'+a+'%"></i><b>'+a+' %</b></div><div class="prow"><span>'+P.q[2]+'</span><i style="width:'+b+'%"></i><b>'+b+' %</b></div>'+h;$("#rbody").appendChild(box);
 box.addEventListener("click",function(e){var x=e.target.closest("button");if(!x||x.dataset.v===undefined)return;var vs=WL.g("wl_rv",{});if(vs[P.id]===undefined){vs[P.id]=+x.dataset.v;WL.s("wl_rv",vs);WL.add(1);}cur.li=-9;});}
function tick(){var now=Date.now(),w=which(now),sg=w.seg,key=w.H+":"+sg.s,rel=w.off-sg.s,li=-1,i;
 if(sg.ls)for(i=0;i<sg.ls.length;i++)if(rel>=sg.ls[i].o)li=i;
 var newSeg=key!==cur.key,newLine=li!==cur.li&&li>=0&&!newSeg||(newSeg&&li>=0);
 if(newSeg||li!==cur.li)render(w,false);
 if(ON){
  if(newSeg){stopMusic();try{speechSynthesis.cancel();}catch(e){}if(sg.ty==="music")startMusic(sg.song,rel);else if(sg.ty==="id"&&rel<2)sparkle();}
  if((newSeg||li!==cur.li)&&li>=0&&sg.ls){var l=sg.ls[li];if(rel-l.o<2.2)say(l[0],l[1]);}
  pump();}
 cur.key=key;cur.li=li;if(!(newSeg||li!==cur.li))render(w,false);}
function setOn(v){ON=v;$("#rbtn").textContent=v?"⏻ Ausschalten":"🎧 Einschalten";$("#rair").classList.toggle("on",v);$("#req").classList.toggle("on",v);if(v){ctx();try{var u=new SpeechSynthesisUtterance(" ");u.volume=0;speechSynthesis.speak(u);}catch(e){}cur.key=null;cur.li=-1;}else{stopMusic();try{speechSynthesis.cancel();}catch(e){}}}
$("#rbtn").onclick=function(){setOn(!ON);};
var pgh="";SHOWS.forEach(function(s,i){pgh+='<div class="pg" data-i="'+i+'"><b>'+zpad(s[0]%24)+":00 – "+zpad(s[1]%24)+":00</b> "+s[2]+"</div>";});$("#rprog").innerHTML=pgh;
function hi(){var pz=zp(Date.now()),n=showName(pz.h);document.querySelectorAll("#rprog .pg").forEach(function(x){x.classList.toggle("on",x.textContent.indexOf(n)>=0);});}
setInterval(function(){tick();},250);setInterval(hi,30000);hi();tick();
window.addEventListener("pagehide",function(){try{speechSynthesis.cancel();}catch(e){}});
})();
