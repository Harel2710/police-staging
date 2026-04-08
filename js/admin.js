// js/admin.js - Admin edit system, question bank, reports
// Auto-extracted from index.html

// ===== ADMIN EDIT SYSTEM =====

function toggleAdminFab(){
  const fab=document.getElementById('admin-edit-fab');
  if(!fab)return;
  fab.style.display=(user&&user.isAdmin)?'flex':'none';
}


function openAdminEdit(){
  if(!user||!user.isAdmin)return;
  const active=document.querySelector('.screen.active');
  if(!active)return;
  const sid=active.id;
  const body=document.getElementById('admin-edit-body');
  const saveBtn=document.getElementById('admin-edit-save-btn');
  adminEditMode=null;

  if(sid==='dash-screen'){
    // Edit path step titles
    adminEditMode='path_titles';
    const ovr=getOverrides();
    let html='<div class="edit-section-title">עריכת שמות שלבים במסלול</div>';
    PATH.forEach((step,i)=>{
      const saved=ovr['path_title:'+step.id]||'';
      html+=`<div class="edit-field" style="margin-bottom:8px"><label style="font-size:11px;color:var(--txts)">${step.icon} ${step.id}</label><input type="text" id="edit-path-${i}" value="${escHtml(saved||step.title)}" style="font-size:13px;padding:8px 10px"></div>`;
    });
    body.innerHTML=html;
    saveBtn.style.display='';

  } else if(sid==='lesson-screen'&&PATH[curStep]&&PATH[curStep].id==='intro'){
    // Edit intro lesson content (score table)
    adminEditMode='intro_content';
    const ovr=getOverrides();
    const introOvr=ovr['lesson:intro']||{};
    const rows=introOvr.scoreTable||[
      {role:'שוטרים/סמלים',heb:'7',dpr:'4'},
      {role:'קבע',heb:'7',dpr:'5'},
      {role:'חובשים',heb:'1',dpr:'6'},
      {role:'קצינים',heb:'1',dpr:'6'}
    ];
    let html='<div class="edit-section-title">טבלת ציונים נדרשים לפי תפקיד</div>';
    html+='<div style="display:grid;grid-template-columns:1fr 50px 50px;gap:6px;margin-bottom:12px;font-size:12px;font-weight:600;color:var(--txts)"><span>תפקיד</span><span>עברית</span><span>דפ"ר</span></div>';
    rows.forEach((r,i)=>{
      html+=`<div style="display:grid;grid-template-columns:1fr 50px 50px;gap:6px;margin-bottom:6px">
        <input type="text" id="edit-intro-role-${i}" value="${escHtml(r.role)}" style="font-size:13px;padding:6px 8px">
        <input type="text" id="edit-intro-heb-${i}" value="${escHtml(r.heb)}" style="font-size:13px;padding:6px 8px;text-align:center">
        <input type="text" id="edit-intro-dpr-${i}" value="${escHtml(r.dpr)}" style="font-size:13px;padding:6px 8px;text-align:center">
      </div>`;
    });
    html+=`<button class="btn btn-secondary" style="font-size:12px;padding:6px 12px;margin-top:4px" onclick="addIntroRow()">+ הוסף שורה</button>`;
    // Also allow editing the tips section
    const tips=introOvr.tips||'המבחן ממוחשב. לפני כל חלק יש הסבר ודוגמאות (לא מוגבלים בזמן) - קרא בעיון!\nשים לב לניסוח השאלה - לפעמים הוא מבלבל בכוונה\nאל תתעכב על שאלה - דלג והמשך\nהשאלות מסודרות מקל לקשה\nהמבחן מוגבל בזמן - סביר שלא תספיק הכל, אל תילחץ';
    html+=`<div class="edit-field" style="margin-top:12px"><label>טיפים חשובים</label><textarea id="edit-intro-tips" rows="5" style="font-size:13px">${escHtml(tips)}</textarea></div>`;
    body.innerHTML=html;
    saveBtn.style.display='';

  } else if((sid==='quiz-screen'||sid==='sim-screen')&&qList&&qList.length>0&&qIdx<qList.length){
    adminEditMode='question';
    const q=qList[qIdx];
    editingQuestion={srcKey:q._srcKey,srcIdx:q._srcIdx,qRef:q};
    let html=`<div class="edit-field"><label>טקסט השאלה</label><textarea id="edit-q-text" rows="3">${escHtml(q.q)}</textarea></div>`;
    html+=`<div class="edit-section-title">תשובות (סמן את הנכונה)</div>`;
    q.o.forEach((opt,i)=>{
      const checked=i===q.a?'checked':'';
      const isVis=q.visualOpts;
      html+=`<div class="edit-opt-row"><input type="radio" name="edit-correct" value="${i}" ${checked}><span class="opt-label">${LETTERS[i]||i+1}</span><input type="text" id="edit-opt-${i}" value="${isVis?'[SVG ויזואלי]':escHtml(opt)}" ${isVis?'disabled':''}></div>`;
    });
    html+=`<div class="edit-field" style="margin-top:12px"><label>הסבר (מוצג אחרי תשובה)</label><textarea id="edit-q-expl" rows="2">${escHtml(q.e||'')}</textarea></div>`;
    html+=`<button class="edit-delete-btn" onclick="deleteAdminQuestion()">🗑️ מחק שאלה זו לצמיתות</button>`;
    body.innerHTML=html;
    saveBtn.style.display='';
  } else if(sid==='flashcard-screen'&&fcCards.length>0&&fcIdx<fcCards.length){
    adminEditMode='flashcard';
    const card=fcCards[fcIdx];
    const srcLabel=card._fcSrc==='expr'?'ביטוי':'מילה';
    let html=`<div class="edit-section-title">עריכת כרטיסיית ${srcLabel}</div>`;
    html+=`<div class="edit-field"><label>${srcLabel}</label><input type="text" id="edit-fc-word" value="${escHtml(card.word)}"></div>`;
    html+=`<div class="edit-field"><label>משמעות / פירוש</label><input type="text" id="edit-fc-meaning" value="${escHtml(card.meaning)}"></div>`;
    html+=`<button class="edit-delete-btn" onclick="deleteFlashcard()">🗑️ מחק כרטיסייה זו</button>`;
    body.innerHTML=html;
    saveBtn.style.display='';
  } else {
    body.innerHTML=`<div class="edit-no-context">אין תוכן לעריכה במסך הזה.<br><br>💡 היכנס לתרגול או סימולציה<br>ולחץ ✏️ כדי לערוך את השאלה הנוכחית.</div>`;
    saveBtn.style.display='none';
    editingQuestion=null;
  }
  document.getElementById('admin-edit-modal').classList.remove('hidden');
}

