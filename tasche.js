(function(){"use strict";
function n(k){try{var v=localStorage.getItem(k);if(v===null)return 0;var x=JSON.parse(v);return typeof x==='number'?x:(+x||0);}catch(e){return 0;}}
function o(k,d){return WL.g(k,d);}
var stars=WL.stars(),own=WL.owned(),deer=o('wl_deer',{wins:0,races:0}),ag=o('wl_agent',{tresor:0,laser:0,code:0}),builds=o('wl_builds',[]),q=o('wl_quest',{});
var qn=0;try{qn=Object.keys(typeof q==='string'?JSON.parse(q):q).length;}catch(e){}
var sled=n('wl_sled'),flake=n('wl_flake'),mem=n('wl_mem'),snow=n('wl_snow'),rlv=n('wl_rlv')||1,race=n('wl_race');
var bd=[
['⭐','Sternensammler','10 Sterne',stars>=10],['🌟','Sternenregen','100 Sterne',stars>=100],
['🛷','Schlittenfahrer','Schlitten-Spiel gespielt',sled>0],['🚀','Highscore','500 Punkte im Schlitten',sled>=500],
['❄️','Flockenfänger','Schneeflocken gespielt',flake>0],['⛄','Schneemann-Baumeister','Schneemann fertig',snow>0],
['🎅','Gutes Gedächtnis','Memory gelöst',mem>0],['🏁','Rennfahrer','Ein Rentier-Rennen gewonnen',(deer.wins||0)>0],
['🦌','Rentier-Trainer','5 Rennen gestartet',(deer.races||0)>=5],['🔧','Spielzeug-Bastler','Einen Flitzer gebaut',builds.length>0],
['🛒','Garagenbesitzer','Einen Schlitten gekauft',own.length>1],['🕵️','Geheimagent','Eine Mission geschafft',(ag.tresor||0)+(ag.laser||0)+(ag.code||0)>0],
['🧩','Rätselfreund','Ein Adventsrätsel gelöst',qn>0],['🏆','Alles-Kenner','10 Abzeichen',false]];
var got=0;bd.forEach(function(b,i){if(i<bd.length-1&&b[3])got++;});bd[bd.length-1][3]=got>=10;if(bd[bd.length-1][3])got++;
document.getElementById('tstars').textContent=stars;
document.getElementById('tcount').textContent='· '+got+' von '+bd.length;
document.getElementById('tbar').style.width='0';setTimeout(function(){document.getElementById('tbar').style.width=Math.round(got/bd.length*100)+'%';},100);
document.getElementById('tbad').innerHTML=bd.map(function(b){return '<div class="bd'+(b[3]?' on':'')+'"><div class="ic">'+b[0]+'</div><b>'+b[1]+'</b><small>'+b[2]+'</small></div>';}).join('');
var far=builds.length?Math.max.apply(null,builds.map(function(x){return +x.d||+x.dist||0;})):0;
var recs=[['🛷','Schlitten',sled],['❄️','Flocken',flake],['🏁','Rennen-Level',rlv],['🛠️','Weitester Flug',far?Math.round(far)+' m':'–'],['🎅','Memory (Züge)',mem||'–'],['⛄','Schneemann (s)',snow||'–']];
document.getElementById('trec').innerHTML=recs.map(function(r){return '<div>'+r[0]+'<b>'+r[2]+'</b>'+r[1]+'</div>';}).join('');
var cur=WL.skin().id;
document.getElementById('tsk').innerHTML=WL.SK.map(function(k){var h=own.indexOf(k.id)>=0;return '<span class="chip'+(k.id===cur?' on':'')+'" style="'+(h?'':'opacity:.4')+'">'+(h?'':'🔒 ')+k.n+'</span>';}).join('');
})();