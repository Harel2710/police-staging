// js/features.js - Leaderboard, classification, analytics, flashcards, medals
// Auto-extracted from index.html

// ===== TROPHY SCREEN (Medals + Leaderboard) =====

let _trophyView='medals'; // 'medals' or 'lb'

function showTrophyScreen(){
  if(!user)return;
  _trophyView='medals';
  showScreen('lb-screen');
  switchTrophyTab('medals');
}

function switchTrophyTab(view){
  _trophyView=view;
  document.getElementById('trophy-tab-medals').classList.toggle('active',view==='medals');
  document.getElementById('trophy-tab-lb').classList.toggle('active',view==='lb');
  document.getElementById('trophy-medals-view').style.display=view==='medals'?'':'none';
  document.getElementById('trophy-lb-view').style.display=view==='lb'?'':'none';
  if(view==='medals'){
    renderMedals();
  } else {
    // Lazy load leaderboard only when tab is opened
    if(!user.classification){showClassifyModal();return}
    if(_lbGroupCache){renderLBFromCache()}
    else{loadGroupLeaderboard()}
  }
}

// ===== MEDALS =====

function renderMedals(){
  const container=document.getElementById('medals-container');
  if(!user){container.innerHTML='';return}
  const medals=user.medals||{};
  const earned=Object.keys(medals).length;

  let html=`<div class="medal-counter">🏅 <span>${earned}</span> / ${MEDALS.length} הישגים</div>`;

  // Group medals by section
  const sections=[
    {title:'🎓 מבחן סיום — עברית',ids:['final_heb_bronze','final_heb_silver','final_heb_gold','final_heb_platinum','speed_heb']},
    {title:'📐 מבחן סיום — דפ"ר',ids:['final_dpr_bronze','final_dpr_silver','final_dpr_gold','final_dpr_platinum','speed_dpr']},
    {title:'⚡ מצוינות בתרגול',ids:['boost_perfect','boost_perfect_x5','boost_both','boost_speed']}
  ];

  sections.forEach(sec=>{
    html+=`<div class="medal-section-title">${sec.title}</div>`;
    html+=`<div class="medals-grid">`;
    sec.ids.forEach(id=>{
      const m=MEDALS.find(x=>x.id===id);
      if(!m)return;
      const unlocked=!!medals[id];
      const dateStr=unlocked?new Date(medals[id]).toLocaleDateString('he-IL'):'';
      html+=`<div class="medal-card glass ${unlocked?'unlocked':'locked'}">`;
      html+=`<span class="medal-icon">${m.icon}</span>`;
      html+=`<div class="medal-title">${m.title}</div>`;
      html+=`<div class="medal-desc">${m.desc}</div>`;
      if(unlocked){
        html+=`<div class="medal-date">הושג ${dateStr}</div>`;
      } else if(m.launch){
        html+=`<div class="medal-launch" onclick="launchMedalTarget('${m.launch}')">לנסות עכשיו →</div>`;
      } else {
        html+=`<div class="medal-launch" onclick="launchMedalTarget('final_${m.cat}')">לנסות עכשיו →</div>`;
      }
      html+=`</div>`;
    });
    html+=`</div>`;
  });

  container.innerHTML=html;
}

let _launchedFromMedals=false;

function launchMedalTarget(target){
  _launchedFromMedals=true;
  if(target==='boost'){
    showScreen('boost-screen');
  } else if(target==='final_hebrew'){
    const idx=PATH.findIndex(s=>s.id==='final_sim_heb');
    if(idx>=0)openStep(idx);
  } else if(target==='final_dpr'){
    const idx=PATH.findIndex(s=>s.id==='final_sim_dpr');
    if(idx>=0)openStep(idx);
  }
}

function returnFromMedalLaunch(){
  if(_launchedFromMedals){_launchedFromMedals=false;showTrophyScreen();return true}
  return false;
}