function addIntroRow(){
  const body=document.getElementById('admin-edit-body');
  const btn=body.querySelector('.btn-secondary');
  const count=body.querySelectorAll('[id^="edit-intro-role-"]').length;
  const row=document.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:1fr 50px 50px;gap:6px;margin-bottom:6px';
  row.innerHTML=`<input type="text" id="edit-intro-role-${count}" value="" style="font-size:13px;padding:6px 8px" placeholder="תפקיד">
    <input type="text" id="edit-intro-heb-${count}" value="" style="font-size:13px;padding:6px 8px;text-align:center" placeholder="0">
    <input type="text" id="edit-intro-dpr-${count}" value="" style="font-size:13px;padding:6px 8px;text-align:center" placeholder="0">`;
  btn.parentElement.insertBefore(row,btn);
}

function closeAdminEdit(){
  document.getElementById('admin-edit-modal').classList.add('hidden');
  editingQuestion=null;
}

function saveAdminEdit(){
  const ovr=getOverrides();

  if(adminEditMode==='path_titles'){
    PATH.forEach((step,i)=>{
      const inp=document.getElementById('edit-path-'+i);
      if(!inp)return;
      const val=inp.value.trim();
      if(val&&val!==step.title){
        ovr['path_title:'+step.id]=val;
      } else {
        delete ovr['path_title:'+step.id];
      }
    });
    saveOverrides(ovr);
    // Apply in-memory
    PATH.forEach(step=>{
      const saved=ovr['path_title:'+step.id];
      if(saved)step.title=saved;
    });
    renderPath();
    closeAdminEdit();
    toast('✓ שמות השלבים עודכנו');
    return;
  }

  if(adminEditMode==='intro_content'){
    const rows=[];
    let i=0;
    while(document.getElementById('edit-intro-role-'+i)){
      const role=document.getElementById('edit-intro-role-'+i).value.trim();
      const heb=document.getElementById('edit-intro-heb-'+i).value.trim();
      const dpr=document.getElementById('edit-intro-dpr-'+i).value.trim();
      if(role)rows.push({role,heb,dpr});
      i++;
    }
    const tips=document.getElementById('edit-intro-tips').value.trim();
    ovr['lesson:intro']={scoreTable:rows,tips:tips};
    saveOverrides(ovr);
    // Refresh lesson if currently viewing intro
    if(PATH[curStep]&&PATH[curStep].id==='intro'){
      document.getElementById('lesson-content').innerHTML=getLessonHTML('intro');
    }
    closeAdminEdit();
    toast('✓ תוכן המבוא עודכן');
    return;
  }

  if(adminEditMode==='flashcard'){
    const card=fcCards[fcIdx];
    if(!card)return;
    const oKey=card._fcSrc+':'+card._fcIdx;
    const w=document.getElementById('edit-fc-word').value.trim();
    const m=document.getElementById('edit-fc-meaning').value.trim();
    if(w&&m){
      if(!ovr[oKey])ovr[oKey]={};
      ovr[oKey].word=w;ovr[oKey].meaning=m;
      saveOverrides(ovr);
      card.word=w;card.meaning=m;
      renderFlashcard();
    }
    closeAdminEdit();
    toast('✓ הכרטיסייה עודכנה');
    return;
  }

  // Original question editing logic
  if(!editingQuestion||editingQuestion.srcKey===undefined||editingQuestion.srcIdx===undefined){toast('אין שאלה לשמירה');return}
  const oKey=editingQuestion.srcKey+':'+editingQuestion.srcIdx;
  if(!ovr[oKey])ovr[oKey]={};

  const qText=document.getElementById('edit-q-text').value.trim();
  if(qText)ovr[oKey].q=qText;

  const correctRadio=document.querySelector('input[name="edit-correct"]:checked');
  if(correctRadio)ovr[oKey].a=parseInt(correctRadio.value);

  const q=editingQuestion.qRef;
  if(!q.visualOpts){
    const opts=[];
    q.o.forEach((_,i)=>{const inp=document.getElementById('edit-opt-'+i);if(inp)opts.push(inp.value.trim())});
    if(opts.length&&opts.some(o=>o))ovr[oKey].o=opts;
  }

  const expl=document.getElementById('edit-q-expl').value.trim();
  ovr[oKey].e=expl;

  saveOverrides(ovr);

  if(qText)q.q=qText;
  if(correctRadio)q.a=parseInt(correctRadio.value);
  if(!q.visualOpts&&ovr[oKey].o)q.o=ovr[oKey].o;
  q.e=expl;

  const active=document.querySelector('.screen.active');
  if(active&&active.id==='quiz-screen')renderQ();
  if(active&&active.id==='sim-screen')renderSimQ();

  closeAdminEdit();
  toast('✓ השינויים נשמרו');
}

