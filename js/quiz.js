// js/quiz.js - Quiz engine, data loading, boost, simulation, sim review

function getQuizData(key){
  let raw=null;
  if(typeof HEBREW_DATA!=='undefined'){
    if(key==='ex1')raw=HEBREW_DATA.exercises?.ex1;
    if(key==='ex2')raw=HEBREW_DATA.exercises?.ex2;
    if(key==='ex3')raw=HEBREW_DATA.exercises?.ex3;
    if(key==='ex4')raw=HEBREW_DATA.exercises?.ex4;
    if(key==='ex5')raw=HEBREW_DATA.exercises?.ex5;
    if(key==='ex6')raw=HEBREW_DATA.exercises?.ex6;
    if(key==='expr1')raw=HEBREW_DATA.expressionExercises?.expressionQuiz1;
    if(key==='expr2')raw=HEBREW_DATA.expressionExercises?.expressionQuiz2;
    if(key==='wordMatch')raw=HEBREW_DATA.wordMatch;
    if(key==='opposites')raw=HEBREW_DATA.opposites;
    if(key==='comprehension')raw=HEBREW_DATA.comprehension;
    if(key==='comprehension2')raw=HEBREW_DATA.comprehension2;
    if(key==='spelling')raw=HEBREW_DATA.spelling;
    if(key==='spelling2')raw=HEBREW_DATA.spelling2;
  }
  if(!raw&&typeof DPR_DATA!=='undefined'){
    if(key==='instr1')raw=DPR_DATA.instructions?.ex1;
    if(key==='dictEx')raw=DPR_DATA.instructions?.dictionary;
    if(key==='dictPractice')raw=DPR_DATA.instructions?.dictionaryPractice;
    if(key==='compass')raw=DPR_DATA.instructions?.compass;
    if(key==='instrTest')raw=DPR_DATA.instructions?.comprehensiveTest;
    if(key==='seq3')raw=DPR_DATA.sequences?.ex3;
    if(key==='seq4')raw=DPR_DATA.sequences?.ex4;
    if(key==='seq5')raw=DPR_DATA.sequences?.ex5;
    if(key==='seq6')raw=DPR_DATA.sequences?.ex6;
    if(key==='seq7')raw=DPR_DATA.sequences?.ex7;
    if(key==='seq8')raw=DPR_DATA.sequences?.ex8;
    if(key==='shapes')raw=DPR_DATA.shapes;
    if(key==='shapes2')raw=DPR_DATA.shapes2;
    if(key==='shapes3')raw=DPR_DATA.shapes3;
    if(key==='shapes4')raw=DPR_DATA.shapes4;
  }
  if(!raw&&typeof EXAM_QUESTIONS!=='undefined'&&key==='examPractice'){
    const all=[];
    if(EXAM_QUESTIONS.hebrew)all.push(...tagQuestions(EXAM_QUESTIONS.hebrew,'exam_heb'));
    if(EXAM_QUESTIONS.dpr_cheshboni)all.push(...tagQuestions(EXAM_QUESTIONS.dpr_cheshboni,'exam_cheshboni'));
    if(EXAM_QUESTIONS.dpr_tzurani)all.push(...tagQuestions(EXAM_QUESTIONS.dpr_tzurani,'exam_tzurani'));
    if(EXAM_QUESTIONS.dpr_miluli)all.push(...tagQuestions(EXAM_QUESTIONS.dpr_miluli,'exam_miluli'));
    return all.length?applyOverrides(all):null;
  }
  if(!raw)return null;
  let questions=tagQuestions(raw,key);
  if(key==='spelling'||key==='spelling2'){
    questions=questions.map(q=>{
      const newO=[...q.o,'המשפט כתוב נכון'];
      return {...q,o:newO,a:q.a===-1?newO.length-1:q.a};
    });
  }
  return applyOverrides(questions);
}

function getBoostQuestions(cat){
  const all=[];
  if(cat==='hebrew'){
    ['ex1','ex2','ex3','ex4','ex5','ex6','expr1','expr2','wordMatch','opposites','comprehension','comprehension2','spelling','spelling2'].forEach(k=>{const d=getQuizData(k);if(d)all.push(...d)});
  }else{
    ['instr1','dictEx','dictPractice','compass','instrTest','seq3','seq4','seq5','seq6','seq7','seq8','shapes','shapes2','shapes3','shapes4'].forEach(k=>{const d=getQuizData(k);if(d)all.push(...d)});
  }
  return shuffle(all).slice(0,10);
}