function checkMedals(ctx){
  if(!user)return;
  if(!user.medals)user.medals={};
  let newMedals=[];

  if(ctx.type==='final'){
    // Final exam accuracy medals
    MEDALS.filter(m=>m.type==='final_acc'&&m.cat===ctx.cat).forEach(m=>{
      if(!user.medals[m.id]&&ctx.pct>=m.minPct){
        user.medals[m.id]=Date.now();
        newMedals.push(m);
      }
    });
    // Speed medals
    MEDALS.filter(m=>m.type==='final_speed'&&m.cat===ctx.cat).forEach(m=>{
      if(!user.medals[m.id]&&ctx.pct>=m.minPct&&ctx.mins<m.maxMin){
        user.medals[m.id]=Date.now();
        newMedals.push(m);
      }
    });
  }

  if(ctx.type==='boost'&&ctx.pct===100){
    // Perfect boost
    if(!user.perfectBoosts)user.perfectBoosts=0;
    user.perfectBoosts++;
    // Track per-cat perfect boosts
    if(!user.perfectBoostCats)user.perfectBoostCats={};
    user.perfectBoostCats[ctx.cat]=true;

    // Single perfect boost medal
    if(!user.medals['boost_perfect']){
      user.medals['boost_perfect']=Date.now();
      newMedals.push(MEDALS.find(m=>m.id==='boost_perfect'));
    }
    // x5 medal
    if(!user.medals['boost_perfect_x5']&&user.perfectBoosts>=5){
      user.medals['boost_perfect_x5']=Date.now();
      newMedals.push(MEDALS.find(m=>m.id==='boost_perfect_x5'));
    }
    // Both cats medal
    if(!user.medals['boost_both']&&user.perfectBoostCats['hebrew']&&user.perfectBoostCats['dpr']){
      user.medals['boost_both']=Date.now();
      newMedals.push(MEDALS.find(m=>m.id==='boost_both'));
    }
    // Speed boost medal (10/10 under 2 min)
    if(!user.medals['boost_speed']&&ctx.elapsed<120){
      user.medals['boost_speed']=Date.now();
      newMedals.push(MEDALS.find(m=>m.id==='boost_speed'));
    }
  }

  if(newMedals.length){
    saveUser(user);
    newMedals.forEach(m=>{
      toast(`🏅 מדליה חדשה: ${m.icon} ${m.title}`,'ach');
    });
  }
}

// ===== LEADERBOARD (Lazy Load + Local Group) =====

function getUserGroup(u){
  // Returns a Firestore-queryable group key for a user's classification
  const cls=u.classification;
  if(!cls)return null;
  if(cls.type==='trainee')return{type:'trainee',company:cls.company||'',department:cls.department||0};
  if(cls.type==='officer')return{type:'officer',district:cls.district||''};
  if(cls.type==='citizen')return{type:'citizen'};
  return null;
}

function getGroupLabel(cls){
  if(!cls)return '';
  if(cls.type==='trainee')return[cls.company,cls.department?'מחלקה '+cls.department:''].filter(Boolean).join(' | ');
  if(cls.type==='officer')return cls.district||'';
  return 'אזרחים';
}

function showLB(){
  if(!user)return;
  if(!user.classification){
    showClassifyModal();
    return;
  }
  showScreen('lb-screen');
  switchTrophyTab('lb');
}

function loadGroupLeaderboard(){
  const list=document.getElementById('lb-list');
  const filters=document.getElementById('lb-filters');
  const subFilters=document.getElementById('lb-sub-filters');
  filters.innerHTML='';subFilters.innerHTML='';
  list.innerHTML='<div class="no-data-msg" style="opacity:.6">טוען טבלת דירוג...</div>';

  const group=getUserGroup(user);
  if(!group||!db){
    list.innerHTML='<div class="no-data-msg">לא ניתן לטעון דירוג</div>';
    return;
  }

  // Build Firestore query based on group type
  let query=db.collection('users');
  if(group.type==='trainee'){
    query=query.where('classification.type','==','trainee')
               .where('classification.company','==',group.company)
               .where('classification.department','==',group.department);
  } else if(group.type==='officer'){
    query=query.where('classification.type','==','officer')
               .where('classification.district','==',group.district);
  } else {
    // citizen: all citizens
    query=query.where('classification.type','==','citizen');
  }

  query.orderBy('points','desc').limit(30).get().then(snap=>{
    const users=[];
    snap.forEach(doc=>{const d=doc.data();d._docId=doc.id;users.push(d)});
    _lbGroupCache=users;
    renderLBFromCache();
  }).catch(e=>{
    console.warn('Leaderboard query error:',e);
    // If composite index missing, Firestore error contains creation URL - log it
    if(e.message&&e.message.includes('index')){
      console.error('MISSING INDEX — create it here:',e.message);
    }
    // Fallback: fetch all users, filter client-side (works without composite index)
    db.collection('users').orderBy('points','desc').limit(50).get().then(snap=>{
      const all=[];
      snap.forEach(doc=>{const d=doc.data();d._docId=doc.id;all.push(d)});
      // Filter to user's group client-side
      const filtered=all.filter(u=>{
        if(!u.classification)return false;
        if(group.type==='trainee')return u.classification.type==='trainee'&&u.classification.company===group.company&&u.classification.department===group.department;
        if(group.type==='officer')return u.classification.type==='officer'&&u.classification.district===group.district;
        return u.classification.type==='citizen';
      });
      _lbGroupCache=filtered.slice(0,30);
      renderLBFromCache();
    }).catch(e2=>{
      console.warn('Leaderboard fallback error:',e2);
      list.innerHTML='<div class="no-data-msg">שגיאה בטעינת דירוג. ודא שיש חיבור לאינטרנט.</div>';
    });
  });
}