function deleteAdminQuestion(){
  if(!editingQuestion||editingQuestion.srcKey===undefined)return;
  if(!confirm('למחוק שאלה זו? לא תופיע יותר בתרגולים.'))return;

  const ovr=getOverrides();
  const oKey=editingQuestion.srcKey+':'+editingQuestion.srcIdx;
  ovr[oKey]={deleted:true};
  saveOverrides(ovr);

  qList.splice(qIdx,1);
  if(qIdx>=qList.length)qIdx=Math.max(0,qList.length-1);

  closeAdminEdit();

  if(qList.length===0){toast('כל השאלות נמחקו');showDash();return}

  const active=document.querySelector('.screen.active');
  if(active&&active.id==='quiz-screen')renderQ();
  if(active&&active.id==='sim-screen')renderSimQ();
  toast('✓ השאלה נמחקה');
}

function deleteFlashcard(){
  if(!fcCards[fcIdx])return;
  if(!confirm('למחוק כרטיסייה זו? לא תופיע יותר.'))return;
  const card=fcCards[fcIdx];
  const ovr=getOverrides();
  ovr[card._fcSrc+':'+card._fcIdx]={deleted:true};
  saveOverrides(ovr);
  fcCards.splice(fcIdx,1);
  if(fcIdx>=fcCards.length)fcIdx=Math.max(0,fcCards.length-1);
  closeAdminEdit();
  if(fcCards.length===0){toast('כל הכרטיסיות נמחקו');showDash();return}
  renderFlashcard();
  toast('✓ הכרטיסייה נמחקה');
}


