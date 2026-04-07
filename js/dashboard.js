// js/dashboard.js - Dashboard, path, time tracking, navigation, readiness
// Auto-extracted from index.html

// ===== TIME TRACKING =====
function startTimeTracking(){
  sessionStart=Date.now();
  _timeTrackCounter=0;
  if(timeTracker)clearInterval(timeTracker);
  timeTracker=setInterval(()=>{
    if(!user)return;
    user.totalTime=(user.totalTime||0)+1;
    const today=new Date().toDateString();
    if(!user.dailyTimePoints)user.dailyTimePoints={};
    if(!user.dailyTimePoints[today])user.dailyTimePoints[today]=0;
    if(user.dailyTimePoints[today]<60){user.points+=2;user.dailyTimePoints[today]+=2}
    _timeTrackCounter++;
    // Save locally every minute, sync to Firestore every 5 minutes
    const us=getUsers();const key=user.uid||user.name;us[key]=user;saveUsers(us);
    if(_timeTrackCounter>=5){_timeTrackCounter=0;syncUserToFirestore(user)}
  },60000);
}


// ===== TAB NAVIGATION =====

function switchTab(tab){
  activeTab=tab;
  document.querySelectorAll('.tab-item').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  switch(tab){
    case 'path':showDash();break;
    case 'boost':showScreen('boost-screen');break;
    case 'leaderboard':showLB();break;
    case 'analytics':showAnalytics();break;
    case 'more':showMore();break;
  }
}

function showMore(){
  if(!user)return;
  document.getElementById('u-name').textContent=user.name;
  const done=(user.completed||[]).length;
  const pct=Math.round(done/PATH.length*100);
  const lv=getUserLevel(user.points);
  const ni=LEVELS.indexOf(lv);
  const nextLv=ni<LEVELS.length-1?LEVELS[ni+1]:null;
  document.getElementById('rank-label').textContent=lv.i+' '+lv.n+' (רמה '+lv.lv+')';
  document.getElementById('pts-next').textContent=nextLv?`${user.points}/${nextLv.min}`:`${user.points} נק׳ - מקסימום!`;
  document.getElementById('rank-prog').style.width=getLevelProgress(user.points)+'%';
  document.getElementById('s-done').textContent=done;
  document.getElementById('s-progress').textContent=pct+'%';
  document.getElementById('s-time').textContent=user.totalTime||0;
  document.getElementById('admin-reports-btn').style.display=user.isAdmin?'flex':'none';
  document.getElementById('admin-lb-config-btn').style.display=user.isAdmin?'flex':'none';
  document.getElementById('admin-push-overrides-btn').style.display=user.isAdmin?'flex':'none';
  document.getElementById('admin-qbank-btn').style.display=user.isAdmin?'flex':'none';
  document.getElementById('admin-seed-count-btn').style.display=user.isAdmin?'flex':'none';
  // Profile display
  const pDisp=document.getElementById('profile-display-content');
  const pCard=document.getElementById('profile-display');
  if(user.profile){
    pCard.style.display='';
    const p=user.profile;
    if(p.role==='active'){
      pDisp.innerHTML=`<div>סטטוס: <strong>שוטר פעיל</strong></div><div>מחוז/אגף: <strong>${p.district||'--'}</strong></div>${p.unit?`<div>יחידה: <strong>${p.unit}</strong></div>`:''}`;
    } else {
      pDisp.innerHTML=`<div>סטטוס: <strong>חניך בהכשרה</strong></div><div>פלוגה: <strong>${p.platoon||'--'}</strong></div><div>מחזור: <strong>${p.cohort||'--'}</strong></div>`;
    }
  } else {
    pCard.style.display='';
    pDisp.innerHTML='<div style="color:var(--txtm)">לא הוגדר פרופיל</div>';
  }
  showScreen('more-screen');
}

function editProfile(){
  _profileRole=null;
  document.querySelectorAll('.profile-role-btn').forEach(b=>{b.classList.remove('btn-primary');b.classList.add('btn-secondary')});
  document.getElementById('profile-active-fields').style.display='none';
  document.getElementById('profile-trainee-fields').style.display='none';
  document.getElementById('profile-save-btn').style.display='none';
  document.getElementById('profile-error').textContent='';
  document.getElementById('profile-back-btn').style.display='';
  if(user&&user.profile){
    const p=user.profile;
    selectProfileRole(p.role);
    if(p.role==='active'){
      document.getElementById('profile-district').value=p.district||'';
      document.getElementById('profile-unit').value=p.unit||'';
    } else {
      document.getElementById('profile-platoon').value=p.platoon||'';
      document.getElementById('profile-cohort').value=p.cohort||'';
    }
  }
  showScreen('profile-screen');
}

// ===== READINESS =====
function getReadiness(){
  if(!user)return 0;
  const done=(user.completed||[]).length;
  return Math.round((done/PATH.length)*100);
}

