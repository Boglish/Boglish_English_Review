'use strict';
// Public diagnostic: scoring keys and explanations are not confidential.
window.gradeTrial=function gradeObjective(bank,data){
 if(!['basic','complete'].includes(data.mode))throw Error('Mode');
 const items=bank.items.filter(i=>i.response_kind==='choice'&&(data.mode==='complete'||i.stage==='basic'));
 const answers=data.answers||{},media=data.media||{};
 const results=items.map(i=>{
  const raw=answers[i.id]||[];
  if(!Array.isArray(raw))throw Error('Response');
  const questions=i.questions.map((q,n)=>{
   const answer=raw[n]||'';
   if(answer&&!q.options.some(o=>o.id===answer))throw Error('Option');
   const clip=i.audio?.[i.audio.length===1?0:n];
   const status=!answer?'unanswered':clip&&!(media[clip.id]?.completed>0)?'unverified':answer===q.answer_key?'correct':'incorrect';
   return {prompt:q.prompt,status,answer:q.options.find(o=>o.id===answer)?.text||'',expected:q.options.find(o=>o.id===q.answer_key)?.text||'',rationale:q.rationale||''};
  });
  return {id:i.id,skill:i.skill,title:i.title,total:questions.length,answered:questions.filter(q=>['correct','incorrect'].includes(q.status)).length,correct:questions.filter(q=>q.status==='correct').length,unanswered:questions.filter(q=>q.status==='unanswered').length,unverified:questions.filter(q=>q.status==='unverified').length,questions};
 });
 const domains=[['문법·어휘',['Grammar','Vocabulary']],['읽기',['Reading']],['듣기',['Listening']]].map(([title,skills])=>{
  const rows=results.filter(r=>skills.includes(r.skill));
  const sum=k=>rows.reduce((s,r)=>s+r[k],0);
  const total=sum('total'),answered=sum('answered'),correct=sum('correct');
  return {title,total,answered,correct,unanswered:sum('unanswered'),unverified:sum('unverified'),complete:answered===total,percent:answered?Math.round(correct/answered*100):null};
 });
 return {version:bank.version,form:bank.form,mode:data.mode,generated_at:new Date().toISOString(),official_prediction:false,notice:'본 진단의 점수는 자체 문항의 정답률(100점 기준)입니다. 공식 APTIS 성적·예상 성적 또는 CEFR 등급을 의미하지 않습니다. 쓰기·말하기는 이번 진단에 포함되지 않습니다.',results,domains};
};