// ===== QUESTION BANK =====
const QBANK_CATEGORIES=[
  {label:'עברית - תרגולים',keys:['ex1','ex2','ex3','ex4','ex5','ex6']},
  {label:'עברית - ביטויים',keys:['expr1','expr2']},
  {label:'עברית - אוצר מילים',keys:['wordMatch','opposites']},
  {label:'עברית - הבנת הנקרא',keys:['comprehension','comprehension2']},
  {label:'עברית - כתיב',keys:['spelling','spelling2']},
  {label:'דפ"ר - מילוי הוראות',keys:['instr1','dictEx','dictPractice','compass','instrTest']},
  {label:'דפ"ר - סדרות',keys:['seq3','seq4','seq5','seq6','seq7','seq8']},
  {label:'דפ"ר - צורות',keys:['shapes','shapes2','shapes3','shapes4']}
];

let _qbankCurrentKey=null;

function showQBank(){
  if(!user||!user.isAdmin)return;
  _qbankCurrentKey=null;
  document.getElementById('qbank-search').value='';
  renderQBankCategories();
  showScreen('qbank-screen');
  // Defensive: force hide tab bar and FABs (in case cached utils.js misses qbank-screen)
  const tb=document.getElementById('tab-bar');if(tb)tb.style.display='none';
  const rf=document.getElementById('report-fab');if(rf)rf.style.display='none';
  const af=document.getElementById('admin-edit-fab');if(af)af.style.display='none';
}

function renderQBankCategories(){
  _qbankCurrentKey=null;
  document.getElementById('qbank-back-btn').onclick=()=>showDash();
  const body=document.getElementById('qbank-body');
  const ovr=getOverrides();
  let html='';
  QBANK_CATEGORIES.forEach(cat=>{
    let total=0,edited=0,deleted=0;
    cat.keys.forEach(k=>{
      const d=getQuizData(k);
      if(d)total+=d.length;
      // Count overrides for this key
      Object.keys(ovr).forEach(ok=>{
        if(ok.startsWith(k+':')){
          if(ovr[ok].deleted)deleted++;else edited++;
        }
      });
    });
    html+=`<div class="glass qbank-row" onclick="showQBankCategory('${cat.keys.join(',')}','${cat.label}')">
      <span style="color:var(--txtm);font-size:18px">←</span>
      <div style="flex:1;text-align:right"><div style="font-weight:700;font-size:14px">${cat.label}</div>
      <div style="font-size:11px;color:var(--txtm);margin-top:2px">${total} שאלות${edited?' | '+edited+' נערכו':''}${deleted?' | '+deleted+' נמחקו':''}</div></div></div>`;
  });
  body.innerHTML=html;
}

function showQBankCategory(keysStr,label){
  const keys=keysStr.split(',');
  _qbankCurrentKey=keysStr;
  document.getElementById('qbank-back-btn').onclick=()=>{renderQBankCategories();document.getElementById('qbank-search').value=''};
  renderQBankQuestions(keys,label);
}

function renderQBankQuestions(keys,label){
  const body=document.getElementById('qbank-body');
  const ovr=getOverrides();
  const search=(document.getElementById('qbank-search').value||'').trim().toLowerCase();
  let html=`<div style="font-weight:700;font-size:15px;margin-bottom:12px">${label}</div>`;
  let count=0;
  keys.forEach(key=>{
    const data=getQuizData(key);
    if(!data)return;
    data.forEach((q,i)=>{
      const srcKey=q._srcKey||key;
      const srcIdx=q._srcIdx!==undefined?q._srcIdx:i;
      const oKey=srcKey+':'+srcIdx;
      const isEdited=ovr[oKey]&&!ovr[oKey].deleted;
      const qText=(q.q||'').replace(/\n/g,' ');
      if(search&&!qText.toLowerCase().includes(search))return;
      count++;
      html+=`<div class="glass qbank-item${isEdited?' edited':''}" style="${isEdited?'border-right:3px solid var(--p)':''}" onclick="openQuestionEditor('${srcKey}',${srcIdx})">
        <div style="display:flex;gap:6px;align-items:flex-start">
          <span style="font-size:11px;color:var(--txtm);white-space:nowrap;min-width:42px">${srcKey}:${srcIdx}</span>
          <span style="flex:1">${escHtml(qText.slice(0,100))}${qText.length>100?'...':''}</span>
        </div>
        ${isEdited?'<span style="position:absolute;left:8px;top:8px;font-size:10px;color:var(--pl)">נערך</span>':''}
      </div>`;
    });
  });
  if(!count)html+='<div class="no-data-msg">לא נמצאו שאלות</div>';
  body.innerHTML=html;
}