function updateReadiness(){
  const score=getReadiness();
  document.getElementById('readiness-val').textContent=score;
  document.getElementById('readiness-fill').style.width=score+'%';
}

// ===== HOME (Path) =====
function getBoostCount(){
  if(!user||!user.quizResults)return 0;
  return user.boostCount||0;
}

function getTotalUserCount(){
  const el=document.getElementById('h-user-count');
  const liveEl=document.getElementById('h-live-count');
  if(liveEl)liveEl.textContent='0';
  // Use cached stats counter (1 doc read, cached for 10 min)
  if(_userCountCache!==null&&(Date.now()-_userCountCacheTime<USER_COUNT_CACHE_TTL)){
    if(el)el.textContent=_userCountCache;
  } else {
    const local=Object.keys(getUsers()).length;
    if(el)el.textContent=local;
    if(db){
      db.collection('appConfig').doc('stats').get().then(doc=>{
        if(doc.exists&&doc.data().totalUsers){
          _userCountCache=doc.data().totalUsers;
          _userCountCacheTime=Date.now();
          if(el)el.textContent=_userCountCache;
        }
      }).catch(()=>{});
    }
  }
  // Live count: at least 1 (current user) + leaderboard cache
  let liveCount=user?1:0;
  if(_firestoreUsersCache&&_firestoreUsersCache.length>0){
    const fiveMinAgo=Date.now()-5*60*1000;
    const selfUid=user?user.uid:'';
    _firestoreUsersCache.forEach(u=>{
      if(u.lastActive&&u.lastActive>fiveMinAgo&&u.uid!==selfUid)liveCount++;
    });
  }
  if(liveEl)liveEl.textContent=liveCount;
}

function showDash(){
  if(!user)return;
  clearAllTimers();isBoostMode=false;isSimMode=false;
  document.getElementById('h-pts').textContent=user.points;
  document.getElementById('h-time').textContent=user.totalTime||0;
  document.getElementById('h-boost').textContent=getBoostCount();
  // Level badge
  const lv=getUserLevel(user.points);
  const lvProg=getLevelProgress(user.points);
  const ni=LEVELS.indexOf(lv);
  const nextLv=ni<LEVELS.length-1?LEVELS[ni+1]:null;
  document.getElementById('dash-level-icon').textContent=lv.i;
  document.getElementById('dash-level-name').textContent=lv.n;
  document.getElementById('dash-level-num').textContent=lv.lv;
  document.getElementById('dash-level-prog').style.width=lvProg+'%';
  document.getElementById('dash-level-next').textContent=nextLv?`${user.points||0}/${nextLv.min} לרמה הבאה`:'רמה מקסימלית!';
  getTotalUserCount();
  updateReadiness();
  renderPath();
  document.querySelectorAll('.tab-item').forEach(t=>t.classList.toggle('active',t.dataset.tab==='path'));
  activeTab='path';
  showScreen('dash-screen');
}

