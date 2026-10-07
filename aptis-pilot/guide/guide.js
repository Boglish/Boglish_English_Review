'use strict';
// Full text remains available without JavaScript. Only the initial mobile view is folded.
const mobile=matchMedia('(max-width:850px)');
const folds=[...document.querySelectorAll('.mobile-fold,.contents')];
function revealAnchor(){
 const target=document.getElementById(location.hash.slice(1));
 if(!target)return;
 const detail=target.matches('details')?target:target.querySelector('.mobile-fold');
 if(detail)detail.open=true;
}
if(mobile.matches)folds.forEach(d=>d.open=false);
revealAnchor();
addEventListener('hashchange',revealAnchor);
// The desktop layout has no fold controls; restore its text after a width change.
mobile.addEventListener('change',e=>{if(!e.matches)folds.forEach(d=>d.open=true);});
document.querySelectorAll('.contents nav a').forEach(a=>a.addEventListener('click',()=>{if(mobile.matches)document.querySelector('.contents').open=false;}));
let printState;
addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(d=>[d,d.open]);printState.forEach(([d])=>d.open=true);});
addEventListener('afterprint',()=>{printState?.forEach(([d,open])=>d.open=open);});
