// js/features.js - Leaderboard, classification, analytics, flashcards
// Auto-extracted from index.html

// ===== LEADERBOARD + CLASSIFICATION =====

function showLB(){
  if(!user)return;
  // If user not yet classified, show classification modal first
  if(!user.classification){
    showClassifyModal();
    return;
  }
  renderLB();
  showScreen('lb-screen');
}

function renderLBFilters(){
  const filters=document.getElementById('lb-filters');
  const pills=[{id:'all',label:'הכל'},{id:'citizen',label:'👤 אזרחים'},{id:'officer',label:'👮 שוטרים'},{id:'trainee',label:'🎓 חניכים'}];
  filters.innerHTML=pills.map(p=>`<div class="lb-filter-pill${p.id===lbFilter?' active':''}" onclick="setLBFilter('${p.id}')">${p.label}</div>`).join('');

  const subFilters=document.getElementById('lb-sub-filters');
  subFilters.innerHTML='';
  if(lbFilter==='officer'){
    const cfg=getLBConfig();
    let html=`<select onchange="lbSubFilter=this.value;renderLBList()"><option value="">כל המחוזות</option>`;
    cfg.districts.forEach(d=>{html+=`<option value="${d}"${lbSubFilter===d?' selected':''}>${d}</option>`});
    html+=`</select>`;
    subFilters.innerHTML=html;
  }else if(lbFilter==='trainee'){
    const cfg=getLBConfig();
    let html=`<select onchange="lbSubFilter=this.value;renderLBList()"><option value="">כל הפלוגות</option>`;
    cfg.traineeCompanies.forEach(c=>{html+=`<option value="${c}"${lbSubFilter===c?' selected':''}>${c}</option>`});
    html+=`</select>`;
    html+=`<select onchange="lbSubFilter2=this.value;renderLBList()"><option value="">כל המחזורים</option>`;
    cfg.traineeCohorts.forEach(c=>{html+=`<option value="${c}"${lbSubFilter2===c?' selected':''}>${c}</option>`});
    html+=`</select>`;
    subFilters.innerHTML=html;
  }
}

function setLBFilter(f){
  lbFilter=f;lbSubFilter='';lbSubFilter2='';
  renderLBFilters();renderLBList();
}

function renderLB(){
  renderLBFilters();renderLBList();
}

function renderLBList(){
  const list=document.getElementById('lb-list');
  list.innerHTML='<div class="no-data-msg" style="opacity:.6">טוען טבלת דירוג...</div>';
  // Merge local + Firestore users
  fetchFirestoreLeaderboard().then(firestoreUsers=>{
    const localUsers=Object.values(getUsers());
    // Build map by name, prefer highest points
    const merged={};
    localUsers.forEach(u=>{merged[u.name]=u});
    firestoreUsers.forEach(fu=>{
      if(!fu.name)return;
      if(!merged[fu.name]){merged[fu.name]=fu}
      else{
        // Keep higher points, union completed
        if(fu.points>merged[fu.name].points)merged[fu.name].points=fu.points;
        const fc=new Set([...(merged[fu.name].completed||[]),...(fu.completed||[])]);
        merged[fu.name].completed=[...fc];
        if(fu.classification&&!merged[fu.name].classification)merged[fu.name].classification=fu.classification;
      }
    });
    let allUsers=Object.values(merged);
    // Apply filters
    if(lbFilter!=='all'){
      allUsers=allUsers.filter(u=>u.classification&&u.classification.type===lbFilter);
      if(lbFilter==='officer'&&lbSubFilter){
        allUsers=allUsers.filter(u=>u.classification&&u.classification.district===lbSubFilter);
      }
      if(lbFilter==='trainee'){
        if(lbSubFilter)allUsers=allUsers.filter(u=>u.classification&&u.classification.company===lbSubFilter);
        if(lbSubFilter2)allUsers=allUsers.filter(u=>u.classification&&u.classification.cohort===lbSubFilter2);
      }
    }
    const sorted=allUsers.sort((a,b)=>(b.points||0)-(a.points||0));
    list.innerHTML='';
    if(!sorted.length){list.innerHTML='<div class="no-data-msg">אין משתמשים בקטגוריה זו</div>';return}
    const medals=['🥇','🥈','🥉'],rc=['gold','silver','bronze'];
    sorted.forEach((u,i)=>{
      const me=user&&u.name===user.name;
      const cls=u.classification;
      let tag='';
      if(cls){
        const t=USER_TYPES.find(x=>x.id===cls.type);
        let detail=t?t.icon+' ':'';
        if(cls.type==='officer'&&cls.district)detail+=cls.district;
        else if(cls.type==='trainee'){detail+=[cls.company,cls.cohort].filter(Boolean).join(' | ')}
        else if(t)detail+=t.label;
        tag=`<div class="lb-classify-tag">${detail}</div>`;
      }
      const udone=(u.completed||[]).length;
      const upct=PATH.length?Math.round(udone/PATH.length*100):0;
      const ulv=getUserLevel(u.points||0);
      const row=document.createElement('div');row.className='lb-row glass'+(me?' me':'')+(i<3?' top3':'');
      row.innerHTML=`<div class="lb-rank ${i<3?rc[i]:''}">${i<3?medals[i]:i+1}</div>
        <div class="lb-avatar">${u.name[0]}</div>
        <div class="lb-info"><div class="lb-name">${u.name}${me?' ★':''}</div><div class="lb-level"><span class="lb-level-icon">${ulv.i}</span>${ulv.n}</div>${tag}</div>
        <div class="lb-pts">${u.points||0}</div>`;
      list.appendChild(row);
    });
  });
}

