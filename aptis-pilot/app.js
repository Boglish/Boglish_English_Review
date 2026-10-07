'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const words=v=>v.trim().split(/\s+/u).filter(Boolean).length;
let state=null,index=0,active=null,result=null,entered=0,playing=null,micURL=null,latestMicToken=null;
const blobs=new Map(),urls=new Map();
const names={Grammar:'문법',Vocabulary:'어휘',Reading:'읽기',Listening:'듣기',Writing:'쓰기',Speaking:'말하기'};
function error(e){$('globalError').textContent=e instanceof Error?e.message:String(e);}
function time(s){return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
function busy(){return Boolean(active||playing);}
function lock(){document.querySelectorAll('#nav button,#prev,#next,#finish,#home,#start,#micCheck,#micRawCheck,#micDevice,#micRefresh,.recordButton,.listenButton').forEach(b=>b.disabled=busy());if(!busy()&&state){$('prev').disabled=index===0;$('next').disabled=index===state.items.length-1;document.querySelectorAll('.listenButton').forEach(b=>b.disabled=(state.media[b.dataset.clip]?.plays||0)>=2);}}
function checkpoint(){if(state&&entered){const id=state.items[index].id;state.dwell_seconds[id]=(state.dwell_seconds[id]||0)+(Date.now()-entered)/1000;entered=Date.now();}}
function recordURL(key,blob){if(urls.has(key))URL.revokeObjectURL(urls.get(key));const url=URL.createObjectURL(blob);urls.set(key,url);return url;}
async function requestJSON(url,options){const r=await fetch(url,options);if(!r.ok)throw Error('요청을 처리하지 못했습니다. 서버 연결을 확인하고 다시 시도해 주세요.');return r.json();}
function audioPlayer(clip){
 const box=document.createElement('div');box.className='player';
 const b=document.createElement('button');b.className='listenButton secondary';b.dataset.clip=clip.id;b.textContent='음원 듣기';
 const status=document.createElement('p');status.setAttribute('role','status');
 const stop=document.createElement('button');stop.className='secondary';stop.textContent='재생 중단';stop.hidden=true;
 const m=state.media[clip.id]||(state.media[clip.id]={plays:0,completed:0,errors:[]});
 const update=()=>{status.textContent=`재생 ${m.plays}/2회 · 끝까지 들음 ${m.completed}회${m.errors.length?' · 재생 오류 기록 있음':''}`;b.disabled=busy()||m.plays>=2;};
 b.onclick=async()=>{
  if(busy()||m.plays>=2)return;
  const a=new Audio(clip.url);playing=a;lock();status.textContent='음원 불러오는 중…';let started=false;
  const done=(failure)=>{if(playing!==a)return;stop.hidden=true;if(failure){m.errors.push(String(failure));status.textContent='음원을 재생하지 못했습니다. 소리 설정과 연결을 확인한 뒤 다시 시도해 주세요.';}else{m.completed++;}playing=null;lock();if(!failure)update();};
  stop.hidden=false;stop.onclick=()=>{a.pause();stop.hidden=true;playing=null;m.interrupted=(m.interrupted||0)+1;lock();update();status.textContent+=' · 중단됨 (재생 횟수는 복구되지 않습니다)';};
  a.onplaying=()=>{if(!started){started=true;m.plays++;}status.textContent=`재생 중 · ${m.plays}/2회 (과제 이동은 재생 후 가능합니다)`;};
  a.onended=()=>done();a.onerror=()=>done('media_error');
  try{await a.play();}catch(e){done(e.name);}
 };update();box.append(b,stop,status);return box;
}
function render(){
 const item=state.items[index];entered=Date.now();$('progress').textContent=`${index+1} / ${state.items.length} 과제 · ${item.stage==='basic'?'기본':'확장'}`;$('bar').max=state.items.length;$('bar').value=index+1;
 $('skill').textContent=`${names[item.skill]||item.skill} · ${item.id}`;$('title').textContent=item.title;$('prompt').textContent=item.prompt;
 $('stimulus').textContent=item.stimulus||'';
 if(item.passages){$('stimulus').textContent=item.passages.map(p=>`${p.heading}\n${p.text}`).join('\n\n');}
 $('media').replaceChildren();if(item.image){const im=document.createElement('img');im.className='photo';im.src=item.image;im.alt='Photograph 1 and photograph 2';$('media').append(im);}
 if(item.audio?.length===1)$('media').append(audioPlayer(item.audio[0]));
 $('questions').replaceChildren();const answers=state.answers[item.id]||(state.answers[item.id]=[]);
 item.questions.forEach((q,n)=>{
  const box=document.createElement('section');box.className='question';
  const label=document.createElement('label');label.className='qprompt english';label.textContent=`${n+1}. ${q.prompt}`;box.append(label);
  if(item.audio?.length>1)box.append(audioPlayer(item.audio[n]));
  if(item.response_kind==='choice'){
   const select=document.createElement('select');select.id=`answer-${n}`;label.htmlFor=select.id;select.setAttribute('aria-label',q.prompt);select.innerHTML='<option value="">Select an option</option>'+q.options.map(o=>`<option value="${esc(o.id)}">${esc(o.text)}</option>`).join('');select.value=answers[n]||'';select.onchange=()=>{answers[n]=select.value;};box.append(select);
  }else if(item.response_kind==='text'){
   const input=document.createElement('textarea');input.id=`answer-${n}`;label.htmlFor=input.id;input.lang='en';input.spellcheck=false;input.maxLength=12000;input.value=answers[n]||'';
   const count=document.createElement('p');count.className='wordcount';const update=()=>{answers[n]=input.value;count.textContent=`${words(input.value)} words · 요청 분량 ${q.word_range[0]}–${q.word_range[1]} words`;};input.oninput=update;update();box.append(input,count);
  }else{const info=document.createElement('p');info.className='muted';info.textContent=`응답 ${q.response_seconds}초${q.preparation_seconds?` · 준비 ${q.preparation_seconds}초`:''}`;box.append(info);speechControls(item,q,n,box);}
  $('questions').append(box);
 });
 $('nav').replaceChildren();state.items.forEach((i,n)=>{const b=document.createElement('button');b.textContent=`${n+1} ${names[i.skill]||i.skill}`;b.title=i.title;b.setAttribute('aria-current',String(index===n));b.onclick=()=>move(n);$('nav').append(b);});lock();
}
function move(n){if(busy()||n<0||n>=state.items.length)return;checkpoint();document.querySelectorAll('audio').forEach(a=>a.pause());index=n;render();window.scrollTo({top:0,behavior:'instant'});}
function resultMarkup(){
 const practice={'GA-B-G':'주어와 동사의 일치, 시제, 수량 표현을 정답 해설과 함께 확인해 보세요.','GA-E-G':'문장 전체의 의미와 절 사이 관계를 먼저 파악한 뒤 문법 형태를 고르는 연습을 해 보세요.','GA-B-V-definition':'뜻을 보고 알맞은 단어를 떠올리는 연습을 해 보세요.','GA-B-V-context':'문장의 앞뒤 의미를 근거로 빈칸에 맞는 단어를 골라 보세요.','GA-E-V-synonym':'비슷한 뜻을 가진 단어를 예문과 함께 비교해 보세요.','GA-E-V-collocation':'단어 하나보다 함께 자주 쓰이는 표현을 묶어서 익혀 보세요.','GA-B-R1':'짧은 글에서 빈칸 앞뒤의 의미와 문장 구조를 확인해 보세요.','GA-B-R2':'시간 표현, 대명사, 연결어를 근거로 문장 순서를 정해 보세요.','GA-E-R3':'누가 어떤 의견을 말했는지 근거 문장에 표시해 보세요.','GA-E-R4':'각 문단의 중심 내용을 한 문장으로 요약하고 제목과 연결해 보세요.','GA-B-L1':'질문에서 묻는 세부 정보를 먼저 확인하고 듣는 연습을 해 보세요.','GA-E-L3':'두 화자의 의견을 따로 정리하고 공통점과 차이를 찾아보세요.','GA-E-L4':'말하는 사람의 결론과 그 결론을 뒷받침하는 이유를 연결해 보세요.'};
 const domains=result.domains.map(d=>'<div class="resultrow"><div>'+esc(d.title)+'<small>'+d.correct+' / '+d.answered+'개 정답 · 전체 '+d.total+'문항'+(d.unanswered?' · 미응답 '+d.unanswered+'개':'')+(d.unverified?' · 음원 완료 미확인 '+d.unverified+'개':'')+'</small></div><div class="value">'+(d.percent===null?'미응시':d.complete?d.percent+'점 / 100점':'부분 정답률 '+d.percent+'%')+'</div></div>').join('');
 const tasks=result.results.map(r=>{
  const wrong=r.questions.filter(q=>q.status==='incorrect');
  const feedback=!r.answered?'평가할 응답이 없습니다. 먼저 문제를 풀어 주세요.':wrong.length?'이번 응시에서 '+wrong.length+'개를 틀렸습니다. '+(practice[r.id]||'아래 오답의 정답과 근거를 확인해 보세요.'):r.answered<r.total?'채점된 응답은 모두 맞았습니다. 나머지 문항도 풀어 확인해 보세요.':'이번 과제의 문항을 모두 맞았습니다. 다른 문제에서도 같은 유형을 해결할 수 있는지 확인해 보세요.';
  return '<section class="feedback"><h3>'+esc(names[r.skill])+' · '+esc(r.title)+'</h3><p>'+esc(feedback)+'</p><details><summary>문항별 정답·해설 보기</summary>'+r.questions.map((q,n)=>'<div class="question"><strong>'+(n+1)+'. '+esc(q.prompt)+'</strong><p>'+({correct:'정답',incorrect:'오답',unanswered:'미응답',unverified:'음원 완료 미확인 · 채점 제외'}[q.status])+' · 내 답: '+esc(q.answer||'선택 없음')+'</p><p>정답: '+esc(q.expected)+'</p><p>'+esc(q.rationale)+'</p></div>').join('')+'</details></section>';
 }).join('');
 return '<h2>영역별 결과</h2>'+domains+'<p class="muted">일부만 응시한 영역은 채점된 응답에 대한 부분 정답률입니다. 미응답과 끝까지 듣지 않은 음원의 응답은 계산에서 제외합니다. 문항 수가 적거나 일부만 응시한 결과로 전체 실력을 판단하지 마세요.</p><h2>유형별 보완점과 해설</h2>'+tasks;
}
function reportHTML(){return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>보글리쉬 응시 기록</title><style>body{font:16px/1.6 Arial,sans-serif;max-width:850px;margin:40px auto;padding:20px}.resultrow{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #ccc;padding:12px 0}small{display:block;color:#555}.value{white-space:nowrap}</style><h1>보글리쉬 · General A 응시 기록</h1><p>${esc(result.notice)}</p><p>버전 ${esc(result.version)} · ${esc(new Date(result.generated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}))} (한국 시간)</p><p>${esc($('summary').textContent)}</p>${resultMarkup()}<p>이번에 출제된 문항에서 확인된 결과입니다. 간단·상세 진단이나 반복 응시의 점수 차이를 곧바로 실력 변화로 해석하지 마세요.</p></html>`;}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function filename(suffix){return `boglish-General-A-${result.generated_at.slice(0,10)}-${suffix}`;}
async function finish(){
 if(busy())return;checkpoint();$('finish').disabled=true;$('globalError').textContent='';
 try{const scoring=await requestJSON('scoring.json?v=0.3.0');result=window.gradeTrial(scoring,{mode:state.mode,answers:state.answers,media:state.media});
 $('workspace').hidden=true;$('results').hidden=false;entered=0;$('resultNotice').textContent=result.notice;
 const objective=result.results.filter(r=>r.correct!==null),answered=objective.reduce((s,r)=>s+r.answered,0),correct=objective.reduce((s,r)=>s+r.correct,0),total=result.results.filter(r=>!['Writing','Speaking'].includes(r.skill)).reduce((s,r)=>s+r.total,0);
 $('summary').textContent=`${state.mode==='complete'?'상세 진단':'간단 진단'} 응시 · 객관식 ${total}문항 중 ${answered}문항 채점, ${correct}개 정답 · 경과 ${time((Date.now()-state.started)/1000)} · 화면 이탈 ${state.hidden_count}회. 응시하지 않은 문항과 음원 완료가 확인되지 않은 문항은 정답률 계산에서 제외합니다.`;
 $('resultRows').innerHTML=resultMarkup();window.scrollTo({top:0});
 }catch(e){error(e);}finally{lock();}
}
function restart(){if(busy())return;if(state&&!confirm('처음 선택으로 돌아가면 답안과 결과가 삭제됩니다. 필요한 파일을 다운로드했나요?'))return;blobs.clear();urls.forEach(URL.revokeObjectURL);urls.clear();state=null;result=null;entered=0;index=0;$('workspace').hidden=true;$('results').hidden=true;$('intro').hidden=false;$('globalError').textContent='';window.scrollTo({top:0});}
$('start').onclick=async()=>{if(busy())return;$('start').disabled=true;try{const mode=document.querySelector('input[name=mode]:checked').value;const bank=await requestJSON('items.json?v=0.3.0');bank.items=bank.items.filter(i=>mode==='complete'||i.stage==='basic');state={...bank,mode,answers:{},media:{},dwell_seconds:{},started:Date.now(),hidden_count:0};index=0;$('intro').hidden=true;$('workspace').hidden=false;render();}catch(e){$('introError').textContent=e.message;}finally{$('start').disabled=false;}};
$('prev').onclick=()=>move(index-1);$('next').onclick=()=>move(index+1);$('finish').onclick=finish;$('home').onclick=restart;$('restart').onclick=restart;
$('back').onclick=()=>{$('results').hidden=true;$('workspace').hidden=false;render();};
$('downloadReport').onclick=()=>download(new Blob([reportHTML()],{type:'text/html;charset=utf-8'}),filename('result.html'));
$('print').onclick=()=>window.print();
$('download').onclick=async()=>{const b=$('download');b.disabled=true;$('exportMessage').textContent='파일을 준비하고 있습니다…';try{const zip=new JSZip();zip.file('result.html',reportHTML());zip.file('responses.json',JSON.stringify({schema_version:1,result,answers:state.answers,media:state.media,dwell_seconds:state.dwell_seconds,started_at:new Date(state.started).toISOString(),hidden_count:state.hidden_count,assessment_status:'objective_diagnostic_only'},null,2));for(const [key,blob]of blobs)zip.file(`recordings/${key}.${blob.type.includes('mp4')?'m4a':'webm'}`,blob);zip.file('README.txt','결과와 해설: result.html\n답안·진행 기록: responses.json\n자체 문항 정답률이며 공식 APTIS 성적·예상 성적이 아닙니다.\n파일을 직접 다운로드해 보관하세요.');download(await zip.generateAsync({type:'blob'}),filename('responses.zip'));$('exportMessage').textContent='다운로드를 요청했습니다. 다운로드 폴더에서 ZIP 파일이 저장되었는지 확인해 주세요.';}catch(e){$('exportMessage').textContent='파일을 만들지 못했습니다. 이 화면을 닫지 말고 다시 시도해 주세요.';}finally{b.disabled=false;}};
document.addEventListener('visibilitychange',()=>{if(state&&document.hidden)state.hidden_count++;});
window.addEventListener('beforeunload',e=>{if(state||busy()){e.preventDefault();e.returnValue='';}});
setInterval(()=>{if(state)$('elapsed').textContent=`경과 ${time((Date.now()-state.started)/1000)}`;},1000);