function renderPath(){
  const list=document.getElementById('path-list');
  list.innerHTML='';list.className='path-map';
  const NPR=3;let lastCat='',rowItems=[],rowIdx=0;
  const allNodes=[],nodeStates=[];
  const frag=document.createDocumentFragment();

  // Apply path title overrides
  const _ovr=getOverrides();
  PATH.forEach(s=>{const t=_ovr['path_title:'+s.id];if(t)s.title=t});

  // Diverse icons per step for visual variety
  const NODE_ICONS={
    'intro':'📋','vocab':'📖','heb_ex1':'✍️','heb_ex2':'📝','heb_ex3':'🔤',
    'heb_ex4':'💬','heb_ex5':'📚','heb_ex6':'🧠','expr_learn':'💡','expr_ex1':'🎯',
    'expr_ex2':'🎲','word_match':'🔗','opposites':'🔄','comprehension':'📰','comprehension2':'📰',
    'spelling':'🔍','spelling2':'🔍','instr_learn':'📐','instr_ex1':'⚙️','dict_ex':'📓','dict_practice':'🔤',
    'compass_ex':'🧭','instr_test':'📝','seq_learn':'🔢','seq_ex3':'🧮','seq_ex4':'📊',
    'seq_ex5':'🎯','seq_ex6':'💡','seq_ex7':'⚡','seq_ex8':'🏅','shapes_learn':'🔷',
    'shapes_ex':'🔶','shapes_ex2':'🔷','shapes_ex3':'🔶','shapes_ex4':'🔷',
    'level_sim_heb':'📝','level_sim_dpr':'📝','final_sim_heb':'🏆','final_sim_dpr':'🏆',
    'summary':'🎓'
  };

  function flushRow(){
    if(!rowItems.length)return;
    const row=document.createElement('div');
    row.className='path-row '+(rowIdx%2===0?'row-rtl':'row-ltr');
    rowItems.forEach(n=>row.appendChild(n));
    frag.appendChild(row);rowIdx++;rowItems=[];
  }
  function addBanner(cat){
    flushRow();
    const b=document.createElement('div');b.className='path-section-banner cat-'+cat;
    const lbl=cat==='hebrew'?'📝 עברית':cat==='dpr'?'📐 דפ"ר':'🏛️ כללי';
    b.innerHTML=`<span class="banner-icon">${lbl.split(' ')[0]}</span><span>${lbl.split(' ')[1]}</span>`;
    frag.appendChild(b);rowIdx=0;
  }

  PATH.forEach((step,i)=>{
    if(step.cat!==lastCat){lastCat=step.cat;addBanner(step.cat)}
    const done=(user.completed||[]).includes(step.id);
    const comp=user.completed||[];
    // Parallel sub-path logic: Hebrew and DPR progress independently
    let locked=false;
    if(!done&&!user.isAdmin){
      if(step.id==='intro'){
        locked=false;
      } else if(step.id==='level_sim_heb'||step.id==='level_sim_dpr'){
        locked=!comp.includes('intro');
      } else if(step.id==='final_sim_heb'){
        locked=!PATH.filter(s=>s.cat==='hebrew'&&s.id!=='final_sim_heb').every(s=>comp.includes(s.id));
      } else if(step.id==='final_sim_dpr'){
        locked=!PATH.filter(s=>s.cat==='dpr'&&s.id!=='final_sim_dpr').every(s=>comp.includes(s.id));
      } else if(step.id==='summary'){
        locked=!comp.includes('final_sim_heb')||!comp.includes('final_sim_dpr');
      } else if(step.cat==='hebrew'||step.cat==='dpr'){
        let prevInCat=null;
        for(let j=i-1;j>=0;j--){if(PATH[j].cat===step.cat){prevInCat=PATH[j];break}}
        locked=prevInCat?!comp.includes(prevInCat.id):!comp.includes('intro');
      }
    }
    const current=!done&&!locked;
    const nd=document.createElement('div');
    nd.className='path-node'+(done?' completed':'')+(current?' current':'')+(locked?' locked':'');
    const hue=step.cat==='hebrew'?'rgba(59,130,246,.12)':step.cat==='dpr'?'rgba(45,212,191,.12)':'rgba(245,158,11,.12)';
    const bdr=step.cat==='hebrew'?'rgba(59,130,246,.3)':step.cat==='dpr'?'rgba(45,212,191,.3)':'rgba(245,158,11,.3)';
    const circleStyle=done||locked?'':`style="background:${hue};border-color:${bdr}"`;
    const nodeIcon=NODE_ICONS[step.id]||step.icon;
    nd.innerHTML=`<div class="path-node-circle" ${circleStyle}>${done?'✅':nodeIcon}</div><div class="path-node-label">${step.title.replace(/ - .*/,'')}</div>`;
    if(!locked)nd.onclick=()=>openStep(i);
    allNodes.push(nd);nodeStates.push({done,current,locked});
    rowItems.push(nd);
    if(rowItems.length===NPR)flushRow();
  });
  flushRow();
  list.appendChild(frag);

  requestAnimationFrame(()=>{
    drawPathLines(list,allNodes,nodeStates);
    const cur=list.querySelector('.path-node.current');
    if(cur)cur.scrollIntoView({behavior:'smooth',block:'center'});
  });
}

function drawPathLines(container,nodes,states){
  const old=container.querySelector('svg.path-connector');if(old)old.remove();
  if(nodes.length<2)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('path-connector');
  const cRect=container.getBoundingClientRect();
  const pts=nodes.map(el=>{
    const c=el.querySelector('.path-node-circle');const r=c.getBoundingClientRect();
    return{x:r.left+r.width/2-cRect.left,y:r.top+r.height/2-cRect.top+container.scrollTop};
  });
  const maxY=Math.max(...pts.map(p=>p.y))+50;
  svg.setAttribute('viewBox',`0 0 ${cRect.width} ${maxY}`);
  svg.style.height=maxY+'px';
  for(let i=0;i<pts.length-1;i++){
    const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1',pts[i].x);ln.setAttribute('y1',pts[i].y);
    ln.setAttribute('x2',pts[i+1].x);ln.setAttribute('y2',pts[i+1].y);
    if(states[i].done&&(states[i+1].done||states[i+1].current))ln.classList.add('seg-done');
    svg.appendChild(ln);
  }
  container.insertBefore(svg,container.firstChild);
}

function showPath(){showDash()}

// ===== OPEN STEP =====
function openStep(idx){
  curStep=idx;const step=PATH[idx];
  if(step.type==='sim'){startPathSim(step);return}
  step.type==='lesson'?openLesson(step):openQuiz(step);
}

function startPathSim(step){
  const cat=step.simCat;
  const simKeyPrefix=step.simKey||'sim';
  simCat=cat;
  window._pathSimKey=simKeyPrefix+'_'+cat;
  showSimIntro(cat,simKeyPrefix+'_'+cat);
  document.getElementById('sim-intro-start').onclick=()=>launchSim(cat);
}