function filterQBank(){
  if(!_qbankCurrentKey)return;
  const keys=_qbankCurrentKey.split(',');
  const cat=QBANK_CATEGORIES.find(c=>c.keys.join(',')===_qbankCurrentKey);
  renderQBankQuestions(keys,cat?cat.label:'');
}

function openQuestionEditor(srcKey,srcIdx){
  if(!user||!user.isAdmin)return;
  // Load the raw question from data
  const data=getQuizData(srcKey);
  if(!data){toast('לא נמצא מאגר: '+srcKey);return}
  const q=data.find(d=>d._srcKey===srcKey&&d._srcIdx===srcIdx);
  if(!q){toast('שאלה לא נמצאה: '+srcKey+':'+srcIdx);return}

  adminEditMode='question';
  editingQuestion={srcKey:srcKey,srcIdx:srcIdx,qRef:q};

  const body=document.getElementById('admin-edit-body');
  let html=`<div style="font-size:11px;color:var(--txtm);margin-bottom:8px;font-weight:600">מפתח: <code>${srcKey}:${srcIdx}</code></div>`;
  html+=`<div class="edit-field"><label>טקסט השאלה</label><textarea id="edit-q-text" rows="3">${escHtml(q.q)}</textarea></div>`;
  html+=`<div class="edit-section-title">תשובות (סמן את הנכונה)</div>`;
  q.o.forEach((opt,i)=>{
    const checked=i===q.a?'checked':'';
    const isVis=q.visualOpts;
    html+=`<div class="edit-opt-row"><input type="radio" name="edit-correct" value="${i}" ${checked}><span class="opt-label">${LETTERS[i]||i+1}</span><input type="text" id="edit-opt-${i}" value="${isVis?'[SVG ויזואלי]':escHtml(opt)}" ${isVis?'disabled':''}></div>`;
  });
  html+=`<div class="edit-field" style="margin-top:12px"><label>הסבר (מוצג אחרי תשובה)</label><textarea id="edit-q-expl" rows="2">${escHtml(q.e||'')}</textarea></div>`;
  html+=`<button class="edit-delete-btn" onclick="deleteQBankQuestion('${srcKey}',${srcIdx})">🗑️ מחק שאלה זו לצמיתות</button>`;
  body.innerHTML=html;

  document.getElementById('admin-edit-save-btn').style.display='';
  document.getElementById('admin-edit-modal').classList.remove('hidden');
}

function deleteQBankQuestion(srcKey,srcIdx){
  if(!confirm('למחוק שאלה זו? לא תופיע יותר בתרגולים.'))return;
  const ovr=getOverrides();
  ovr[srcKey+':'+srcIdx]={deleted:true};
  saveOverrides(ovr);
  closeAdminEdit();
  toast('✓ השאלה נמחקה');
  // Refresh bank view if open
  if(_qbankCurrentKey){
    const keys=_qbankCurrentKey.split(',');
    const cat=QBANK_CATEGORIES.find(c=>c.keys.join(',')===_qbankCurrentKey);
    renderQBankQuestions(keys,cat?cat.label:'');
  }
}

// ===== ADMIN & REPORTS =====

function openReport(){
  const activeScreen=[...document.querySelectorAll('.screen.active')].map(s=>s.id).join(',');
  let context='מסך: '+activeScreen;
  let ref=null; // structured reference for admin
  const qText=document.getElementById('q-text');
  const simQText=document.getElementById('sim-q-text');

  if(activeScreen.includes('quiz')&&qText&&qText.textContent){
    context+='\nשאלה: '+qText.textContent;
    const step=PATH[curStep];
    const curQ=qList&&qList[qIdx];
    if(step&&step.dataKey){
      ref={type:'quiz',dataKey:step.dataKey,qIdx:qIdx,stepId:step.id,stepTitle:step.title};
      if(curQ&&curQ._srcKey!==undefined){ref.srcKey=curQ._srcKey;ref.srcIdx=curQ._srcIdx}
      context+=`\n[מפתח: ${curQ?curQ._srcKey+':'+curQ._srcIdx:step.dataKey+':'+qIdx}]`;
    }
  } else if(activeScreen.includes('sim-screen')&&simQText&&simQText.textContent){
    context+='\nשאלה: '+simQText.textContent;
    const curQ=qList&&qList[qIdx];
    ref={type:'sim',simCat:simCat,qIdx:qIdx,simKey:window._pathSimKey||'sim_'+simCat};
    if(curQ&&curQ._srcKey!==undefined){ref.srcKey=curQ._srcKey;ref.srcIdx=curQ._srcIdx}
    context+=`\n[מפתח: ${curQ?curQ._srcKey+':'+curQ._srcIdx:'sim_'+simCat+':'+qIdx}]`;
  } else if(activeScreen.includes('flashcard')&&fcCards.length>0&&fcIdx<fcCards.length){
    const card=fcCards[fcIdx];
    context+=`\nכרטיסיה: ${card.word} = ${card.meaning}`;
    ref={type:'flashcard',fcSrc:card._fcSrc,fcIdx:card._fcIdx,word:card.word};
    context+=`\n[מפתח: ${card._fcSrc}:${card._fcIdx}]`;
  }

  window._reportRef=ref;
  document.getElementById('report-info').textContent=context;
  document.getElementById('report-text').value='';
  document.getElementById('report-modal').classList.remove('hidden');
}