// ===== CLASSIFICATION MODAL =====

function showClassifyModal(){
  classifyType=null;
  const opts=document.getElementById('classify-type-options');
  opts.innerHTML=USER_TYPES.map(t=>`<div class="classify-option" data-type="${t.id}" onclick="selectClassifyType('${t.id}')">
    <div class="classify-option-icon">${t.icon}</div>
    <div class="classify-option-text">${t.label}</div>
    <div class="classify-option-check"></div>
  </div>`).join('');
  document.getElementById('classify-step2').classList.add('hidden');
  document.getElementById('classify-save-btn').classList.add('hidden');
  document.getElementById('classify-modal').classList.remove('hidden');
  showScreen('lb-screen');
}

function selectClassifyType(type){
  classifyType=type;
  document.querySelectorAll('.classify-option').forEach(o=>{
    o.classList.toggle('selected',o.dataset.type===type);
    o.querySelector('.classify-option-check').textContent=o.dataset.type===type?'✓':'';
  });
  const step2=document.getElementById('classify-step2');
  const form=document.getElementById('classify-details-form');
  const saveBtn=document.getElementById('classify-save-btn');

  if(type==='citizen'){
    step2.classList.add('hidden');
    saveBtn.classList.remove('hidden');
  }else if(type==='officer'){
    const cfg=getLBConfig();
    form.innerHTML=`<div class="classify-field"><label>מחוז / אגף</label>
      <select id="cls-district"><option value="">בחר...</option>${cfg.districts.map(d=>`<option value="${d}">${d}</option>`).join('')}</select></div>
      <div class="classify-field"><label>יחידה / פלוגה (טקסט חופשי)</label>
      <input type="text" id="cls-unit" placeholder="לדוגמה: תחנת רמת גן" dir="rtl"></div>`;
    step2.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
  }else if(type==='trainee'){
    const cfg=getLBConfig();
    form.innerHTML=`<div class="classify-field"><label>פלוגה</label>
      <select id="cls-company"><option value="">בחר...</option>${cfg.traineeCompanies.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="classify-field"><label>מחזור</label>
      <select id="cls-cohort"><option value="">בחר...</option>${cfg.traineeCohorts.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>`;
    step2.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
  }
}