function getSimQuestions(cat){
  const all=[];
  const count=cat==='hebrew'?33:30;
  if(cat==='hebrew'){
    ['ex1','ex2','ex3','ex4','ex5','ex6','expr1','expr2','wordMatch','opposites','comprehension','comprehension2','spelling','spelling2'].forEach(k=>{const d=getQuizData(k);if(d)all.push(...d)});
  }else{
    ['instr1','dictEx','dictPractice','compass','instrTest','seq3','seq4','seq5','seq6','seq7','seq8','shapes','shapes2','shapes3','shapes4'].forEach(k=>{const d=getQuizData(k);if(d)all.push(...d)});
  }
  return shuffle(all).slice(0,count);
}


// ===== REGULAR QUIZ =====
function openQuiz(step){
  const data=getQuizData(step.dataKey);
  if(!data||!data.length){toast('אין שאלות זמינות עדיין');return}
  isBoostMode=false;isSimMode=false;
  qList=data;qIdx=0;qCorrect=0;elapsed=0;
  clearAllTimers();
  timerInt=setInterval(()=>{elapsed++;document.getElementById('q-timer').textContent='⏱️ '+fmtTime(elapsed)},1000);
  showScreen('quiz-screen');renderQ();
}

function renderQ(){
  const q=qList[qIdx],total=qList.length;
  document.getElementById('q-counter').textContent=`שאלה ${qIdx+1}/${total}`;
  document.getElementById('q-prog').style.width=(qIdx/total*100)+'%';
  if(q.visual){
    document.getElementById('q-text').innerHTML=q.q+'<div class="visual-block">'+q.visual+'</div>';
  } else {
    document.getElementById('q-text').textContent=q.q;
  }
  const _isDpr=isBoostMode?(boostCat==='dpr'):(PATH[curStep]?.cat==='dpr');
  if(_isDpr){const _n=document.createElement('div');_n.className='dpr-note';_n.textContent='בפרק זה ניתן להשתמש בעט ובנייר טיוטה לביצוע רישומים נדרשים';document.getElementById('q-text').appendChild(_n)}
  if(isBoostMode){
    document.getElementById('q-timer').innerHTML=`<span class="timer-badge${boostRemaining<=60?' warning':''}">⏱️ ${fmtTime(boostRemaining)}</span>`;
  }
  const c=document.getElementById('opts-container');c.innerHTML='';
  q.o.forEach((opt,i)=>{
    const btn=document.createElement('button');btn.className='option-btn';
    if(q.visualOpts){
      btn.innerHTML=`<span class="option-letter">${LETTERS[i]||i+1}</span><span class="visual-opt">${opt}</span>`;
    } else {
      btn.innerHTML=`<span class="option-letter">${LETTERS[i]||i+1}</span><span>${opt}</span>`;
    }
    btn.onclick=()=>handleAns(btn,i===q.a,q.e,c);
    c.appendChild(btn);
  });
  document.getElementById('fb-container').className='feedback-container hidden';
}

function handleAns(btn,correct,expl,container){
  container.querySelectorAll('.option-btn').forEach(b=>{
    b.classList.add('disabled');
    const idx=[...container.children].indexOf(b);
    if(idx===qList[qIdx].a)b.classList.add('correct');
  });
  if(correct){btn.classList.add('correct');qCorrect++}
  else btn.classList.add('wrong');
  const fb=document.getElementById('fb-container');
  document.getElementById('fb-text').textContent=correct?'✓ נכון!':'✗ לא נכון';
  fb.className='feedback-container '+(correct?'correct-fb':'wrong-fb');
  document.getElementById('fb-explanation').textContent=expl||'';
  fb.classList.remove('hidden');
  document.getElementById('next-btn').textContent=qIdx>=qList.length-1?'סיים ←':'הבא ←';
}

function nextQ(){qIdx++;qIdx>=qList.length?endQuiz():renderQ()}

function quitQuiz(){
  if(confirm('בטוח שאתה רוצה לצאת? ההתקדמות בתרגול הזה לא תישמר.')){
    clearAllTimers();isBoostMode?showDash():showPath();
  }
}

