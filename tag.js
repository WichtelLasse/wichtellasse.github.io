/* Lasses Tagesplan – gemeinsam für Live-Karte und Tagebuch */
(function(){
"use strict";
const hsh=s=>{let x=2166136261;for(const ch of String(s)){x^=ch.charCodeAt(0);x=Math.imul(x,16777619)>>>0;}return x;};
const pick=(arr,k)=>arr[hsh(k)%arr.length];
const rot=(arr,day,slot,per)=>{const n=Math.round(Date.parse(day+'T00:00:00Z')/864e5);const ord=arr.map((x,i)=>i).sort((a,b)=>hsh('o'+a+arr.length)-hsh('o'+b+arr.length));return arr[ord[((n*per+slot)%arr.length+arr.length)%arr.length]];};
const pad=n=>String(n).padStart(2,'0');
const TZ='Europe/Zurich';
function zParts(ms){const o={};new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',weekday:'short',hourCycle:'h23'}).formatToParts(new Date(ms)).forEach(p=>o[p.type]=p.value);return o;}
/* Zürcher Ortszeit -> ms (Winterzeit +1h gilt Nov–März) */
const Z=(y,mo,d,h,mi)=>Date.UTC(y,mo-1,d,h-1,mi||0);
const dnum=day=>Math.round(Date.parse(day+'T00:00:00Z')/864e5);
const dayStr=ms=>{const p=zParts(ms);return p.year+'-'+p.month+'-'+p.day;};

/* ---------- Leute ---------- */
const TEACH={sch:'Frau Eisbeere',tar:'Frau Eisbeere',mat:'Herrn Zahlenzwirn',geo:'Herrn Zahlenzwirn',ren:'Herrn Brummel',spo:'Herrn Brummel',nlp:'Professorin Polaris',leb:'Professorin Polaris',glo:'Frau Glöckli',wun:'Frau Glöckli',kuf:'Herrn Kufenbrecht',wer:'Herrn Kufenbrecht',ges:'Frau Pergament',men:'Frau Pergament'};
const SUBJ={
 sch:['Schleichen für Fortgeschrittene',['über knarrende Holzböden schleichen','Schleichen mit vollen Taschen','rückwärts schleichen','Schleichen auf Neuschnee ohne Spuren','an einer schlafenden Katze vorbeischleichen','Treppen lautlos hinauf','Türen öffnen ohne Quietschen']],
 tar:['Tarnen und Verstecken',['sich hinter einem Kissen unsichtbar machen','Verstecke in Bücherregalen','stillhalten wie eine Weihnachtskugel','Tarnfarben im Winter','die besten Verstecke in einer Küche','in einer Mütze verschwinden']],
 mat:['Schneeflocken-Mathematik',['Schneeflocken mit sechs Armen zählen','Geschenke gerecht aufteilen','wie viele Kekse passen in eine Dose','Rentier-Kilometer ausrechnen','Wunschzettel nach Grösse ordnen','Kopfrechnen im Schneesturm']],
 geo:['Geschenkpapier-Geometrie',['Ecken sauber falten','runde Geschenke einpacken','mit möglichst wenig Papier auskommen','Schleifen binden, die halten','Kugeln einpacken (unmöglich?)','Karos gerade ausrichten']],
 ren:['Rentierkunde',['wie man ein nervöses Rentier beruhigt','was Rentiere am liebsten fressen','Hufpflege im Winter','Rentiersprache: Schnauben verstehen','warum Rentiere im Winter Haare wechseln','Geweihe richtig putzen']],
 spo:['Schneeschuhsport',['Wettlauf um den Dorfteich','Schneeschuh-Staffel','Weitsprung in den Pulverschnee','Orientierungslauf im Dunkeln','Hindernislauf über Schneewälle']],
 nlp:['Nordlicht-Physik',['warum das Nordlicht grün leuchtet','Sonnenwind erklärt','Nordlicht-Vorhersage selber machen','Farben im Nordlicht','warum es am Nordpol so lange dunkel ist']],
 leb:['Lebkuchen-Chemie',['warum Lebkuchen weich bleibt','Zuckerguss, der nicht tropft','Gewürze richtig mischen','Honigteig ruhen lassen','Lebkuchenhäuser, die nicht einstürzen']],
 glo:['Glockenspiel',['ein Lied mit drei Glocken','im Takt bleiben','leise spielen, damit niemand aufwacht','Weihnachtslieder in zwei Stimmen','Glocken stimmen']],
 wun:['Wunschzettel-Lesen',['krakelige Schrift entziffern','Wunschzettel mit Zeichnungen verstehen','Wünsche sortieren','Briefe aus fernen Ländern','was ein Wunsch wirklich bedeutet']],
 kuf:['Kufen-Technik',['Kufen schleifen','Schlitten-Bremsen prüfen','Kufenwachs selber machen','schnelle Kurven auf Eis','Wichtelmobil-Wartung']],
 wer:['Spielzeug-Werken',['Holzpferdchen schnitzen','Teddybären Augen annähen','Kreisel drechseln','Puppenhaus-Möbel bauen','Spieluhren reparieren','Holzeisenbahn zusammensetzen']],
 ges:['Wichtel-Geschichte',['die ersten Wichtel am Nordpol','berühmte Wichtel-Erfindungen','wie das Wichtelmobil erfunden wurde','die grosse Schneesturm-Weihnacht','alte Wichtelbräuche']],
 men:['Menschenkunde',['wie Menschenkinder Weihnachten feiern','Menschen schlafen nachts (meistens)','Schweizer Bräuche: Samichlaus','was ein Znüni ist','Menschenhäuser von innen','warum Menschen Socken verlieren']]
};
/* Stundenplan Mo–Fr: 4 Lektionen am Morgen, Nachmittag (Mi frei, Fr 2) */
const PLAN={Mon:[['sch','mat','mat','ges'],['ren','ren','glo']],Tue:[['geo','men','leb','leb'],['spo','spo','wun']],Wed:[['nlp','mat','tar','men'],[]],Thu:[['wer','wer','ges','sch'],['kuf','kuf','glo']],Fri:[['wun','geo','nlp','tar'],['mat','sch']]};
const LT=[[480,525],[530,575],[600,645],[650,695],[810,855],[860,905],[910,955]];

/* ---------- Essen ---------- */
const ZMORGE=['Haferbrei mit Moltebeeren','Zopf mit Butter und Konfitüre','Birchermüesli','Rührei mit Brot','Griessbrei mit Zimt','Knäckebrot mit Käse','Pfannkuchen mit Ahornsirup','Joghurt mit Nüssen und Honig','Toast mit Honig','Apfel-Porridge','Brötchen mit Preiselbeerkonfi','Grießschnitten','heisse Schokolade und ein Gipfeli','Fladenbrot mit Frischkäse'];
const ZMITTAG=['Kartoffelsuppe mit Wienerli','Älplermagronen mit Apfelmus','Rösti mit Spiegelei','Gerstensuppe','Spätzli mit Rahmsauce','Fischstäbli mit Kartoffelstock','Kürbissuppe mit Brot','Gemüsewähe','Hörnli mit Gehacktem','Linsensuppe','Polenta mit Pilzsauce','Lachs mit Salzkartoffeln','Chäshörnli','Ofenkartoffeln mit Quark','Risotto mit Erbsen','Gemüse-Eintopf','Fleischkäse mit Kartoffelsalat','Käseschnitte','Pastetli','Tomatensuppe mit Grilled Cheese','Kartoffelgratin','Knöpfli mit Rotkraut','Fischsuppe','Schinkengipfeli mit Salat'];
const ZNACHT=['Bratkartoffeln mit Ei','Gemüsesuppe mit Brot','Käsefondue (ein kleines)','Raclette','Wurst mit Senf und Brot','Pizza aus dem Holzofen','Omelette mit Kräutern','Pilzrisotto','Fischknusperli','Rotkraut mit Kastanien','Gefüllte Kartoffeln','Hafersuppe','Spaghetti mit Tomatensauce','Brot mit Käse und Rüebli','Erbsensuppe','Kartoffelpuffer mit Apfelmus','Ofengemüse','Gerstenrisotto','Fleischbällchen mit Preiselbeeren','Wurstkäsesalat'];
const MILCHREIS='Milchreis mit Zimt und Zucker';
function food(day){const n=dnum(day);return {zm:pick(ZMORGE,'zm'+day),mi:ZMITTAG[(n*7+3)%ZMITTAG.length],zn:n%3===0?MILCHREIS:ZNACHT[(n*7+1)%ZNACHT.length],milch:n%3===0};}

/* ---------- Tätigkeiten ---------- */
/* o = draussen, i = drinnen */
const NP_ACT=[
['füttert die Rentiere im Stall','o'],['mistet den Rentierstall aus','o'],['hilft in der Poststelle beim Wunschzettel-Sortieren','i'],['repariert mit Herrn Kufenbrecht einen Schlitten','i'],['schleift die Kufen seines Schlittens','i'],['poliert die Dorfglocken','o'],['verziert Lebkuchen in der Backstube','i'],['zieht Kerzen in der Kerzenwerkstatt','i'],['schnitzt ein Holzpferdchen','i'],['näht einem Teddybär ein neues Auge an','i'],['bessert sein Iglu im Garten aus','o'],['macht Schlittschuhrunden auf dem Dorfteich','o'],['misst die Eiszapfen am Dach','o'],['geht mit Schneeschuhen um den Dorfteich','o'],['hackt Holz für den Ofen','o'],['stapelt Brennholz','o'],['sitzt bei Franz am Computer','i'],['funkt mit Franz über das Wichtel-Funkgerät','i'],['spielt Schach mit Oma Flocke','i'],['hilft Oma Flocke beim Wolle-Aufwickeln','i'],['bemalt Packpapier mit Sternen','i'],['sortiert Briefmarken aus aller Welt','i'],['probt mit dem Wichtelchor','i'],['übt Glockenspiel','i'],['macht eine Schneeballschlacht mit Tobi','o'],['baut mit Ida eine Schneeburg','o'],['lernt mit Ida für die Akademie','i'],['wachst die Ski','i'],['liest ein Buch über die Schweiz','i'],['strickt an seinem neuen Schal','i'],['räumt sein Zimmer auf','i'],['putzt die Fenster vom Wichtelhaus','i'],['hilft in der Weihnachtswerkstatt beim Einpacken','i'],['testet Kreisel in der Werkstatt','i'],['malt eine Karte vom Wichteldorf','i'],['beobachtet mit Professorin Polaris den Himmel','o'],['geht mit Malin Eisfischen','o'],['fährt mit Jari Schlitten am Glöckchenhügel','o'],['bringt Oma Flocke Brennholz','o'],['hilft beim Schneeschaufeln auf der Dorfstrasse','o'],['füllt die Vogelhäuschen auf','o'],['baut einen Schneemann vor dem Haus','o'],['repariert seine Taschenlampe','i'],['übt Schleichen im Flur','i'],['backt Zimtschnecken','i'],['besucht seine Familie am anderen Ende vom Dorf','o'],['flickt seine Handschuhe','i'],['putzt seine Stiefel','i'],['hilft dem Wichtelchauffeur in der Garage','i'],['trägt Pakete zur Poststelle','o'],['sammelt Tannenzapfen im Wald','o'],['blättert in den Büchern der Wichtel-Akademie','i'],['löst ein Kreuzworträtsel','i'],['spielt Wichtel-Memory mit Tobi','i'],['hört Geschichten bei Oma Flocke','i'],['schreibt neue Rätsel für seine Website','i'],['ölt die Türscharniere, damit nichts quietscht','i'],['zählt die Vorräte in der Speisekammer','i'],['zeichnet Schneeflocken unter der Lupe','i'],['schaut beim Dorfschmied zu','i']];
const NP_EVE=['liest im Bett noch ein Kapitel','spielt mit Oma Flocke ein Kartenspiel','hört Radio Nordpol','trinkt Tee am Ofen','schaut aus dem Fenster in die Polarnacht','schreibt Tagebuch','legt die Kleider für morgen bereit','macht Hausaufgaben am Küchentisch','sortiert sein Notizbuch','funkt kurz mit Franz','strickt ein paar Reihen am Schal','löst ein Rätsel'];
const SLEEP=['schläft tief und fest','schläft und schnarcht ganz leise','träumt von Schneeflocken','dreht sich im Schlaf um','schläft, die Mütze über den Ohren','träumt vom Milchreis'];
const WAKE=['steht auf und streckt sich','sucht verschlafen seine Mütze','wäscht sich das Gesicht mit kaltem Wasser','macht das Bett und gähnt'];
const SHOP=['kauft im Wichtel-Laden Zimt und Mehl','holt im Wichtel-Laden frische Milch','kauft Moltebeeren und Haferflocken','kauft Kerzen und Streichhölzer','holt Brot und Käse im Wichtel-Laden','kauft Reis für den Milchreis','kauft Wolle für Oma Flocke','holt Briefmarken in der Poststelle'];
const INDOOR_ALT=['bleibt wegen des Wetters drinnen und','wartet drinnen, bis das Wetter besser wird, und'];

/* Volketswil-Nächte */
const VK_SLEEP=['schläft hinter der Wichteltür','schläft tief, die Mütze über den Augen','schnarcht ganz leise hinter der Wichteltür','träumt vom Nordpol','dreht sich im Schlaf um','schläft, draussen ist es hell und laut','schläft und murmelt etwas von Zimt','schläft wie ein Murmeltier'];
const VK_TASK=[
['schreibt seinen Nachtbericht an den Nordpol','w'],['funkt leise mit Franz','w'],['macht Fernaufgaben für die Wichtel-Akademie','w'],['zeichnet eine Karte von seinem neuen Zuhause','w'],['schreibt Tagebuch','w'],['liest einen Brief von Oma Flocke','w'],
['putzt die Wichteltür von innen','h'],['heizt seinen Mini-Ofen an','h'],['macht sein Bett','h'],['wäscht seine Mütze und hängt sie auf','h'],['räumt hinter der Wichteltür auf','h'],['flickt seinen Schal','h'],['ölt das Türscharnier, damit nichts quietscht','h'],
['schleicht leise in die Küche für einen kleinen Snack','s'],['schaut am Fenster in den Nachthimmel','s'],['geht kurz in den Garten und schnuppert die Nachtluft','s'],['zählt vom Fenster aus die Sterne','s'],['nascht ein Brotkrümelchen','s'],['schaut den Schneeflocken vor dem Fenster zu','s'],['lauscht, ob alle schlafen','s'],
['übt Schleichen auf dem Teppich','h'],['sortiert seine Briefmarken','h'],['strickt an seinem Schal weiter','h'],['wischt Staub hinter der Wichteltür','h'],['füllt seine Wärmflasche auf','h'],['repariert eine Schublade in seinem Mini-Schrank','h'],
['liest Post aus dem Wichteldorf','w'],['löst eine Rechenaufgabe von Herrn Zahlenzwirn','w'],['übt leise Glockenspiel (ganz, ganz leise)','w'],['zeichnet Schneeflocken für Professorin Polaris','w'],['schreibt einen Brief an Ida','w'],
['schaut, ob der Mond schon untergegangen ist','s'],['wärmt sich die Hände am Heizkörper','s'],['schaut vom Fenstersims auf die Strassenlampen','s']];

/* Kleine Überraschungen (Nacht dieses Datums, 1–5 Uhr) */
const SURP={
'2026-11-30':{t:'hängt einen winzigen Zettel an die Wichteltür',diy:'Wichteltür aufstellen (falls noch nicht) und einen winzigen Zettel daran kleben: «Bin angekommen! Psst … Lasse»'},
'2026-12-02':{t:'streut ganz leise Mehl und hinterlässt Fussspuren',diy:'Mit dem Finger oder einem Wattestäbchen ein paar winzige Fussspuren aus Mehl vor die Wichteltür tupfen (ca. 30 cm Spur)'},
'2026-12-04':{t:'schreibt einen Rätselbrief für Micha',diy:'Kleinen Brief an die Wichteltür legen: «Rätsel: Was wird nasser, je mehr es trocknet? Antwort an wichtel.lasse@hotmail.com – Lasse» (Lösung: ein Handtuch)'},
'2026-12-06':{t:'legt etwas für den Samichlaustag vor die Tür',diy:'Samichlaus: 1 Mandarine, ein paar Nüsse und ein Stück Schoggi vor die Wichteltür legen'},
'2026-12-09':{t:'baut etwas Kleines aus Zucker',diy:'Mini-Iglu aus ca. 10–15 Zuckerwürfeln vor die Wichteltür bauen'},
'2026-12-11':{t:'holt sich einen Wachposten für die Nacht',diy:'Ein Kuscheltier oder eine Figur von Micha neben die Wichteltür setzen, als würde es Wache halten'},
'2026-12-13':{t:'bastelt etwas für den dritten Advent',diy:'Einen Papierstern (gefaltet oder ausgeschnitten) an oder neben die Wichteltür legen'},
'2026-12-16':{t:'baut einen kleinen Schneemann, der nicht schmilzt',diy:'Mini-Schneemann aus 3 Marshmallows (mit Zahnstocher zusammengesteckt) vor die Wichteltür stellen'},
'2026-12-18':{t:'steckt ein Fähnchen auf',diy:'Fähnchen aus Zahnstocher und Papier vor die Tür: «Noch 6 Tage bis Weihnachten! – L.»'},
'2026-12-20':{t:'legt eine süsse Spur für den vierten Advent',diy:'3 kleine Schoggistücke als Spur von der Wichteltür weg legen'},
'2026-12-23':{t:'spielt einen kleinen Wichtelstreich',diy:'Die Schnürsenkel von Michas Schuhen locker zusammenknoten (Wichtelstreich)'},
'2026-12-24':{t:'legt einen Abschiedsbrief hin',diy:'Abschiedsbrief und eine Zimtstange vor die Wichteltür: «Ich fahre heute zu meiner Familie an den Nordpol. Danke für den schönsten Platz der Welt. Frohe Weihnachten! Dein Lasse»'},
'2027-01-01':{t:'streut Konfetti vor der Wichteltür',diy:'Konfetti vor und um die Wichteltür streuen und einen Zettel hinlegen: «Es guets Neus! Ich bin schon unterwegs zum Südpol. Lasse»'}
};

/* Weihnachtsferien am Nordpol (24.–31.12.) */
const XMAS={
'2026-12-24':[[480,540,'kommt im Wichteldorf an und fällt seiner Familie in die Arme'],[540,840,'schläft sich nach der Reise aus'],[840,960,'backt mit Mama Zimtsterne'],[960,1080,'schmückt mit seiner Schwester Pia den Baum'],[1080,1260,'feiert Heiligabend mit seiner Familie'],[1260,1440,'schläft glücklich ein']],
'2026-12-25':[[0,540,'schläft lange'],[540,630,'frühstückt mit der ganzen Familie'],[630,780,'macht mit Pia einen Schneespaziergang'],[780,870,'isst Weihnachtsessen bei Opa Knut'],[870,1080,'spielt mit der Familie Brettspiele'],[1080,1260,'singt mit dem Wichtelchor am Dorfbaum'],[1260,1440,'schläft tief und fest']],
'2026-12-31':[[0,480,'schläft tief und fest'],[480,540,'frühstückt'],[540,720,'schneidet Konfetti aus buntem Papier'],[720,780,'isst zu Mittag'],[780,960,'verabschiedet sich von seiner Familie'],[960,1140,'feiert mit dem Dorf ein frühes Silvester'],[1140,1290,'packt Sonnenbrille und Sonnencreme für den Südpol'],[1290,1320,'steigt ins Wichtelmobil']]};
const HOL_ACT=['fährt mit Pia Schlitten','geht mit Papa Eisfischen','hilft in der Werkstatt beim grossen Aufräumen','lässt die Rentiere nach der langen Nacht ausruhen','baut mit Pia ein Iglu','spielt Karten mit Opa Knut','besucht Oma Flocke','macht mit Ida und Tobi eine Schneeballschlacht','schaut mit der Familie das Nordlicht an','liest Pia eine Geschichte vor','backt mit Mama Brot','erzählt der Familie von Volketswil','packt die Koffer für den Südpol','sortiert Fotos von der Reise'];

/* Südpol */
const SP_ACT=[
['rutscht mit den Pinguinen auf dem Bauch','o'],['zählt Pinguine (er kommt immer auf eine andere Zahl)','o'],['besucht die Forschungsstation am Südpol','i'],['schaut beim grossen Teleskop vorbei','o'],['baut eine Schneeskulptur','o'],['sägt Eisblöcke für sein Ferien-Iglu','o'],['schreibt Postkarten an den Nordpol','i'],['putzt seine Sonnenbrille','i'],['macht eine Schlittenfahrt mit Kapitän Watschel','o'],['übt mit Frieda Pinguin-Watscheln','o'],['legt sich in die Sonne (sie geht hier nie unter)','o'],['läuft einmal um den Südpol herum (dauert drei Sekunden)','o'],['spielt Eis-Curling mit Pingo','o'],['schaut sich Eisbohrkerne an','i'],['liest im Ferien-Iglu','i'],['funkt mit Franz zum Nordpol','i'],['trinkt Tee mit den Forschern','i'],['sucht den Schatten (es gibt keinen)','o'],['malt das Eis in allen Blautönen','i'],['macht ein Nickerchen','i'],['baut eine Schneerutschbahn','o'],['macht Fotos vom Polarhimmel','o'],['cremt sich mit Sonnencreme ein','i'],['übt Schleichen auf dem knirschenden Eis','o'],['sortiert seine Muschelsammlung aus Kapstadt','i'],
['spielt mit Pingo Verstecken (Pinguine sind schlecht darin)','o'],['hilft den Forschern, Schnee für Messungen zu schaufeln','o'],['schaut zu, wie ein Flugzeug auf dem Eis landet','o'],['backt in der Stationsküche Zimtschnecken für alle','i'],['spielt mit den Forschern Tischtennis','i'],['liest in der Stationsbibliothek','i'],['zeichnet eine Karte vom Südpol','i'],['misst mit einem Thermometer, wie kalt es ist','o'],['macht einen Schneeengel','o'],['schreibt einen langen Brief an Oma Flocke','i'],['wäscht seine Socken im Iglu','i'],['übt Glockenspiel für die Pinguine','i'],['baut mit Frieda eine Eisbahn','o'],['beobachtet Schneefüchse? Nein, die gibt es hier nicht. Er beobachtet Schnee.','o'],['geht mit Kapitän Watschel zum Pinguin-Fischmarkt','o'],['flickt seine Sonnenmütze','i']];

/* ---------- Reisen ---------- */
const RN=[ /* Nordpol -> Volketswil */
{n:'Wichteldorf',lat:90,lon:15.63,stop:0},{n:'Spitzbergen',lat:78.22,lon:15.63,stop:8},{n:'Tromsø',lat:69.65,lon:18.96,stop:20},{n:'Oslo',lat:59.91,lon:10.75,stop:15},{n:'Hamburg',lat:53.55,lon:10.0,stop:12},{n:'Frankfurt',lat:50.11,lon:8.68,stop:25},{n:'Volketswil',lat:47.39,lon:8.69,stop:0}];
const RS=[ /* Volketswil -> Südpol (Pinguin-Express) */
{n:'Volketswil',lat:47.39,lon:8.69,stop:0},{n:'Rom',lat:41.9,lon:12.5,stop:15,v:2900},{n:'Kairo',lat:30.04,lon:31.24,stop:20,v:2900},{n:'Khartum',lat:15.5,lon:32.56,stop:10,v:2900},{n:'Nairobi',lat:-1.29,lon:36.82,stop:25,v:2900},{n:'Kapstadt',lat:-33.92,lon:18.42,stop:600,v:2900},{n:'Küste der Antarktis',lat:-70.65,lon:-8.25,stop:690,v:2900},{n:'Pinguin-Rast',lat:-80.5,lon:-4,stop:60,v:150},{n:'Südpol',lat:-90,lon:0,stop:0,v:150}];
const RB=[ /* Südpol -> Nordpol */
{n:'Südpol',lat:-90,lon:0,stop:0},{n:'Pinguin-Rast',lat:-80.5,lon:-4,stop:60,v:150},{n:'Küste der Antarktis',lat:-70.65,lon:-8.25,stop:600,v:150},{n:'Kapstadt',lat:-33.92,lon:18.42,stop:45,v:2900},{n:'Nairobi',lat:-1.29,lon:36.82,stop:20,v:2900},{n:'Kairo',lat:30.04,lon:31.24,stop:20,v:2900},{n:'Volketswil',lat:47.39,lon:8.69,stop:5,v:2900,fly:1},{n:'Oslo',lat:59.91,lon:10.75,stop:15,v:2900},{n:'Spitzbergen',lat:78.22,lon:15.63,stop:10,v:2900},{n:'Wichteldorf',lat:90,lon:15.63,stop:0,v:2900}];
const hav=(a,b)=>{const r=Math.PI/180,x=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;return 12742*Math.asin(Math.sqrt(x));};
/* Segmente: Bewegung nach Tempo (v) oder feste Dauer (MOVE) */
function segs(R,t0,move){let tot=0;const dk=[];for(let i=1;i<R.length;i++){dk[i]=hav(R[i-1],R[i]);tot+=dk[i];}
  const S=[];let t=t0;for(let i=1;i<R.length;i++){const mt=move?dk[i]/tot*move:dk[i]/R[i].v*3600000;S.push({k:'m',i,a:t,b:t+mt,km:dk[i]});t+=mt;if(R[i].stop){const sp=R[i].stop*60000;S.push({k:'s',i,a:t,b:t+sp});t+=sp;}}
  return {R,S,a:t0,b:t};}
const MOVE=6000000;
const TRIP_N1=segs(RN,Z(2026,11,30,0),MOVE);           // 30.11. 00:00 -> ~03:00
const TRIP_X=segs([...RN].reverse(),Z(2026,12,24,5),MOVE); // 24.12. 05:00 -> ~08:00
const TRIP_N2=segs(RN,Z(2026,12,31,22),MOVE);           // 31.12. 22:00 -> ~01:00
const TRIP_S=segs(RS,Z(2027,1,1,3));                     // 1.1. 03:00 -> 2.1. abends
const TRIP_B=segs(RB,Z(2027,2,1,8));                     // 1.2. 08:00 -> 2.2.
const AKA_START='2026-11-16', AKA_AGAIN='2027-02-08';

const TRIP_TXT={
 n:['schaut aus dem Fenster in die Nacht','zählt die Sterne über dem Wichtelmobil','kuschelt sich in die Decke','trinkt warmen Kakao aus der Thermoskanne','summt leise ein Weihnachtslied','prüft die Landkarte','sitzt vorne neben dem Chauffeur','knabbert ein Zimtplätzchen','döst mit der Mütze über den Augen'],
 x:['schaut zum Fenster hinaus, es wird langsam hell','freut sich riesig auf seine Familie','summt «Stille Nacht»','zählt, wie viele Stunden es noch bis Heiligabend sind','döst mit der Mütze über den Augen','trinkt warmen Kakao aus der Thermoskanne'],
 Rom:['fliegt über die verschneiten Alpen','schaut auf die Lichter von Mailand','zieht den Schal etwas lockerer','sucht das Mittelmeer am Horizont'],
 Kairo:['fliegt über das dunkle Mittelmeer','zieht den dicken Pulli aus, es wird warm','schaut auf die Lichter am Nil','trinkt kalten Eistee'],
 Khartum:['fliegt über die Wüste','zählt Kamele von oben','schaut dem Nil entlang','cremt sich mit Sonnencreme ein'],
 Nairobi:['fliegt über die Savanne','hält Ausschau nach Elefanten','spielt mit dem Chauffeur «Ich sehe was, was du nicht siehst»','hält die Hand in den warmen Fahrtwind'],
 Kapstadt:['fliegt über grüne Wälder und Flüsse','sieht von weitem den Ozean','spielt mit dem Chauffeur «Ich sehe was, was du nicht siehst»','trinkt kalten Eistee'],
 'Küste der Antarktis':['fliegt über den endlosen Ozean','sieht die ersten Eisberge','zieht den dicken Pulli wieder an','zählt Wale im Meer','staunt: Hier wird es gar nicht dunkel'],
 back:['fliegt Richtung Norden','schaut auf die Landkarte: noch weit bis nach Hause','döst mit der Mütze über den Augen','erzählt dem Chauffeur von den Pinguinen','sortiert seine Südpol-Fotos','zieht langsam wieder die warmen Sachen an'],
 p:['lenkt den Pinguin-Express mit Kapitän Watschel','hält sich gut fest, die Pinguine sind schnell','singt mit den Pinguinen ein Schlittenlied','zählt die Pinguine vor dem Schlitten','schaut über das endlose Eis','putzt sich Schnee von der Sonnenbrille']};
const STOP_TXT={'Spitzbergen':'streckt die Beine im Schnee und prüft mit dem Chauffeur die Kufen','Tromsø':'trinkt Kakao und staunt über das Nordlicht','Oslo':'kauft eine Zimtschnecke und sucht seine Mütze (sie sitzt auf dem Kopf)','Hamburg':'vertritt sich am Hafen die Beine','Frankfurt':'döst im Wichtelmobil, der Chauffeur trinkt Tee','Volketswil':'ist angekommen',
 'Rom':'isst ein Gelato um vier Uhr morgens (der Laden hatte extra offen)','Kairo':'sieht im Dunkeln die Umrisse der Pyramiden','Khartum':'füllt Wasser auf, es ist schon warm','Nairobi':'sieht von oben Giraffen im Morgenlicht','Kapstadt':['schaut auf den Tafelberg','sammelt Muscheln am Strand','isst Fish and Chips am Hafen','planscht mit den Füssen im kalten Atlantik','schaut den Pinguinen am Boulders Beach zu','macht ein Nickerchen im Schatten','schreibt eine Postkarte an Oma Flocke','kauft Sonnencreme nach'],
 'Küste der Antarktis':['trifft die Pinguine vom Pinguin-Express','lernt Kapitän Watschel, Frieda und Pingo kennen','hilft beim Anschirren der Pinguine','schläft eine Nacht an der Küste (die Sonne scheint trotzdem)','schläft im Zelt an der Küste','frühstückt mit den Pinguinen (Fisch? Nein danke)'],
 'Pinguin-Rast':'macht Rast, die Pinguine bekommen Fisch','Südpol':'ist da','Wichteldorf':'kommt an'};
const STOP_B={'Pinguin-Rast':'macht Rast, die Pinguine bekommen Fisch','Küste der Antarktis':['verabschiedet sich von Kapitän Watschel, Frieda und Pingo','schläft eine letzte Nacht an der Küste','packt das Wichtelmobil'],'Kapstadt':'macht kurz Pause in Kapstadt und kauft ein Glas Honig für Oma Flocke','Nairobi':'tankt in Nairobi','Kairo':'winkt den Pyramiden zu','Volketswil':'fliegt über Volketswil und winkt ganz leise','Oslo':'kauft Zimtschnecken für die Akademie','Spitzbergen':'zieht Mütze und Schal wieder fest an, es ist eisig'};
const STOP_X={'Frankfurt':'macht Pause, der Chauffeur trinkt Kaffee','Hamburg':'vertritt sich am Hafen die Beine','Oslo':'kauft Zimtschnecken für die Familie','Tromsø':'staunt ein letztes Mal über das Nordlicht','Spitzbergen':'streckt die Beine im Schnee'};

/* ---------- Tagesablauf Nordpol ---------- */
const isWd=wd=>!['Sat','Sun'].includes(wd);
function npDay(day,wd,opts){ /* gibt Liste [a,b,text,ort,flag] in Minuten zurück */
  const F=food(day),o=[],k=day;
  const aka=opts.aka&&isWd(wd);
  const act=(slot)=>rot(NP_ACT,day,slot,4);
  const eve=(slot)=>rot(NP_EVE,day,slot,2);
  const sl=(a,b,s)=>o.push([a,b,pick(SLEEP,k+s),'Wichtelhaus','sleep']);
  if(aka){
    sl(0,390,'n');o.push([390,410,pick(WAKE,k+'w'),'Wichtelhaus']);o.push([410,450,'frühstückt: '+F.zm,'Wichtelhaus']);
    o.push([450,478,hsh(k+'weg')%2?'stapft mit Ida durch den Schnee zur Akademie':'geht mit Schneeschuhen zur Wichtel-Akademie','Unterwegs']);
    const P=PLAN[wd];
    P[0].forEach((s,i)=>{const L=LT[i],T=SUBJ[s];o.push([L[0],L[1],'hat '+T[0]+' bei '+TEACH[s]+' – heute: '+pick(T[1],k+s+i),'Wichtel-Akademie','l',s]);
      if(i===1)o.push([L[1],600,'macht grosse Pause und isst sein Znüni','Wichtel-Akademie']); else if(i<3)o.push([L[1],LT[i+1][0],'wechselt das Schulzimmer','Wichtel-Akademie']);});
    o.push([695,720,'geht nach Hause','Unterwegs']);
    o.push([720,780,'isst zu Mittag: '+F.mi,'Wichtelhaus']);
    if(P[1].length){o.push([780,805,'ruht sich kurz aus','Wichtelhaus']);o.push([805,810,'geht zurück zur Akademie','Unterwegs']);
      P[1].forEach((s,i)=>{const L=LT[4+i],T=SUBJ[s];o.push([L[0],L[1],'hat '+T[0]+' bei '+TEACH[s]+' – heute: '+pick(T[1],k+s+'n'+i),'Wichtel-Akademie','l',s]);if(i<P[1].length-1)o.push([L[1],LT[5+i][0],'hat kurz Pause','Wichtel-Akademie']);});
      const end=LT[4+P[1].length-1][1];o.push([end,end+20,'geht nach Hause','Unterwegs']);
      const t1=end+20;o.push([t1,t1+30,pick(SHOP,k+'s'),'Wichtel-Laden','shop']);
      o.push([t1+30,1110,...act(1)]);}
    else{o.push([780,840,...act(0)]);o.push([840,870,pick(SHOP,k+'s'),'Wichtel-Laden','shop']);o.push([870,990,...act(1)]);o.push([990,1110,...act(2)]);}
    o.push([1110,1155,'isst Znacht: '+F.zn,'Wichtelhaus']);
    o.push([1155,1230,'macht Hausaufgaben für die Akademie','Wichtelhaus']);
    o.push([1230,1270,eve(1),'Wichtelhaus']);o.push([1270,1290,'putzt die Zähne und macht sich bettfertig','Wichtelhaus']);sl(1290,1440,'z');
  }else{
    sl(0,480,'n');o.push([480,510,pick(WAKE,k+'w'),'Wichtelhaus']);o.push([510,570,'frühstückt gemütlich: '+F.zm,'Wichtelhaus']);
    o.push([570,690,...act(0)]);o.push([690,720,pick(SHOP,k+'s'),'Wichtel-Laden','shop']);
    o.push([720,780,'isst zu Mittag: '+F.mi,'Wichtelhaus']);o.push([780,900,...act(1)]);o.push([900,1020,...act(2)]);o.push([1020,1110,...act(3)]);
    o.push([1110,1155,'isst Znacht: '+F.zn,'Wichtelhaus']);o.push([1155,1230,eve(0),'Wichtelhaus']);o.push([1230,1290,eve(1),'Wichtelhaus']);
    o.push([1290,1310,'putzt die Zähne und macht sich bettfertig','Wichtelhaus']);sl(1310,1440,'z');}
  return o.map(x=>({a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||'',s:x[5]||''}));}
/* Ort-Flag bei NP_ACT: 'o'/'i' landet in w-Slot -> korrigieren */
function fixActs(list,where){return list.map(x=>{if(x.w==='o'||x.w==='i'){return {a:x.a,b:x.b,t:x.t,w:where,f:x.w==='o'?'out':'',s:''};}return x;});}

function departDay(){ /* 29.11.: Sonntag, 1. Advent, Abreise um Mitternacht */
  return [[0,480,'schläft unruhig, die Reise kribbelt im Bauch','Wichtelhaus','sleep'],[480,540,'zündet die erste Adventskerze an und frühstückt','Wichtelhaus'],[540,660,'packt die letzten Sachen in den Koffer','Wichtelhaus'],[660,690,'setzt sich auf den Koffer, damit er zugeht','Wichtelhaus'],[690,750,'isst zu Mittag: '+food('2026-11-29').mi,'Wichtelhaus'],[750,900,'verabschiedet sich von Ida, Tobi, Malin und Jari','Wichteldorf'],[900,990,'bringt Oma Flocke den Hausschlüssel','Wichteldorf'],[990,1080,'kontrolliert zum letzten Mal die Packliste','Wichtelhaus'],[1080,1170,'isst mit den anderen Wichteln das Abschiedsessen: '+MILCHREIS,'Wichteldorf'],[1170,1320,'sitzt aufgeregt auf dem Koffer und kann kaum still sitzen','Wichtelhaus'],[1320,1380,'zieht Mütze, Schal und Stiefel an und trägt den Koffer zum Wichtelmobil','Wichteldorf'],[1380,1440,'steigt ins Wichtelmobil und schnallt sich an','Wichtelmobil']].map(x=>({a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||''}));}

function holDay(day){
  if(XMAS[day])return XMAS[day].map(x=>({a:x[0],b:x[1],t:x[2],w:'Wichteldorf',f:/schläft/.test(x[2])?'sleep':''}));
  const F=food(day),k=day,a=i=>rot(HOL_ACT,day,i,4);
  return [[0,510,pick(SLEEP,k+'n'),'Wichtelhaus der Familie','sleep'],[510,570,'frühstückt mit der Familie: '+F.zm,'Wichtelhaus der Familie'],[570,720,a(0),'Wichteldorf'],[720,780,'isst zu Mittag: '+F.mi,'Wichtelhaus der Familie'],[780,930,a(1),'Wichteldorf'],[930,1080,a(2),'Wichteldorf'],[1080,1140,'isst Znacht: '+F.zn,'Wichtelhaus der Familie'],[1140,1290,a(3),'Wichtelhaus der Familie'],[1290,1440,pick(SLEEP,k+'z'),'Wichtelhaus der Familie','sleep']].map(x=>({a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||''}));}

function spDay(day){const F=food(day),k=day,a=i=>rot(SP_ACT,day,i,6);
  const L=[[0,480,pick(SLEEP,k+'n')+' (draussen scheint die Sonne)','Ferien-Iglu','sleep'],[480,540,'frühstückt in der Sonne: '+F.zm,'Ferien-Iglu'],[540,660,...a(0)],[660,720,...a(1)],[720,780,'isst zu Mittag: '+F.mi,'Ferien-Iglu'],[780,900,...a(2)],[900,1020,...a(3)],[1020,1110,...a(4)],[1110,1170,'isst Znacht: '+F.zn,'Ferien-Iglu'],[1170,1290,...a(5)],[1290,1440,pick(SLEEP,k+'z')+' (die Sonne geht nie unter)','Ferien-Iglu','sleep']];
  return L.map(x=>(x[3]==='o'||x[3]==='i')?{a:x[0],b:x[1],t:x[2],w:'Südpol',f:x[3]==='o'?'out':''}:{a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||''});}

function vkDay(day){ /* Volketswil: wach 1–5 Uhr */
  const k=day,F=food(day),o=[],sp=SURP[day];
  
  if(day==='2026-11-30'){o.push([0,180,'ist im Wichtelmobil unterwegs','Wichtelmobil']);o.push([180,200,'ist angekommen und schleicht ganz leise ins Haus','Volketswil']);o.push([200,215,'öffnet zum ersten Mal die Wichteltür','Hinter der Wichteltür']);o.push([215,235,sp.t,'Bei der Wichteltür','surp']);o.push([235,270,'packt den Koffer aus','Hinter der Wichteltür']);o.push([270,300,'legt sich ins neue Bett und lächelt','Hinter der Wichteltür']);}
  else if(day==='2026-12-24'){o.push([0,60,'schläft ein letztes Mal hinter der Wichteltür','Hinter der Wichteltür','sleep']);o.push([60,120,'packt leise seinen Koffer','Hinter der Wichteltür']);o.push([120,170,sp.t,'Bei der Wichteltür','surp']);o.push([170,240,'räumt hinter der Wichteltür auf, damit alles schön ist','Hinter der Wichteltür']);o.push([240,300,'wartet aufs Wichtelmobil und schaut ein letztes Mal aus dem Fenster','Volketswil']);return o.map(x=>({a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||''}));}
  else{
    o.push([0,60,pick(VK_SLEEP,k+'n'),'Hinter der Wichteltür','sleep']);o.push([60,75,'wacht auf, alle im Haus schlafen','Hinter der Wichteltür']);
    o.push([75,105,'isst sein Nachtessen: '+F.zn,'Hinter der Wichteltür']);
    const sl=[[105,140],[140,175],[175,210],[210,245],[245,280]];
    let si=0;sl.forEach((s,i)=>{if(sp&&i===2){o.push([s[0],s[1],sp.t,'Bei der Wichteltür','surp']);return;}const x=rot(VK_TASK,day,si++,5);o.push([s[0],s[1],x[0],x[1]==='s'?'Volketswil':'Hinter der Wichteltür']);});
    o.push([280,300,'kriecht ins Bett hinter der Wichteltür','Hinter der Wichteltür']);}
  o.push([300,1440,pick(VK_SLEEP,k+'d'),'Hinter der Wichteltür','sleep']);
  return o.map(x=>({a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||''}));}

function backDay(){return [[0,0,'',''],[1080,1170,'kommt im Wichteldorf an, Oma Flocke wartet schon mit Tee','Wichteldorf'],[1170,1230,'isst Znacht bei Oma Flocke: '+MILCHREIS,'Wichteldorf'],[1230,1290,'packt den Koffer aus und findet Sand aus Kapstadt','Wichtelhaus'],[1290,1440,'schläft wieder im eigenen Bett','Wichtelhaus','sleep']].slice(1).map(x=>({a:x[0],b:x[1],t:x[2],w:x[3],f:x[4]||''}));}
/* Tagesplan für ein Datum (ohne Reisen) */
function dayPlan(day){const wd=new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'});
  if(day==='2026-11-29')return {ph:'np',L:departDay()};
  if(day<'2026-11-30')return {ph:'np',L:fixActs(npDay(day,wd,{aka:day>=AKA_START}),'Wichteldorf')};
  if(day<='2026-12-24'&&day>='2026-11-30')return {ph:'vk',L:vkDay(day)};
  if(day<='2026-12-31')return {ph:'hol',L:holDay(day)};
  if(day==='2027-01-01'||day==='2027-01-02')return {ph:'trip',L:[]};
  if(day<='2027-02-01')return {ph:'sp',L:spDay(day)};
  if(day==='2027-02-02')return {ph:'np',L:backDay()};
    return {ph:'np',L:fixActs(npDay(day,wd,{aka:day>=AKA_AGAIN}),'Wichteldorf')};}

/* ---------- Zustand jetzt ---------- */
const TRIPS=[['n1',TRIP_N1,'n'],['x',TRIP_X,'n'],['n2',TRIP_N2,'n'],['s',TRIP_S,'s'],['b',TRIP_B,'s']];
function tripState(T,ms,kind,key){const g=T.S.find(x=>ms>=x.a&&ms<x.b);if(!g)return null;const A=T.R[g.i-1],B=T.R[g.i];
  const peng=B.v===150||(key==='b'&&A.v===150&&g.i<=2);
  if(g.k==='m'){const f=(ms-g.a)/(g.b-g.a);let lat=A.lat+(B.lat-A.lat)*f,lon=A.lon+(B.lon-A.lon)*f;
    const pool=peng?TRIP_TXT.p:key==='x'?TRIP_TXT.x:key==='s'?(TRIP_TXT[B.n]||TRIP_TXT.n):key==='b'?TRIP_TXT.back:TRIP_TXT.n;
    return {mv:1,i:g.i,f,lat,lon,sp:g.km/((g.b-g.a)/3600000),to:B.n,from:A.n,t:pick(pool,key+Math.floor(ms/420000)),veh:peng?'Pinguin-Express':'Wichtelmobil',R:T.R,key};}
  let st=(key==='b'?STOP_B:key==='x'?STOP_X:STOP_TXT)[B.n]||STOP_TXT[B.n]||'macht Pause';
  if(Array.isArray(st))st=st[Math.min(st.length-1,Math.floor((ms-g.a)/(g.b-g.a)*st.length))];
  return {mv:0,i:g.i,f:1,lat:B.lat,lon:B.lon,sp:0,at:B.n,t:st,veh:peng?'Pinguin-Express':'Wichtelmobil',R:T.R,key,stopEnd:g.b};}
function now(ms){
  for(const [key,T,kind] of TRIPS){if(ms>=T.a&&ms<T.b){const s=tripState(T,ms,kind,key);if(s){s.ph='trip';s.kind=kind;s.trip=key;return s;}}}
  const p=zParts(ms),day=p.year+'-'+p.month+'-'+p.day,m=+p.hour*60+ +p.minute;
  /* Konfetti-Besuch 1.1. 01:00–03:00 */
  if(ms>=TRIP_N2.b&&ms<TRIP_S.a){const a=TRIP_N2.b;const mm=(ms-a)/60000;const t=mm<15?'schleicht leise ins Haus':mm<70?SURP['2027-01-01'].t:mm<100?'schaut sich ein letztes Mal um':'steigt leise wieder ins Wichtelmobil';return {ph:'vk',day,m,lat:47.39,lon:8.69,t,w:mm<70&&mm>=15?'Bei der Wichteltür':'Volketswil',f:mm>=15&&mm<70?'surp':'',place:'vk'};}
  /* Nach Ankunft Südpol am 2.1. abends / Rückkehr Nordpol 2.2. */
  let P=dayPlan(day);
  if(P.ph==='trip'){if(ms>=TRIP_S.b)return {ph:'sp',day,m,lat:-90,lon:0,t:'kommt im Ferien-Iglu an und schläft sofort ein (die Sonne scheint trotzdem)',w:'Südpol',f:'sleep',place:'sp'};return null;}
  if(day==='2027-01-02'&&ms<TRIP_S.b)return null;
  if(day==='2027-02-02'&&ms<TRIP_B.b)return null;
  if(day==='2026-11-30'&&ms<TRIP_N1.b)return null;
  if(day==='2026-12-24'&&ms>=TRIP_X.b){P=holDay('2026-12-24');P={ph:'hol',L:P};}
  if(day==='2026-12-31'&&ms>=TRIP_N2.a)return null;
  const e=P.L.find(x=>m>=x.a&&m<x.b)||P.L[P.L.length-1];
  const place=P.ph==='vk'?'vk':P.ph==='sp'?'sp':'np';
  const pos=place==='vk'?[47.39,8.69]:place==='sp'?[-90,0]:[90,15.63];
  return {ph:P.ph,day,m,lat:pos[0],lon:pos[1],t:e.t,w:e.w,f:e.f,s:e.s,place,L:P.L};}

/* ---------- Wetter (Open-Meteo, kostenlos) ---------- */
const WX_PLACES={np:{n:'Qaanaaq (Grönland)',lat:77.47,lon:-69.23},vk:{n:'Volketswil',lat:47.39,lon:8.69},sp:{n:'Südpol',lat:-89.99,lon:0}};
function wxText(code,wind,temp){
  let w=code==null?'':code<=1?'klar':code<=3?'bewölkt':code<=48?'neblig':code<=57?'Nieselregen':code<=67?'Regen':code<=77?'Schneefall':code<=82?'Regenschauer':code<=86?'Schneeschauer':'Gewitter';
  if(wind>=50)w=(code>=71&&code<=86?'Schneesturm':'Sturm');else if(wind>=30)w+=', windig';
  return w;}
const wxBad=(code,wind,temp)=>wind>=40||(code>=73&&code<=77)||code>=85||temp<=-35||(code>=61&&code<=67)||code>=95;
const wxCache={};
async function weather(place){const P=WX_PLACES[place];if(!P)return null;
  const key=place;if(wxCache[key]&&Date.now()-wxCache[key].t<15*60000)return wxCache[key].d;
  try{const u='https://api.open-meteo.com/v1/forecast?latitude='+P.lat+'&longitude='+P.lon+'&current=temperature_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&past_days=92&forecast_days=1&timezone=UTC';
    const r=await fetch(u);if(!r.ok)throw 0;const j=await r.json();
    const d={n:P.n,temp:j.current.temperature_2m,code:j.current.weather_code,wind:j.current.wind_speed_10m,txt:wxText(j.current.weather_code,j.current.wind_speed_10m,j.current.temperature_2m),bad:wxBad(j.current.weather_code,j.current.wind_speed_10m,j.current.temperature_2m),daily:{}};
    j.daily.time.forEach((t,i)=>d.daily[t]={code:j.daily.weather_code[i],max:j.daily.temperature_2m_max[i],min:j.daily.temperature_2m_min[i],wind:j.daily.wind_speed_10m_max[i]});
    wxCache[key]={t:Date.now(),d};return d;}catch(e){return null;}}
/* Ort eines Tages (für Tagebuch-Wetter) */
function placeOfDay(day){if(day>='2026-11-30'&&day<='2026-12-23')return 'vk';if(day>='2027-01-02'&&day<='2027-02-01')return 'sp';return 'np';}
const INDOOR=[['bleibt wegen des Wetters drinnen und spielt Wichtel-Memory','i'],['bleibt drinnen und liest am warmen Ofen','i'],['wartet drinnen ab und repariert Spielzeug','i'],['bleibt im Haus und backt Plätzchen','i']];
function adjust(s,wx){ /* draussen + schlechtes Wetter -> drinnen */
  if(!s||!wx||!wx.bad||s.f!=='out')return s;const a=pick(INDOOR,s.day+s.m/60|0);
  return Object.assign({},s,{t:a[0]+' ('+wx.txt+')',w:s.place==='sp'?'Ferien-Iglu':'Wichtelhaus',f:''});}

window.LT={now,dayPlan,food,weather,adjust,placeOfDay,wxText,zParts,dayStr,Z,TRIPS,TRIP_N1,TRIP_X,TRIP_N2,TRIP_S,TRIP_B,SURP,RN,RS,RB,SUBJ,PLAN,TEACH,hsh,WX_PLACES};
})();