function saveClassification(){
  if(!classifyType){toast('בחר סיווג');return}
  const cls={type:classifyType};
  if(classifyType==='officer'){
    const dist=document.getElementById('cls-district')?.value;
    const unit=document.getElementById('cls-unit')?.value?.trim();
    if(!dist){toast('בחר מחוז/אגף');return}
    cls.district=dist;
    if(unit)cls.unit=unit;
  }else if(classifyType==='trainee'){
    const company=document.getElementById('cls-company')?.value;
    const cohort=document.getElementById('cls-cohort')?.value;
    if(!company||!cohort){toast('בחר פלוגה ומחזור');return}
    cls.company=company;
    cls.cohort=cohort;
  }
  user.classification=cls;
  saveUser(user);
  closeClassify();
  toast('סיווג נשמר! ✓');
  renderLB();
}

function closeClassify(){
  document.getElementById('classify-modal').classList.add('hidden');
}

// ===== ADMIN LB CONFIG =====
function showAdminLBConfig(){
  if(!user||!user.isAdmin)return;
  const cfg=getLBConfig();
  const body=document.getElementById('admin-edit-body');
  const saveBtn=document.getElementById('admin-edit-save-btn');
  body.innerHTML=`
    <div class="edit-field"><label>מחוזות/אגפים (כל ערך בשורה חדשה)</label>
    <textarea id="cfg-districts" rows="8" style="font-size:12px">${cfg.districts.join('\n')}</textarea></div>
    <div class="edit-field"><label>פלוגות חניכים</label>
    <textarea id="cfg-companies" rows="4" style="font-size:12px">${cfg.traineeCompanies.join('\n')}</textarea></div>
    <div class="edit-field"><label>מחזורים</label>
    <textarea id="cfg-cohorts" rows="4" style="font-size:12px">${cfg.traineeCohorts.join('\n')}</textarea></div>`;
  saveBtn.style.display='';
  saveBtn.onclick=()=>{
    const d=document.getElementById('cfg-districts').value.split('\n').map(s=>s.trim()).filter(Boolean);
    const c=document.getElementById('cfg-companies').value.split('\n').map(s=>s.trim()).filter(Boolean);
    const co=document.getElementById('cfg-cohorts').value.split('\n').map(s=>s.trim()).filter(Boolean);
    saveLBConfig({districts:d,traineeCompanies:c,traineeCohorts:co});
    closeAdminEdit();toast('✓ הגדרות דירוג עודכנו');
    saveBtn.onclick=()=>saveAdminEdit(); // restore
  };
  document.getElementById('admin-edit-modal').classList.remove('hidden');
}


// ===== ANALYTICS V2 =====
function calcCatScore(keys,qr){
  let c=0,t=0;
  keys.forEach(k=>{if(qr[k]){c+=qr[k].correct;t+=qr[k].total}});
  return{correct:c,total:t,pct:t>0?Math.round(c/t*100):null};
}