function endQuiz(){
  clearAllTimers();
  const step=PATH[curStep];
  const dataKey=isBoostMode?('boost_'+boostCat):(step?step.dataKey:null);
  // Save quiz results
  if(dataKey&&user){
    if(!user.quizResults)user.quizResults={};
    user.quizResults[dataKey]={correct:qCorrect,total:qList.length,lastDate:Date.now()};
  }
  const mins=Math.floor(elapsed/60);
  const pct=Math.round(qCorrect/qList.length*100);
  // Anti-farming: minimum 1 minute for any points
  let compPts=0,timePts=0,boostBonus=0,accuracyPts=0;
  if(mins>=1){
    compPts=15;
    timePts=Math.min(mins*3,25);
    accuracyPts=Math.round(pct/100*15);
    boostBonus=isBoostMode?Math.min(mins*4,30):0;
  }
  const totalPts=compPts+timePts+accuracyPts+boostBonus;
  document.getElementById('r-emoji').textContent=pct>=80?'🏆':pct>=50?'💪':'📖';
  document.getElementById('r-score').textContent=qCorrect+'/'+qList.length;
  document.getElementById('r-sub').textContent=pct>=80?'מצוין!':pct>=50?'לא רע, המשך לתרגל!':'צריך עוד תרגול';
  document.getElementById('r-comp').textContent='+'+compPts;
  document.getElementById('r-time').textContent='+'+(timePts+accuracyPts);
  document.getElementById('r-total').textContent='+'+totalPts;
  user.points+=totalPts;
  if(isBoostMode){
    user.boostCount=(user.boostCount||0)+1;
  }
  if(!isBoostMode&&step){
    if(!user.completed)user.completed=[];
    if(!user.completed.includes(step.id))user.completed.push(step.id);
  }
  saveUser(user);
  if(pct>=80)confetti();
  if(isBoostMode){
    const _bc=boostCat;
    document.getElementById('r-next').textContent='⚡ בוסט נוסף ←';
    document.getElementById('r-next').onclick=()=>{isBoostMode=false;startBoost(_bc==='hebrew'?'hebrew':'dpr')};
    document.getElementById('r-back').textContent='חזרה למסך ראשי';
    document.getElementById('r-back').onclick=()=>{isBoostMode=false;showDash()};
  } else {
    document.getElementById('r-next').onclick=()=>{
      const curCat=PATH[curStep]?.cat;
      let nextIdx=-1;
      for(let j=curStep+1;j<PATH.length;j++){
        if(PATH[j].cat===curCat&&!(user.completed||[]).includes(PATH[j].id)){nextIdx=j;break}
      }
      if(nextIdx>=0)openStep(nextIdx);else showDash();
    };
    document.getElementById('r-next').textContent='שלב הבא ←';
    document.getElementById('r-back').textContent='חזרה';
    document.getElementById('r-back').onclick=()=>showPath();
  }
  isBoostMode=false;
  showScreen('results-screen');
}

// ===== COMPLETE LESSON =====
const NO_POINTS_STEPS=['intro','vocab','expr_learn','instr_learn','seq_learn','shapes_learn'];
function completeStep(step){
  if(!user.completed)user.completed=[];
  if(!user.completed.includes(step.id))user.completed.push(step.id);
  if(NO_POINTS_STEPS.includes(step.id)){
    saveUser(user);toast('שלב הושלם!','ach');
  } else {
    const mins=Math.floor((Date.now()-sessionStart)/60000);
    const pts=15,timePts=Math.min(mins*3,15);
    if(mins<1){saveUser(user);toast('שלב הושלם!','ach');}
    else{user.points+=pts+timePts;saveUser(user);toast('שלב הושלם! +'+(pts+timePts)+' נקודות','ach');}
  }
  const _curCat=PATH[curStep]?.cat;
  let _nextIdx=-1;
  for(let j=curStep+1;j<PATH.length;j++){
    if(PATH[j].cat===_curCat&&!(user.completed||[]).includes(PATH[j].id)){_nextIdx=j;break}
  }
  if(_nextIdx>=0)openStep(_nextIdx);else showDash();
}


// ===== BOOST MODE =====
function showBoost(){showScreen('boost-screen')}