function closeReport(){document.getElementById('report-modal').classList.add('hidden')}

function submitReport(){
  const text=document.getElementById('report-text').value.trim();
  if(!text){toast('כתוב תיאור של הבעיה');return}
  const entry={
    user:user?user.name:'אנונימי',
    text:text,
    context:document.getElementById('report-info').textContent,
    timestamp:Date.now(),
    handled:false
  };
  if(window._reportRef)entry.ref=window._reportRef;
  // Save to localStorage as fallback
  const reports=getReports();
  reports.push(entry);
  saveReports(reports);
  // Sync to Firestore for admin visibility
  if(db){
    const docId='r_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    db.collection('reports').doc(docId).set(entry).catch(e=>console.warn('Report sync failed:',e));
  }
  window._reportRef=null;
  closeReport();
  toast('הדיווח נשלח! תודה 🙏');
}

function showAdminReports(){
  const list=document.getElementById('admin-reports-list');
  list.innerHTML='<div class="no-data-msg" style="opacity:.6">טוען דיווחים...</div>';
  showScreen('admin-reports-screen');

  // Fetch from Firestore if available, fallback to localStorage
  const getReportQKey=(r)=>{
    if(!r.ref)return null;
    if(r.ref.type==='quiz'){
      const sk=r.ref.srcKey||r.ref.dataKey;
      const si=r.ref.srcIdx!==undefined?r.ref.srcIdx:r.ref.qIdx;
      return sk?(sk+':'+si):null;
    }
    if(r.ref.type==='sim'){
      const sk=r.ref.srcKey||r.ref.simKey;
      const si=r.ref.srcIdx!==undefined?r.ref.srcIdx:r.ref.qIdx;
      return sk?(sk+':'+si):null;
    }
    return null;
  };

  const renderReports=(reports,source)=>{
    const active=reports.filter(r=>!r.handled);
    const handled=reports.filter(r=>r.handled);
    if(!active.length&&!handled.length){list.innerHTML='<div class="no-data-msg">אין פניות עדיין</div>';return}
    let html='';
    if(active.length){
      // Group active reports by question key
      const groups=new Map();
      const ungrouped=[];
      active.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
      active.forEach(r=>{
        const qk=getReportQKey(r);
        if(qk){
          if(!groups.has(qk))groups.set(qk,[]);
          groups.get(qk).push(r);
        }else{ungrouped.push(r)}
      });
      const totalGroups=groups.size+ungrouped.length;
      html+='<div style="font-size:13px;font-weight:700;color:var(--pl);margin-bottom:8px">פניות פעילות ('+active.length+(groups.size?' | '+totalGroups+' נושאים':'')+')</div>';
      // Render grouped reports first (sorted by count desc, then newest)
      const sortedGroups=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length||(b[1][0].timestamp||0)-(a[1][0].timestamp||0));
      sortedGroups.forEach(([qk,items])=>{
        if(items.length>=2){
          html+=renderReportGroup(qk,items,source);
        }else{
          html+=renderReportItem(items[0],source,false);
        }
      });
      ungrouped.forEach(r=>{html+=renderReportItem(r,source,false)});
    }
    if(handled.length){
      html+='<div style="font-size:13px;font-weight:700;color:var(--txtm);margin:16px 0 8px;cursor:pointer" onclick="this.nextElementSibling.classList.toggle(\'hidden\')">טופלו ('+handled.length+') ▾</div>';
      html+='<div class="hidden">';
      handled.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).forEach(r=>{
        html+=renderReportItem(r,source,true);
      });
      html+='</div>';
    }
    list.innerHTML=html;
  };

  if(db){
    // Use cache if fresh (10 min TTL) to avoid 100 reads every open
    if(_reportsCache&&(Date.now()-_reportsCacheTime<REPORTS_CACHE_TTL)){
      renderReports(_reportsCache,'firestore');return;
    }
    db.collection('reports').orderBy('timestamp','desc').limit(100).get().then(snap=>{
      const reports=[];
      snap.forEach(doc=>{const d=doc.data();d._docId=doc.id;reports.push(d)});
      _reportsCache=reports;_reportsCacheTime=Date.now();
      renderReports(reports,'firestore');
    }).catch(e=>{
      console.warn('Firestore reports fetch failed:',e);
      renderReports(getReports(),'local');
    });
  }else{
    renderReports(getReports(),'local');
  }
}