function showAnalytics(){
  if(!user){showDash();return}
  const qr=user.quizResults||{};
  const content=document.getElementById('analytics-content');
  let totalC=0,totalT=0;

  // Per-group data
  const groupData=ANALYTICS_GROUPS.map(g=>{
    let gc=0,gt=0;
    const cats=g.cats.map(cat=>{
      const s=calcCatScore(cat.keys,qr);
      gc+=s.correct;gt+=s.total;totalC+=s.correct;totalT+=s.total;
      return{name:cat.name,...s};
    });
    return{group:g.group,icon:g.icon,color:g.color,cats,correct:gc,total:gt,pct:gt>0?Math.round(gc/gt*100):null};
  });

  // Extra data (boost/sim/flashcards)
  const extraData=ANALYTICS_EXTRA.map(e=>{
    const s=calcCatScore(e.keys,qr);
    totalC+=s.correct;totalT+=s.total;
    return{name:e.name,...s};
  });

  const overall=totalT>0?Math.round(totalC/totalT*100):0;
  const colorFor=p=>p>=70?'green':p>=40?'yellow':'red';
  const numColor=p=>p===null?'var(--txtm)':p>=70?'var(--ok)':p>=40?'#fbbf24':'var(--err)';

  // === Overview cards ===
  let html=`<div class="analytics-overview">`;
  html+=`<div class="analytics-ov-card glass"><div class="analytics-ov-num" style="color:${numColor(overall)}">${overall}</div><div class="analytics-ov-label">ציון כולל</div></div>`;
  groupData.forEach(g=>{
    html+=`<div class="analytics-ov-card glass"><div class="analytics-ov-num" style="color:${g.pct!==null?g.color:'var(--txtm)'}">${g.pct!==null?g.pct:'-'}</div><div class="analytics-ov-label">${g.icon} ${g.group}</div></div>`;
  });
  html+=`</div>`;

  // === Group cards ===
  groupData.forEach((g,gi)=>{
    const cls=gi===0?'grp-heb':'grp-dpr';
    html+=`<div class="analytics-group-card glass ${cls}">`;
    html+=`<div class="analytics-group-header"><div class="analytics-group-title"><span>${g.icon}</span><span>${g.group}</span></div>`;
    if(g.pct!==null){
      html+=`<div class="analytics-group-score" style="color:${g.color};background:${gi===0?'rgba(59,130,246,.1)':'rgba(45,212,191,.1)'}">${g.pct}</div>`;
    }else{
      html+=`<div class="analytics-group-score" style="color:var(--txtm);background:rgba(255,255,255,.04)">-</div>`;
    }
    html+=`</div>`;
    g.cats.forEach(cat=>{
      html+=`<div class="analytics-topic">`;
      html+=`<div class="analytics-topic-top"><span class="analytics-topic-name">${cat.name}</span>`;
      if(cat.pct!==null){
        html+=`<span class="analytics-topic-score" style="color:${numColor(cat.pct)}">${cat.pct}</span>`;
      }else{
        html+=`<span class="analytics-no-data">אין נתונים</span>`;
      }
      html+=`</div>`;
      if(cat.pct!==null){
        html+=`<div class="analytics-topic-bar"><div class="analytics-topic-fill ${colorFor(cat.pct)}" style="width:${cat.pct}%"></div></div>`;
      }else{
        html+=`<div class="analytics-topic-bar"><div class="analytics-topic-fill empty"></div></div>`;
      }
      html+=`</div>`;
    });
    html+=`</div>`;
  });

  // === Extra practice data ===
  const hasExtra=extraData.some(e=>e.pct!==null);
  if(hasExtra){
    html+=`<div class="analytics-extra-card glass"><div class="analytics-extra-title">📊 תרגול נוסף</div>`;
    extraData.forEach(e=>{
      if(e.pct===null)return;
      const isFC=e.name==='כרטיסיות לימוד';
      const detailTxt=isFC?`ידעתי ${e.correct} מתוך ${e.total}`:`${e.correct}/${e.total} תשובות נכונות`;
      html+=`<div class="analytics-topic"><div class="analytics-topic-top"><span class="analytics-topic-name">${e.name}</span><span class="analytics-topic-score" style="color:${numColor(e.pct)}">${e.pct}</span></div>`;
      html+=`<div style="font-size:.75rem;color:var(--txtm);margin:-2px 0 4px">${detailTxt}</div>`;
      html+=`<div class="analytics-topic-bar"><div class="analytics-topic-fill ${colorFor(e.pct)}" style="width:${e.pct}%"></div></div></div>`;
    });
    html+=`</div>`;
  }

  // === Level vs Final comparison ===
  const simPairs=[{cat:'hebrew',label:'עברית',color:'var(--p)'},{cat:'dpr',label:'דפ"ר',color:'#2dd4bf'}];
  const hasAnySim=simPairs.some(p=>qr['level_'+p.cat]||qr['final_'+p.cat]);
  if(hasAnySim){
    html+=`<div class="analytics-extra-card glass"><div class="analytics-extra-title">📊 השוואת מבחני רמה וסיום</div>`;
    simPairs.forEach(p=>{
      const lv=qr['level_'+p.cat],fn=qr['final_'+p.cat];
      if(!lv&&!fn)return;
      const lvPct=lv?Math.round(lv.correct/lv.total*100):null;
      const fnPct=fn?Math.round(fn.correct/fn.total*100):null;
      html+=`<div style="margin:10px 0;padding:10px;background:rgba(255,255,255,.03);border-radius:var(--r-md)">`;
      html+=`<div style="font-weight:700;margin-bottom:8px;color:${p.color}">${p.label}</div>`;
      html+=`<div style="display:flex;justify-content:space-around;text-align:center">`;
      html+=`<div><div style="font-size:11px;color:var(--txts)">מבחן רמה</div><div style="font-size:22px;font-weight:800">${lvPct!==null?lvPct+'%':'--'}</div></div>`;
      if(lvPct!==null&&fnPct!==null){
        const diff=fnPct-lvPct;const dc=diff>0?'var(--ok)':diff<0?'var(--err)':'var(--txts)';
        html+=`<div style="align-self:center;font-size:18px;font-weight:800;color:${dc}">${diff>0?'+':''}${diff}%</div>`;
      } else {
        html+=`<div style="align-self:center;font-size:14px;color:var(--txtm)">→</div>`;
      }
      html+=`<div><div style="font-size:11px;color:var(--txts)">מבחן סיום</div><div style="font-size:22px;font-weight:800;color:var(--pl)">${fnPct!==null?fnPct+'%':'--'}</div></div>`;
      html+=`</div>`;
      // Per-category comparison if both exist
      if(lv&&lv.catBreakdown&&fn&&fn.catBreakdown){
        html+=`<div style="margin-top:8px;font-size:12px">`;
        for(const[cn,fd] of Object.entries(fn.catBreakdown)){
          const fp=Math.round(fd.correct/fd.total*100);
          const ld=lv.catBreakdown[cn];
          const lp=ld?Math.round(ld.correct/ld.total*100):null;
          const cd=lp!==null?fp-lp:null;
          const cc=cd!==null?(cd>0?'var(--ok)':cd<0?'var(--err)':'var(--txts)'):'var(--txts)';
          html+=`<div class="sim-cat-row" style="padding:2px 0"><span style="color:var(--txts)">${cn}</span><span style="font-weight:600">${lp!==null?lp+'%':'--'} → <span style="color:${cc}">${fp}%</span></span></div>`;
        }
        html+=`</div>`;
      }
      html+=`</div>`;
    });
    html+=`</div>`;
  }

  // === Strengths & Weaknesses ===
  const allTopics=[...groupData.flatMap(g=>g.cats),...extraData].filter(c=>c.pct!==null).sort((a,b)=>b.pct-a.pct);
  if(allTopics.length>0){
    const strengths=allTopics.filter(c=>c.pct>=60);
    const weaknesses=allTopics.filter(c=>c.pct<60);
    if(strengths.length){
      html+=`<div class="insight-card glass"><h4 style="color:var(--ok)">💪 חוזקות</h4>`;
      strengths.slice(0,4).forEach(c=>{html+=`<div class="insight-item">✅ ${c.name} — ${c.pct}/100</div>`});
      html+=`</div>`;
    }
    if(weaknesses.length){
      html+=`<div class="insight-card glass"><h4 style="color:var(--err)">🎯 צריך לחזק</h4>`;
      weaknesses.forEach(c=>{html+=`<div class="insight-item">⚠️ ${c.name} — ${c.pct}/100</div>`});
      html+=`</div>`;
    }
  }

  if(totalT===0)html+=`<div class="glass" style="padding:24px;text-align:center;color:var(--txtm)"><div style="font-size:36px;margin-bottom:8px">📊</div>אין נתונים עדיין.<br>השלם תרגולים כדי לראות ניתוח ביצועים.</div>`;
  content.innerHTML=html;
  showScreen('analytics-screen');
}