function startBoost(cat){
  boostCat=cat;
  const qs=getBoostQuestions(cat);
  if(!qs.length){toast('אין שאלות זמינות');return}
  isBoostMode=true;isSimMode=false;
  qList=qs;qIdx=0;qCorrect=0;elapsed=0;
  boostRemaining=cat==='dpr'?480:300; // dpr=8min, hebrew=5min
  clearAllTimers();
  timerInt=setInterval(()=>{
    elapsed++;boostRemaining--;
    document.getElementById('q-timer').innerHTML=`<span class="timer-badge${boostRemaining<=60?' warning':''}">⏱️ ${fmtTime(boostRemaining)}</span>`;
    if(boostRemaining<=0){clearAllTimers();endQuiz()}
  },1000);
  showScreen('quiz-screen');renderQ();
}

// ===== SIMULATION MODE =====
function showSimSelection(){
  document.getElementById('sim-selection').classList.remove('hidden');
  document.getElementById('sim-quiz-body').classList.add('hidden');
  document.getElementById('sim-intro').classList.add('hidden');
  document.getElementById('sim-header').textContent='📝 סימולציית מבחן רמה';
  document.getElementById('quit-sim-btn').onclick=()=>showDash();
  document.getElementById('quit-sim-btn').textContent='→ חזרה';
  document.getElementById('quit-sim-btn').className='back-btn';
  showScreen('sim-screen');
}

function showSimIntro(cat,simKey){
  const isHeb=cat==='hebrew';
  const isLevel=simKey&&simKey.includes('level');
  const isFinal=simKey&&simKey.includes('final');
  const qCount=isHeb?33:30;
  const mins=isHeb?23:25;
  const catName=isHeb?'עברית':'דפ"ר';

  // Goals
  let goals='';
  if(isLevel){
    goals=`<p style="font-size:14px;line-height:1.8">מטרת מבחן הרמה היא <strong>למפות את הרמה הנוכחית</strong> שלך ב${catName}.</p>
    <p style="font-size:14px;line-height:1.8">התוצאות יעזרו לך להבין על מה לשים דגש במסלול הלמידה.</p>`;
  } else if(isFinal){
    goals=`<p style="font-size:14px;line-height:1.8">מטרת מבחן הסיום היא <strong>למדוד את ההתקדמות</strong> שלך ב${catName} לאחר השלמת מסלול הלמידה.</p>
    <p style="font-size:14px;line-height:1.8">השווה את התוצאות למבחן הרמה וראה כמה השתפרת!</p>`;
  } else {
    goals=`<p style="font-size:14px;line-height:1.8">סימולציה מלאה של מבחן ב${catName} בתנאים אמיתיים.</p>`;
  }

  // Details
  const details=`<ul style="line-height:2;font-size:14px">
    <li><strong>${qCount} שאלות</strong> - ${catName}</li>
    <li><strong>${mins} דקות</strong> - הזמן המוקצב</li>
    <li>ללא משוב מיידי - תראה תוצאות בסיום</li>
    <li>ניתן לדלג ולחזור לשאלות קודמות</li>
  </ul>`;

  document.getElementById('sim-intro-title').textContent=isLevel?`🎯 מבחן רמה - ${catName}`:isFinal?`🏁 מבחן סיום - ${catName}`:`📝 סימולציית ${catName}`;
  document.getElementById('sim-intro-goals').innerHTML=goals;
  document.getElementById('sim-intro-details').innerHTML=details;

  document.getElementById('sim-selection').classList.add('hidden');
  document.getElementById('sim-quiz-body').classList.add('hidden');
  document.getElementById('sim-intro').classList.remove('hidden');
  document.getElementById('sim-header').textContent=isLevel?`מבחן רמה - ${catName}`:isFinal?`מבחן סיום - ${catName}`:`סימולציית ${catName}`;
  document.getElementById('quit-sim-btn').textContent='→ חזרה';
  document.getElementById('quit-sim-btn').className='back-btn';
  document.getElementById('quit-sim-btn').onclick=()=>showDash();
  showScreen('sim-screen');

  return{cat,qCount,mins};
}