function renderLBFromCache(){
  const list=document.getElementById('lb-list');
  const filters=document.getElementById('lb-filters');
  const subFilters=document.getElementById('lb-sub-filters');

  // Show group label as header
  const group=getUserGroup(user);
  const groupLabel=getGroupLabel(user.classification);
  const typeIcon=user.classification.type==='trainee'?'🎓':user.classification.type==='officer'?'👮':'👤';
  filters.innerHTML=`<div style="text-align:center;padding:8px 12px;font-size:14px;font-weight:600;color:var(--txt)">${typeIcon} ${groupLabel}</div>`;
  subFilters.innerHTML=`<div style="text-align:center;font-size:12px;color:var(--txtm);margin-bottom:8px">טופ 30 בקבוצה שלך</div>`;

  // Merge current user's live data into cached list
  let entries=[...(_lbGroupCache||[])];
  // Update or insert current user with live points
  let foundSelf=false;
  entries=entries.map(u=>{
    if(u.uid===user.uid||u.name===user.name){
      foundSelf=true;
      return{...u,points:user.points||0,name:user.name,completed:user.completed||[]};
    }
    return u;
  });
  if(!foundSelf&&user.classification){
    // User not in top 30 yet, add them
    entries.push({name:user.name,uid:user.uid,points:user.points||0,completed:user.completed||[],classification:user.classification});
  }

  // Sort by points
  entries.sort((a,b)=>(b.points||0)-(a.points||0));

  list.innerHTML='';
  if(!entries.length){list.innerHTML='<div class="no-data-msg">אין משתמשים בקבוצה זו</div>';return}

  const medals=['🥇','🥈','🥉'],rc=['gold','silver','bronze'];
  entries.forEach((u,i)=>{
    const me=user&&(u.uid===user.uid||u.name===user.name);
    const ulv=getUserLevel(u.points||0);
    const row=document.createElement('div');row.className='lb-row glass'+(me?' me':'')+(i<3?' top3':'');
    row.innerHTML=`<div class="lb-rank ${i<3?rc[i]:''}">${i<3?medals[i]:i+1}</div>
      <div class="lb-avatar">${(u.name||'?')[0]}</div>
      <div class="lb-info"><div class="lb-name">${u.name||'?'}${me?' ★':''}</div><div class="lb-level"><span class="lb-level-icon">${ulv.i}</span>${ulv.n}</div></div>
      <div class="lb-pts">${u.points||0}</div>`;
    list.appendChild(row);
  });

  // If user is beyond position 30, show separator and their position
  const myIdx=entries.findIndex(u=>u.uid===user.uid||u.name===user.name);
  if(myIdx>=30){
    const sep=document.createElement('div');
    sep.style.cssText='text-align:center;padding:8px;color:var(--txtm);font-size:12px';
    sep.textContent='···';
    list.appendChild(sep);
    // Re-render user's row at bottom with actual rank
    const ulv=getUserLevel(user.points||0);
    const row=document.createElement('div');row.className='lb-row glass me';
    row.innerHTML=`<div class="lb-rank">${myIdx+1}</div>
      <div class="lb-avatar">${user.name[0]}</div>
      <div class="lb-info"><div class="lb-name">${user.name} ★</div><div class="lb-level"><span class="lb-level-icon">${ulv.i}</span>${ulv.n}</div></div>
      <div class="lb-pts">${user.points||0}</div>`;
    list.appendChild(row);
  }
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
  document.getElementById('classify-save-btn').onclick=saveClassification;
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
      <div class="classify-field"><label>מחלקה</label>
      <select id="cls-department"><option value="">בחר...</option>${cfg.traineeDepartments.map(d=>`<option value="${d}">מחלקה ${d}</option>`).join('')}</select></div>`;
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
    const department=document.getElementById('cls-department')?.value;
    if(!company){toast('בחר פלוגה');return}
    if(!department){toast('בחר מחלקה');return}
    cls.company=company;
    cls.department=parseInt(department);
  }
  user.classification=cls;
  saveUser(user);
  _lbGroupCache=null;
  closeClassify();
  toast('סיווג נשמר! ✓');
  loadGroupLeaderboard();
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
    <textarea id="cfg-companies" rows="4" style="font-size:12px">${cfg.traineeCompanies.join('\n')}</textarea></div>`;
  saveBtn.style.display='';
  saveBtn.onclick=()=>{
    const d=document.getElementById('cfg-districts').value.split('\n').map(s=>s.trim()).filter(Boolean);
    const c=document.getElementById('cfg-companies').value.split('\n').map(s=>s.trim()).filter(Boolean);
    saveLBConfig({districts:d,traineeCompanies:c});
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
    if(fcTotal>0){user.points=(user.points||0)+fcTotal;user.lastPointsDate=Date.now()}
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