// ===== FLASHCARDS =====
let fcCards=[],fcIdx=0,fcKnown=0,fcUnknown=0,fcCategory='all',fcSessionStart=0;

function getFcWords(){
  const ovr=getOverrides();
  return (HEBREW_DATA.vocabulary||[]).map((w,i)=>{
    const k='vocab:'+i,o=ovr[k];
    if(o&&o.deleted)return null;
    const c={word:w.word,meaning:w.meaning,_fcSrc:'vocab',_fcIdx:i};
    if(o){if(o.word)c.word=o.word;if(o.meaning)c.meaning=o.meaning}
    return c;
  }).filter(Boolean);
}
function getFcExpr(){
  const ovr=getOverrides();
  return (HEBREW_DATA.expressions||[]).map((e,i)=>{
    const k='expr:'+i,o=ovr[k];
    if(o&&o.deleted)return null;
    const c={word:e.expr,meaning:e.meaning,_fcSrc:'expr',_fcIdx:i};
    if(o){if(o.word)c.word=o.word;if(o.meaning)c.meaning=o.meaning}
    return c;
  }).filter(Boolean);
}

function startFlashcards(){
  if(typeof HEBREW_DATA==='undefined'){toast('אין נתונים');return}
  const words=getFcWords(),expr=getFcExpr();
  document.getElementById('fc-count-words').textContent=words.length;
  document.getElementById('fc-count-expr').textContent=expr.length;
  document.getElementById('fc-count-all').textContent=words.length+expr.length;
  document.getElementById('fc-category-picker').style.display='';
  document.getElementById('fc-session-area').style.display='none';
  showScreen('flashcard-screen');
}