function launchSim(cat){
  const qs=getSimQuestions(cat);
  if(!qs.length){toast('אין שאלות זמינות');return}
  isSimMode=true;isBoostMode=false;simAdvancing=false;
  qList=qs;qIdx=0;qCorrect=0;elapsed=0;simAnswers=new Array(qs.length).fill(-1);
  const dur=cat==='hebrew'?23*60:25*60;
  simRemaining=dur;
  simEndTime=Date.now()+dur*1000;
  document.getElementById('sim-intro').classList.add('hidden');
  document.getElementById('sim-quiz-body').classList.remove('hidden');
  document.getElementById('quit-sim-btn').textContent='✕ עזוב מבחן';
  document.getElementById('quit-sim-btn').className='back-btn sim-quit-btn';
  document.getElementById('quit-sim-btn').onclick=()=>quitSim();
  clearAllTimers();
  timerInt=setInterval(()=>{
    simRemaining=Math.max(0,Math.ceil((simEndTime-Date.now())/1000));
    elapsed=dur-simRemaining;
    if(simRemaining<=0){clearAllTimers();endSim();return}
    updateSimHeader();
  },500);
  renderSimQ();
}

function startSim(cat){
  simCat=cat;
  showSimIntro(cat,null);
  document.getElementById('sim-intro-start').onclick=()=>launchSim(cat);
}

function renderSimQ(){
  const q=qList[qIdx];
  updateSimHeader();
  if(q.visual){
    document.getElementById('sim-q-text').innerHTML=q.q+'<div class="visual-block">'+q.visual+'</div>';
  } else {
    document.getElementById('sim-q-text').textContent=q.q;
  }
  if(simCat==='dpr'){const _n=document.createElement('div');_n.className='dpr-note';_n.textContent='בפרק זה ניתן להשתמש בעט ובנייר טיוטה לביצוע רישומים נדרשים';document.getElementById('sim-q-text').appendChild(_n)}
  const c=document.getElementById('sim-opts');c.innerHTML='';
  const selected=simAnswers[qIdx];
  q.o.forEach((opt,i)=>{
    const btn=document.createElement('button');btn.className='option-btn'+(i===selected?' selected':'');
    if(q.visualOpts){
      btn.innerHTML=`<span class="option-letter">${LETTERS[i]||i+1}</span><span class="visual-opt">${opt}</span>`;
    } else {
      btn.innerHTML=`<span class="option-letter">${LETTERS[i]||i+1}</span><span>${opt}</span>`;
    }
    btn.onclick=()=>handleSimAns(i);
    c.appendChild(btn);
  });
  // Navigation buttons
  document.getElementById('sim-nav-back').style.display=qIdx>0?'':'none';
  document.getElementById('sim-nav-skip').style.display=qIdx<qList.length-1?'':'none';
  document.getElementById('sim-nav-skip').textContent='הבא ←';
}

function handleSimAns(idx){
  simAnswers[qIdx]=idx;
  const btns=document.getElementById('sim-opts').querySelectorAll('.option-btn');
  btns.forEach(b=>b.classList.remove('selected'));
  btns[idx].classList.add('selected');
  updateSimHeader();
}

function simNavNext(){
  if(qIdx>=qList.length-1){
    confirmFinishSim();
    return;
  }
  qIdx++;
  renderSimQ();
}

function confirmFinishSim(){
  const unanswered=simAnswers.filter(a=>a===-1).length;
  const ov=document.createElement('div');
  ov.className='sim-confirm-overlay';
  let msg=unanswered>0
    ?`<h3>יש ${unanswered} שאלות שטרם נענו</h3><p>ניתן לחזור ולהשלים את המענה, או לסיים את המבחן עכשיו</p>`
    :'<h3>לסיים את המבחן?</h3><p>ענית על כל השאלות</p>';
  ov.innerHTML=`<div class="sim-confirm-box">
    ${msg}
    <div class="sim-confirm-btns">
      <button class="btn btn-secondary" id="finish-confirm-back">${unanswered>0?'חזור להשלים':'חזור למבחן'}</button>
      <button class="btn btn-primary" id="finish-confirm-end">סיים מבחן</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  document.getElementById('finish-confirm-back').onclick=()=>{
    ov.remove();
    if(unanswered>0){
      // Jump to first unanswered question
      const firstUn=simAnswers.indexOf(-1);
      if(firstUn!==-1){qIdx=firstUn;renderSimQ()}
    }
  };
  document.getElementById('finish-confirm-end').onclick=()=>{ov.remove();clearAllTimers();endSim()};
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
}
function simNavBack(){
  if(qIdx>0){qIdx--;renderSimQ()}
}

function updateSimHeader(){
  const total=qList.length;
  const answered=simAnswers.filter(a=>a!==-1).length;
  document.getElementById('sim-header').innerHTML=`<span class="timer-badge${simRemaining<=120?' warning':''}">⏱️ ${fmtTime(simRemaining)}</span> שאלה ${qIdx+1}/${total} (${answered}/${total} נענו)`;
}

function quitSim(){
  if(!isSimMode){showDash();return}
  // Custom confirm dialog
  const ov=document.createElement('div');
  ov.className='sim-confirm-overlay';
  ov.innerHTML=`<div class="sim-confirm-box">
    <h3>האם אתה בטוח שברצונך לעצור את המבחן?</h3>
    <p>לא תוכל לחזור לנקודה שבה עצרת</p>
    <div class="sim-confirm-btns">
      <button class="btn btn-secondary" id="sim-confirm-back">חזור למבחן</button>
      <button class="btn btn-quit" id="sim-confirm-quit">צא מהמבחן</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  document.getElementById('sim-confirm-back').onclick=()=>ov.remove();
  document.getElementById('sim-confirm-quit').onclick=()=>{ov.remove();clearAllTimers();endSim()};
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
}