function renderReportGroup(qk,items,source){
  const r0=items[0];
  const ek=r0.ref.srcKey||r0.ref.dataKey||r0.ref.simKey;
  const ei=r0.ref.srcIdx!==undefined?r0.ref.srcIdx:(r0.ref.qIdx||0);
  const locLabel=r0.ref.type==='sim'?('סימולציה: '+(r0.ref.simCat==='hebrew'?'עברית':'דפ"ר')):('לומדה: '+(r0.ref.stepTitle||r0.ref.stepId||qk));
  const docIds=items.filter(r=>r._docId).map(r=>r._docId);
  let html=`<div class="glass" style="padding:14px;margin-bottom:10px;border-right:3px solid #f59e0b">`;
  // Group header
  html+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">`;
  html+=`<div style="display:flex;align-items:center;gap:8px"><span style="background:#f59e0b;color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">${items.length} דיווחים</span>`;
  html+=`<span style="font-size:12px;font-weight:600;color:var(--txt)">${locLabel}</span></div>`;
  html+=`<code style="font-size:11px;color:var(--txtm)">${qk}</code></div>`;
  // Edit button at group level
  if(ek)html+=`<button class="btn" style="width:100%;font-size:13px;padding:8px 14px;margin-bottom:10px;background:rgba(99,102,241,.15);color:var(--pl);border:1px solid rgba(99,102,241,.3);border-radius:var(--r-sm);font-weight:600" onclick="openQuestionEditor('${ek}',${ei})">📦 ערוך שאלה מהמאגר</button>`;
  // Individual reports (compact)
  items.forEach(r=>{html+=renderReportItem(r,source,false,true)});
  // Mark all handled
  if(docIds.length>1){
    html+=`<button class="btn" style="width:100%;margin-top:8px;font-size:12px;padding:8px 14px;background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:var(--r-sm);font-weight:600" onclick="markAllReportsHandled([${docIds.map(d=>"'"+d+"'").join(',')}],this)">סמן הכל כטופל ✓</button>`;
  }
  html+=`</div>`;
  return html;
}