function startFlashcardSession(cat){
  fcCategory=cat;
  let cards=[];
  if(cat==='words')cards=getFcWords();
  else if(cat==='expr')cards=getFcExpr();
  else cards=[...getFcWords(),...getFcExpr()];
  if(!cards.length){toast('אין כרטיסיות בקטגוריה זו');return}
  fcCards=shuffle(cards);
  fcIdx=0;fcKnown=0;fcUnknown=0;fcSessionStart=Date.now();
  document.getElementById('fc-category-picker').style.display='none';
  document.getElementById('fc-session-area').style.display='';
  renderFlashcard();
}

function renderFlashcard(){
  if(fcIdx>=fcCards.length){endFlashcardSession();return}
  const card=fcCards[fcIdx];
  document.getElementById('fc-word').textContent=card.word;
  document.getElementById('fc-meaning').textContent=card.meaning;
  document.getElementById('fc-back-label').textContent=card._fcSrc==='expr'?'פירוש:':'משמעות:';
  document.getElementById('fc-counter').textContent=`${fcIdx+1}/${fcCards.length}`;
  document.getElementById('fc-prog').style.width=(fcIdx/fcCards.length*100)+'%';
  document.getElementById('fc-wrapper').classList.remove('flipped');
}

function flipCard(){
  document.getElementById('fc-wrapper').classList.toggle('flipped');
}

function markFlashcard(known){
  if(known)fcKnown++;else fcUnknown++;
  fcIdx++;
  renderFlashcard();
}

function endFlashcardSession(){
  if(fcIdx>0 && user){
    if(!user.quizResults)user.quizResults={};
    user.quizResults['flashcards']={correct:fcKnown,total:fcKnown+fcUnknown,lastDate:Date.now()};
    // Time-weighted scoring: heavy time weight, low "knew" click weight
    const fcMins=Math.floor((Date.now()-fcSessionStart)/60000);
    const timePts=Math.min(fcMins*5,40); // 5 pts/min, max 40
    const knewPts=Math.min(Math.floor(fcKnown*0.5),10); // 0.5 pts per "knew", max 10
    const fcTotal=fcMins>=1?timePts+knewPts:0; // minimum 1 minute for any points
    if(fcTotal>0)user.points=(user.points||0)+fcTotal;
    saveUser(user);
    if(fcTotal>0){
      toast(`כרטיסיות: ${fcKnown}/${fcKnown+fcUnknown} ידעת | +${fcTotal} נקודות (${fcMins} דק')`);
    } else {
      toast(`כרטיסיות: ${fcKnown}/${fcKnown+fcUnknown} ידעת`);
    }
  }
  showScreen('boost-screen');
}

function endFlashcards(){
  if(fcIdx>0 && fcIdx<fcCards.length){
    if(confirm('לצאת? ההתקדמות תישמר.')){endFlashcardSession()}
  }else{endFlashcardSession()}
}