function endSim(){
  clearAllTimers();
  // Calculate results
  let correct=0;
  const catBreakdown={};
  qList.forEach((q,i)=>{
    const isCorrect=simAnswers[i]===q.a;
    if(isCorrect)correct++;
    const cat=findQuestionCat(q);
    if(!catBreakdown[cat])catBreakdown[cat]={correct:0,total:0};
    catBreakdown[cat].total++;
    if(isCorrect)catBreakdown[cat].correct++;
  });
  const pct=Math.round(correct/qList.length*100);
  const grade=pctToGrade(pct);
  // Award sim engagement points (time-weighted, min 2 minutes)
  const simMins=Math.floor(elapsed/60);
  const simPts=simMins>=2?20:0;
  const simTimePts=simMins>=2?Math.min(simMins*3,30):0;
  const simAccPts=simMins>=2?Math.round(pct/100*15):0;
  const simTotal=simPts+simTimePts+simAccPts;
  if(user){user.points=(user.points||0)+simTotal}
  // Save sim results
  const simKey=window._pathSimKey||('sim_'+simCat);
  const isFinal=simKey.startsWith('final_');
  const isLevel=simKey.startsWith('level_');
  if(user){
    if(!user.quizResults)user.quizResults={};
    user.quizResults[simKey]={correct:correct,total:qList.length,lastDate:Date.now(),catBreakdown:catBreakdown};
    user.quizResults['sim_'+simCat]={correct:correct,total:qList.length,lastDate:Date.now()};
    saveUser(user);
    if(window._pathSimKey){
      const step=PATH[curStep];
      if(step&&!user.completed.includes(step.id)){user.completed.push(step.id);saveUser(user)}
    }
  }
  // Build rich results HTML for ALL exams
  showRichSimResults(simCat,catBreakdown,correct,qList.length,pct,grade,simTotal,isLevel,isFinal);
  window._pathSimKey=null;
  isSimMode=false;
}

