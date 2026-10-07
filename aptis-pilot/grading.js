'use strict';
// Public pilot grading; keys are not confidential. Generated from the shared scorer.
window.gradeTrial=(bank,data)=>{const items=mode=>{if(!['basic','complete'].includes(mode))throw Error('Mode');return bank.items.filter(i=>mode==='complete'||i.stage==='basic');};return (function score(data){
 const selected=items(data.mode), answers=data.answers, media=data.media||{};
 if(!answers||typeof answers!=='object'||Array.isArray(answers))throw Error('Answers');
 if(Object.keys(answers).some(k=>!selected.some(i=>i.id===k)))throw Error('Item');
 const results=selected.map(i=>{
  const raw=answers[i.id]||[];
  if(!Array.isArray(raw)||raw.length>i.questions.length||raw.some(v=>typeof v!=='string'||v.length>12000))throw Error('Response');
  const base={id:i.id,skill:i.skill,title:i.title,total:i.questions.length};
  if(i.response_kind==='choice'){
   let correct=0,answered=0,unverified=0;
   i.questions.forEach((q,n)=>{const a=raw[n]||'';if(a&&!q.options.some(o=>o.id===a))throw Error('Option');
    const clip=i.audio?.[i.audio.length===1?0:n];
    if(clip&&!(media[clip.id]?.completed>0)){if(a)unverified++;return;}
    if(a){answered++;if(a===q.answer_key)correct++;}
   });
   return {...base,status:answered?'scored':'not_evaluated',answered,correct:answered?correct:null,unverified,unanswered:base.total-answered-unverified};
  }
  if(i.response_kind==='text'){
   const word_counts=i.questions.map((_,n)=>(raw[n]||'').trim().split(/\s+/u).filter(Boolean).length);
   return {...base,status:'awaiting_review',answered:word_counts.filter(Boolean).length,word_counts,correct:null};
  }
  const recorded=i.questions.map((_,n)=>{const m=media[`${i.id}-${n}`];return Boolean(m&&m.bytes>0&&m.duration>0);});
  return {...base,status:'awaiting_review',answered:recorded.filter(Boolean).length,correct:null};
 });
 return {version:bank.version,form:bank.form,mode:data.mode,generated_at:new Date().toISOString(),official_prediction:false,notice:'자체 제작 문항의 응시 기록입니다. 공식 APTIS 점수·CEFR 예측은 아직 제공하지 않습니다. 쓰기·말하기는 별도 평가가 필요합니다.',results};
})(data);};