function renderReportItem(r,source,isHandled,compact){
  const date=new Date(r.timestamp);
  const dateStr=date.toLocaleDateString('he-IL')+' '+date.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
  if(compact){
    // Compact sub-item inside a group
    let html=`<div style="padding:8px 10px;margin-bottom:6px;background:rgba(255,255,255,.03);border-radius:var(--r-sm);border:1px solid var(--brd)">`;
    html+=`<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txtm);margin-bottom:4px"><span>👤 ${r.user}</span><span>${dateStr}</span></div>`;
    html+=`<div style="font-size:13px;line-height:1.5">${r.text}</div>`;
    if(r.context)html+=`<div style="font-size:11px;color:var(--txtm);margin-top:4px">${r.context}</div>`;
    if(!isHandled&&r._docId){
      html+=`<button class="btn" style="margin-top:6px;font-size:10px;padding:3px 10px;background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)" onclick="markReportHandled('${r._docId}',this)">סמן כטופל ✓</button>`;
    }
    html+=`</div>`;
    return html;
  }
  // Full report item (ungrouped or handled)
  let html=`<div class="glass report-item" style="${isHandled?'opacity:.5':''}"><div class="report-meta"><span>👤 ${r.user}</span><span>${dateStr}</span></div>`;
  html+=`<div class="report-text">${r.text}</div>`;
  if(r.context)html+=`<div class="report-context">${r.context}</div>`;
  if(r.ref){
    let refHTML='<div style="margin-top:6px;padding:8px;background:rgba(59,130,246,.1);border-radius:var(--r-sm);font-size:12px">';
    refHTML+='<strong>🔗 מיקום:</strong> ';
    if(r.ref.type==='quiz'){
      const sk=r.ref.srcKey||r.ref.dataKey;
      const si=r.ref.srcIdx!==undefined?r.ref.srcIdx:r.ref.qIdx;
      refHTML+=`לומדה: ${r.ref.stepTitle||r.ref.stepId} | מפתח: <code>${sk}:${si}</code>`;
    } else if(r.ref.type==='sim'){
      const sk=r.ref.srcKey||r.ref.simKey;
      const si=r.ref.srcIdx!==undefined?r.ref.srcIdx:r.ref.qIdx;
      refHTML+=`סימולציה: ${r.ref.simCat==='hebrew'?'עברית':'דפ"ר'} | מפתח: <code>${sk}:${si}</code>`;
    } else if(r.ref.type==='flashcard'){
      refHTML+=`כרטיסיה: ${r.ref.fcSrc==='expr'?'ביטוי':'מילה'} | מפתח: <code>${r.ref.fcSrc}:${r.ref.fcIdx}</code> | "${r.ref.word||''}"`;
    }
    refHTML+='</div>';
    html+=refHTML;
    // Edit question button
    if(r.ref.type==='quiz'||r.ref.type==='sim'){
      const ek=r.ref.srcKey||r.ref.dataKey||r.ref.simKey;
      const ei=r.ref.srcIdx!==undefined?r.ref.srcIdx:(r.ref.qIdx||0);
      if(ek)html+=`<button class="btn" style="margin-top:8px;width:100%;font-size:13px;padding:8px 14px;background:rgba(99,102,241,.15);color:var(--pl);border:1px solid rgba(99,102,241,.3);border-radius:var(--r-sm);font-weight:600" onclick="openQuestionEditor('${ek}',${ei})">📦 ערוך שאלה מהמאגר</button>`;
    }
  }
  if(!isHandled&&r._docId){
    html+=`<div style="margin-top:8px;display:flex;gap:6px">`;
    html+=`<button class="btn" style="font-size:11px;padding:6px 14px;background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3)" onclick="markReportHandled('${r._docId}',this)">סמן כטופל ✓</button>`;
    html+=`</div>`;
  }
  if(isHandled)html+='<div style="margin-top:6px;font-size:11px;color:#22c55e;font-weight:600">✓ טופל</div>';
  html+=`</div>`;
  return html;
}

function seedUserCount(){
  if(!db||!user||!user.isAdmin){toast('רק אדמין');return}
  toast('סופר משתמשים...');
  db.collection('users').get().then(snap=>{
    const count=snap.size;
    db.collection('appConfig').doc('stats').set({totalUsers:count},{merge:true}).then(()=>{
      _userCountCache=count;_userCountCacheTime=Date.now();
      getTotalUserCount();
      toast('✓ מונה עודכן: '+count+' משתמשים');
    });
  }).catch(e=>toast('שגיאה: '+e.message));
}

function markAllReportsHandled(docIds,btn){
  if(!db||!docIds.length)return;
  btn.disabled=true;btn.textContent='מעדכן...';
  const batch=db.batch();
  docIds.forEach(id=>{
    batch.update(db.collection('reports').doc(id),{handled:true,handledAt:Date.now(),handledBy:user?user.name:'admin'});
  });
  batch.commit().then(()=>{
    toast(docIds.length+' דיווחים סומנו כטופלו');
    showAdminReports();
  }).catch(e=>{
    console.warn('Batch mark handled failed:',e);
    btn.disabled=false;btn.textContent='סמן הכל כטופל ✓';
    toast('שגיאה בעדכון');
  });
}

function markReportHandled(docId,btn){
  if(!db)return;
  btn.disabled=true;btn.textContent='מעדכן...';
  db.collection('reports').doc(docId).update({handled:true,handledAt:Date.now(),handledBy:user?user.name:'admin'}).then(()=>{
    toast('דיווח סומן כטופל');
    showAdminReports();
  }).catch(e=>{
    console.warn('Mark handled failed:',e);
    btn.disabled=false;btn.textContent='סמן כטופל ✓';
    toast('שגיאה בעדכון');
  });
}