function showRichSimResults(cat,breakdown,correct,total,pct,grade,pts,isLevel,isFinal){
  const catName=cat==='hebrew'?'עברית':'דפ"ר';
  const typeLabel=isLevel?'מבחן רמה':isFinal?'מבחן סיום':'סימולציה';
  let html='<div class="results-container">';
  html+=`<div class="results-emoji">${pct>=75?'🌟':pct>=50?'💪':'📚'}</div>`;
  html+=`<h2 class="results-title">${typeLabel} ${catName} - תוצאות</h2>`;
  html+=`<div class="results-score">${correct}/${total}</div>`;
  html+=`<div class="sim-grade">ציון משוער: ${grade}/8</div>`;
  html+=`<p class="results-sub">${pct>=75?'תוצאה מצוינת!':pct>=50?'יש מקום לשיפור':'צריך עוד תרגול'}</p>`;

  // Comparison section (level vs final)
  const compareKey=isFinal?'level_'+cat:isLevel?'final_'+cat:null;
  const compareData=compareKey&&user?user.quizResults[compareKey]:null;
  if(compareData&&compareData.catBreakdown){
    const cPct=Math.round(compareData.correct/compareData.total*100);
    const cGrade=pctToGrade(cPct);
    const diff=pct-cPct;
    const diffColor=diff>0?'var(--ok)':diff<0?'var(--err)':'var(--txts)';
    const diffSign=diff>0?'+':'';
    const leftLabel=isFinal?'מבחן רמה':'מבחן סיום';
    const rightLabel=isFinal?'מבחן סיום':'מבחן רמה';
    html+=`<div class="glass" style="padding:16px;margin:12px 0;text-align:center">
      <div style="font-weight:700;margin-bottom:10px">📊 השוואה</div>
      <div style="display:flex;justify-content:space-around;margin-bottom:12px">
        <div><div style="font-size:11px;color:var(--txts)">${leftLabel}</div><div style="font-size:28px;font-weight:800">${cPct}%</div><div style="font-size:12px;color:var(--txtm)">ציון ${cGrade}/8</div></div>
        <div style="font-size:24px;align-self:center;color:${diffColor};font-weight:800">${isFinal?diffSign+diff+'%':''}</div>
        <div><div style="font-size:11px;color:var(--txts)">${rightLabel}</div><div style="font-size:28px;font-weight:800;color:var(--pl)">${pct}%</div><div style="font-size:12px;color:var(--txtm)">ציון ${grade}/8</div></div>
      </div>
    </div>`;
    // Per-category comparison
    html+=`<div class="glass" style="padding:12px;margin:8px 0"><div style="font-weight:700;margin-bottom:8px">פירוט השוואתי:</div>`;
    for(const[catN,data] of Object.entries(breakdown)){
      const fPct=Math.round(data.correct/data.total*100);
      const cCat=compareData.catBreakdown[catN];
      const lPct=cCat?Math.round(cCat.correct/cCat.total*100):null;
      const catDiff=lPct!==null?(isFinal?fPct-lPct:lPct-fPct):null;
      const catColor=catDiff!==null?(catDiff>0?'var(--ok)':catDiff<0?'var(--err)':'var(--txts)'):'var(--txts)';
      html+=`<div class="sim-cat-row"><span>${catN}</span><span style="font-weight:600">${lPct!==null?lPct+'%':'--'} → <span style="color:${catColor}">${fPct}%</span></span></div>`;
    }
    html+=`</div>`;
  }

  // Category breakdown
  html+=`<div class="glass" style="padding:12px;margin:8px 0"><div style="font-weight:700;margin-bottom:8px">פירוט לפי נושא:</div>`;
  for(const[catN,data] of Object.entries(breakdown)){
    const cp=Math.round(data.correct/data.total*100);
    html+=`<div class="sim-cat-row"><span>${catN}</span><span style="font-weight:700;color:${cp>=70?'var(--ok)':cp>=40?'#f9a825':'var(--err)'}">${data.correct}/${data.total} (${cp}%)</span></div>`;
  }
  html+=`<div class="sim-cat-row" style="border-top:2px solid var(--p);margin-top:6px;padding-top:6px;font-weight:800"><span>זמן שימוש</span><span>${fmtTime(elapsed)}</span></div>`;
  html+=`<div class="sim-cat-row" style="font-weight:700;color:var(--pl)"><span>⭐ ניקוד שנצבר</span><span>+${pts}</span></div>`;
  html+=`</div>`;

  // Strengths & Weaknesses
  const sorted=Object.entries(breakdown).sort((a,b)=>(b[1].correct/b[1].total)-(a[1].correct/a[1].total));
  const strengths=sorted.filter(([,d])=>Math.round(d.correct/d.total*100)>=70);
  const weaknesses=sorted.filter(([,d])=>Math.round(d.correct/d.total*100)<70);
  if(strengths.length||weaknesses.length){
    html+=`<div class="glass" style="padding:12px;margin:8px 0">`;
    if(strengths.length){
      html+=`<div style="font-weight:700;color:var(--ok);margin-bottom:6px">💪 חוזקות</div>`;
      strengths.forEach(([n,d])=>{
        const cp=Math.round(d.correct/d.total*100);
        html+=`<div style="font-size:13px;padding:3px 0;color:var(--txts)">✅ ${n} — ${cp}%</div>`;
      });
    }
    if(weaknesses.length){
      html+=`<div style="font-weight:700;color:var(--err);margin-top:${strengths.length?'10':'0'}px;margin-bottom:6px">🎯 צריך לחזק</div>`;
      weaknesses.forEach(([n,d])=>{
        const cp=Math.round(d.correct/d.total*100);
        html+=`<div style="font-size:13px;padding:3px 0;color:var(--txts)">⚠️ ${n} — ${cp}%</div>`;
      });
    }
    // Recommendations
    if(weaknesses.length)html+=`<div style="margin-top:10px;font-size:12px;color:var(--txtm)">מומלץ לחזור על התרגולים בנושאים שצריך לחזק</div>`;
    if(pct>=75)html+=`<div style="margin-top:8px;font-weight:600;color:var(--ok)">כל הכבוד! רמת הכנה טובה מאוד.</div>`;
    else if(pct>=50)html+=`<div style="margin-top:8px;font-weight:600;color:var(--pop)">יש שיפור! המשך לתרגל.</div>`;
    else html+=`<div style="margin-top:8px;font-weight:600;color:var(--err)">מומלץ לעבור שוב על המסלול.</div>`;
    html+=`</div>`;
  }

  html+=`<div class="results-actions" style="margin-top:14px">
    <button class="btn btn-primary" onclick="showDash()">חזרה למסלול</button>
    <button class="btn btn-secondary" onclick="showSimReview()">סקירת שאלות 🔍</button>
  </div></div>`;

  document.getElementById('sim-results-screen').innerHTML=html;
  showScreen('sim-results-screen');
}

