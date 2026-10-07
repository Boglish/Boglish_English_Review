'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const words=v=>v.trim().split(/\s+/u).filter(Boolean).length;
let state=null,index=0,active=null,result=null,entered=0,playing=null,micURL=null;
const blobs=new Map(),urls=new Map();
const names={Grammar:'문법',Vocabulary:'어휘',Reading:'읽기',Listening:'듣기',Writing:'쓰기',Speaking:'말하기'};
function error(e){$('globalError').textContent=e instanceof Error?e.message:String(e);}
function time(s){return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
function busy(){return Boolean(active||playing);}
function lock(){document.querySelectorAll('#nav button,#prev,#next,#finish,#home,#start,#micCheck,.recordButton,.listenButton').forEach(b=>b.disabled=busy());if(!busy()&&state){$('prev').disabled=index===0;$('next').disabled=index===state.items.length-1;document.querySelectorAll('.listenButton').forEach(b=>b.disabled=(state.media[b.dataset.clip]?.plays||0)>=2);}}
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
async function capture(key,limit,status,onComplete,preparation=0){
 if(busy())return;
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status.textContent='이 브라우저에서는 녹음을 지원하지 않습니다. 최신 Chrome 또는 Edge에서 열어 주세요.';return;}
 const m=state?(state.media[key]||(state.media[key]={attempts:0,errors:[]})):{attempts:0,errors:[]};
 const token={stream:null,recorder:null,timer:null,cancelled:false};active=token;lock();status.textContent='마이크 접근을 허용해 주세요…';
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}catch(e){m.errors.push(e.name);active=null;lock();status.textContent='마이크를 사용할 수 없습니다. 주소창의 마이크 권한과 연결을 확인한 뒤 다시 시도해 주세요.';return;}
 token.stream=stream;
 const clean=()=>{clearInterval(token.timer);stream.getTracks().forEach(t=>t.stop());if(active===token)active=null;lock();};
 const startRecording=()=>{
  if(token.cancelled){clean();return;}
  try{
   const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
   const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});token.recorder=recorder;
   const chunks=[];let failed=false;const begun=performance.now();m.attempts++;
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onerror=e=>{failed=true;m.errors.push(e.error?.name||'record_error');status.textContent='녹음 오류가 발생했습니다. 다시 시도해 주세요.';if(recorder.state!=='inactive')recorder.stop();else clean();};
   recorder.onstop=()=>{
    const duration=(performance.now()-begun)/1000,blob=new Blob(chunks,{type:recorder.mimeType});clean();
    if(failed||!blob.size){m.errors.push('empty_or_failed_recording');status.textContent='유효한 녹음 파일을 만들지 못했습니다. 다시 녹음해 주세요.';return;}
    m.duration=Number(duration.toFixed(2));m.bytes=blob.size;m.mime=blob.type;m.recorded_at=new Date().toISOString();m.limit_seconds=limit;m.preparation_seconds=preparation;
    status.textContent=`녹음 완료 · ${time(duration)} · ${m.attempts}회 시도. 재생해서 목소리가 들리는지 확인해 주세요.`;
    onComplete(blob,m);
   };
   recorder.start();
   const tick=()=>{const elapsed=(performance.now()-begun)/1000;status.textContent=`녹음 중 · 남은 시간 ${time(Math.max(0,limit-elapsed))}`;if(elapsed>=limit&&recorder.state==='recording')recorder.stop();};
   tick();token.timer=setInterval(tick,200);
  }catch(e){m.errors.push(e.name);clean();status.textContent='녹음을 시작하지 못했습니다. 마이크 연결을 확인해 주세요.';}
 };
 if(preparation){
  // Obtain permission first; no audio is recorded during the preparation period.
  const end=performance.now()+preparation*1000;
  const tick=()=>{status.textContent=`준비 시간 · ${time(Math.max(0,(end-performance.now())/1000))} 후 자동 녹음`;if(performance.now()>=end){clearInterval(token.timer);startRecording();}};
  tick();token.timer=setInterval(tick,200);
 }else startRecording();
}
function speechControls(item,q,n,box){
 const key=`${item.id}-${n}`,status=document.createElement('p');status.className='recordStatus';status.setAttribute('role','status');
 const row=document.createElement('div');row.className='actions';
 const start=document.createElement('button');start.className='recordButton';start.textContent=blobs.has(key)?'다시 녹음':q.preparation_seconds?`준비 ${q.preparation_seconds}초 후 녹음`:'녹음 시작';
 const stop=document.createElement('button');stop.className='secondary';stop.textContent='녹음 종료 / 준비 취소';
 const playback=document.createElement('audio');playback.controls=true;playback.hidden=!blobs.has(key);if(blobs.has(key))playback.src=urls.get(key);
 const save=document.createElement('button');save.className='secondary';save.textContent='이 녹음 저장';save.hidden=!blobs.has(key);save.onclick=()=>download(blobs.get(key),`${key}.${state.media[key].mime.includes('mp4')?'m4a':'webm'}`);
 if(blobs.has(key))status.textContent=`녹음 ${time(state.media[key].duration)} · ${state.media[key].attempts}회 시도 · 재생해서 확인해 주세요.`;
 start.onclick=()=>{if(blobs.has(key)&&!confirm('새 녹음이 성공하면 이전 녹음을 교체합니다. 다시 녹음할까요?'))return;playback.pause();capture(key,q.response_seconds,status,(blob)=>{blobs.set(key,blob);playback.src=recordURL(key,blob);playback.hidden=false;save.hidden=false;start.textContent='다시 녹음';},q.preparation_seconds||0);};
 stop.onclick=()=>{if(!active)return;if(active.recorder?.state==='recording')active.recorder.stop();else if(active.stream){active.cancelled=true;clearInterval(active.timer);active.stream.getTracks().forEach(t=>t.stop());active=null;lock();status.textContent='준비를 취소했습니다. 녹음은 저장되지 않았습니다.';}};
 row.append(start,stop,save);box.append(row,status,playback);
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
   const select=document.createElement('select');select.id=`answer-${n}`;label.htmlFor=select.id;select.setAttribute('aria-label',q.prompt);select.innerHTML='<option value="">선택해 주세요</option>'+q.options.map(o=>`<option value="${esc(o.id)}">${esc(o.text)}</option>`).join('');select.value=answers[n]||'';select.onchange=()=>{answers[n]=select.value;};box.append(select);
  }else if(item.response_kind==='text'){
   const input=document.createElement('textarea');input.id=`answer-${n}`;label.htmlFor=input.id;input.lang='en';input.spellcheck=false;input.maxLength=12000;input.value=answers[n]||'';
   const count=document.createElement('p');count.className='wordcount';const update=()=>{answers[n]=input.value;count.textContent=`${words(input.value)} words · 요청 분량 ${q.word_range[0]}–${q.word_range[1]} words`;};input.oninput=update;update();box.append(input,count);
  }else{const info=document.createElement('p');info.className='muted';info.textContent=`응답 ${q.response_seconds}초${q.preparation_seconds?` · 준비 ${q.preparation_seconds}초`:''}`;box.append(info);speechControls(item,q,n,box);}
  $('questions').append(box);
 });
 $('nav').replaceChildren();state.items.forEach((i,n)=>{const b=document.createElement('button');b.textContent=`${n+1} ${names[i.skill]||i.skill}`;b.title=i.title;b.setAttribute('aria-current',String(index===n));b.onclick=()=>move(n);$('nav').append(b);});lock();
}
function move(n){if(busy()||n<0||n>=state.items.length)return;checkpoint();document.querySelectorAll('audio').forEach(a=>a.pause());index=n;render();window.scrollTo({top:0,behavior:'instant'});}
function resultMarkup(){return result.results.map(r=>{const choice=r.correct!==null;const value=choice?`${r.correct} / ${r.answered} 정답`:`${r.answered} / ${r.total} 응답`;const detail=r.status==='awaiting_review'?'쓰기·말하기 평가 대기':r.status==='not_evaluated'?'채점할 응답 없음':`전체 ${r.total}문항 중 ${r.answered}문항 채점`;return `<div class="resultrow"><div>${esc(r.title)}<small>${esc(detail)}${r.unverified?` · 음원 완료 미확인 ${r.unverified}개`:''}${r.unanswered?` · 미응답 ${r.unanswered}개`:''}</small></div><div class="value">${value}</div></div>`;}).join('');}
function reportHTML(){return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>보글리쉬 응시 기록</title><style>body{font:16px/1.6 Arial,sans-serif;max-width:850px;margin:40px auto;padding:20px}.resultrow{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #ccc;padding:12px 0}small{display:block;color:#555}.value{white-space:nowrap}</style><h1>보글리쉬 · General A 응시 기록</h1><p>${esc(result.notice)}</p><p>버전 ${esc(result.version)} · ${esc(new Date(result.generated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}))} (한국 시간)</p><p>${esc($('summary').textContent)}</p>${resultMarkup()}<p>쓰기·말하기는 평가 전입니다. 다른 형식이나 다음 응시와의 점수 차이를 학습 성장으로 해석할 수 없습니다.</p></html>`;}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function filename(suffix){return `boglish-General-A-${result.generated_at.slice(0,10)}-${suffix}`;}
async function finish(){
 if(busy())return;checkpoint();$('finish').disabled=true;$('globalError').textContent='';
 try{const scoring=await requestJSON('scoring.json');result=window.gradeTrial(scoring,{mode:state.mode,answers:state.answers,media:state.media});
 $('workspace').hidden=true;$('results').hidden=false;entered=0;$('resultNotice').textContent=result.notice;
 const objective=result.results.filter(r=>r.correct!==null),answered=objective.reduce((s,r)=>s+r.answered,0),correct=objective.reduce((s,r)=>s+r.correct,0),total=result.results.filter(r=>!['Writing','Speaking'].includes(r.skill)).reduce((s,r)=>s+r.total,0);
 $('summary').textContent=`${state.mode==='complete'?'전체':'기본'} 응시 · 객관식 ${total}문항 중 ${answered}문항 채점, ${correct}개 정답 · 경과 ${time((Date.now()-state.started)/1000)} · 화면 이탈 ${state.hidden_count}회. 응시하지 않은 문항과 음원 완료가 확인되지 않은 문항은 정답률 계산에서 제외합니다.`;
 $('resultRows').innerHTML=resultMarkup();window.scrollTo({top:0});
 }catch(e){error(e);}finally{lock();}
}
function restart(){if(busy())return;if(state&&!confirm('처음 선택으로 돌아가면 답안과 녹음이 삭제됩니다. 필요한 파일을 다운로드했나요?'))return;blobs.clear();urls.forEach(URL.revokeObjectURL);urls.clear();state=null;result=null;entered=0;index=0;$('workspace').hidden=true;$('results').hidden=true;$('intro').hidden=false;$('globalError').textContent='';window.scrollTo({top:0});}
$('start').onclick=async()=>{if(busy())return;$('start').disabled=true;try{const mode=document.querySelector('input[name=mode]:checked').value;const bank=await requestJSON('items.json');bank.items=bank.items.filter(i=>mode==='complete'||i.stage==='basic');state={...bank,mode,answers:{},media:{},dwell_seconds:{},started:Date.now(),hidden_count:0};index=0;$('intro').hidden=true;$('workspace').hidden=false;render();}catch(e){$('introError').textContent=e.message;}finally{$('start').disabled=false;}};
$('micCheck').onclick=()=>capture('mic-check',3,$('micMessage'),blob=>{if(micURL)URL.revokeObjectURL(micURL);micURL=URL.createObjectURL(blob);$('micPreview').src=micURL;$('micPreview').hidden=false;});
$('prev').onclick=()=>move(index-1);$('next').onclick=()=>move(index+1);$('finish').onclick=finish;$('home').onclick=restart;$('restart').onclick=restart;
$('back').onclick=()=>{$('results').hidden=true;$('workspace').hidden=false;render();};
$('downloadReport').onclick=()=>download(new Blob([reportHTML()],{type:'text/html;charset=utf-8'}),filename('result.html'));
$('print').onclick=()=>window.print();
$('download').onclick=async()=>{const b=$('download');b.disabled=true;$('exportMessage').textContent='파일을 준비하고 있습니다…';try{const zip=new JSZip();zip.file('result.html',reportHTML());zip.file('responses.json',JSON.stringify({schema_version:1,result,answers:state.answers,media:state.media,dwell_seconds:state.dwell_seconds,started_at:new Date(state.started).toISOString(),hidden_count:state.hidden_count,assessment_status:'writing_and_speaking_awaiting_review'},null,2));for(const [key,blob]of blobs)zip.file(`recordings/${key}.${blob.type.includes('mp4')?'m4a':'webm'}`,blob);zip.file('README.txt','결과: result.html\n답안·진행 기록: responses.json\n말하기: recordings 폴더\n쓰기·말하기는 평가 전이며 공식 APTIS 점수·CEFR로 환산하지 않았습니다.\n이 파일은 본인의 답안과 목소리를 포함합니다. 직접 보관하거나 선택한 평가자에게 전달하세요.');download(await zip.generateAsync({type:'blob'}),filename('responses.zip'));$('exportMessage').textContent='다운로드를 요청했습니다. 다운로드 폴더에서 ZIP 파일이 저장되었는지 확인해 주세요.';}catch(e){$('exportMessage').textContent='파일을 만들지 못했습니다. 이 화면을 닫지 말고 다시 시도해 주세요.';}finally{b.disabled=false;}};
document.addEventListener('visibilitychange',()=>{if(state&&document.hidden)state.hidden_count++;});
window.addEventListener('beforeunload',e=>{if(state||busy()){e.preventDefault();e.returnValue='';}});
setInterval(()=>{if(state)$('elapsed').textContent=`경과 ${time((Date.now()-state.started)/1000)}`;},1000);