function findQuestionCat(q){
  // Attempt to categorize by checking which data pool contains this question
  const hebKeys=['ex1','ex2','ex3','ex4','ex5','ex6'];
  const exprKeys=['expr1','expr2'];
  const matchKeys=['wordMatch','opposites'];
  const comprKeys=['comprehension','comprehension2'];
  const spellKeys=['spelling','spelling2'];
  const instrKeys=['instr1','dictEx','dictPractice','compass','instrTest'];
  const seqKeys=['seq3','seq4','seq5','seq6','seq7','seq8'];
  for(const k of hebKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'אוצר מילים'}
  for(const k of exprKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'ביטויים'}
  for(const k of matchKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'הפכים והתאמות'}
  for(const k of comprKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'הבנת הנקרא'}
  for(const k of spellKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'כתיב'}
  for(const k of instrKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'מילוי הוראות'}
  for(const k of seqKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'סדרות'}
  const shapesKeys=['shapes','shapes2','shapes3','shapes4'];
  for(const k of shapesKeys){const d=getQuizData(k);if(d&&d.some(x=>x.q===q.q))return 'צורות ודפוסים'}
  return simCat==='hebrew'?'עברית':'דפ"ר';
}

function pctToGrade(pct){
  if(pct>=95)return 8;if(pct>=85)return 7;if(pct>=75)return 6;if(pct>=65)return 5;
  if(pct>=55)return 4;if(pct>=45)return 3;if(pct>=30)return 2;return 1;
}


// ===== CLEAR TIMERS =====
function clearAllTimers(){
  if(timerInt){clearInterval(timerInt);timerInt=null}
  if(boostTimer){clearInterval(boostTimer);boostTimer=null}
  if(simTimer){clearInterval(simTimer);simTimer=null}
}

// ===== SIM REVIEW =====
function showSimReview(){
  const list=document.getElementById('review-list');
  let html='';
  qList.forEach((q,i)=>{
    const userAns=simAnswers[i];
    html+=`<div class="glass review-item"><div class="review-q-num">שאלה ${i+1}/${qList.length}</div>`;
    html+=`<div class="review-q-text">${q.q}</div>`;
    if(q.visual) html+=`<div class="visual-block">${q.visual}</div>`;
    q.o.forEach((opt,j)=>{
      let cls='review-opt';
      if(j===q.a && j===userAns) cls+=' user-correct';
      else if(j===userAns && userAns!==q.a) cls+=' user-wrong';
      else if(j===q.a) cls+=' correct-answer';
      if(q.visualOpts){
        html+=`<div class="${cls}"><span class="review-letter">${LETTERS[j]||j+1}</span><span class="visual-opt">${opt}</span></div>`;
      } else {
        html+=`<div class="${cls}"><span class="review-letter">${LETTERS[j]||j+1}</span><span>${opt}</span></div>`;
      }
    });
    if(userAns===-1) html+=`<div style="font-size:12px;color:var(--txtm);margin-top:4px">לא נענתה</div>`;
    if(q.e) html+=`<div style="font-size:12px;color:var(--txtl);margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.05)">💡 ${q.e}</div>`;
    html+=`</div>`;
  });
  list.innerHTML=html;
  showScreen('sim-review-screen');
}


