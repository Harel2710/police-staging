// js/utils.js - Utility functions
// Auto-extracted from index.html

// ===== UTILITY =====
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]]}return b};
const NO_TAB_SCREENS=['login-screen','profile-screen','quiz-screen','sim-screen','lesson-screen','results-screen','sim-results-screen','sim-review-screen','flashcard-screen','qbank-screen','admin-reports-screen'];
const HIDE_FABS_SCREENS=['qbank-screen','admin-reports-screen'];
const showScreen=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));const el=document.getElementById(id);el.classList.add('active');el.scrollTo(0,0);window.scrollTo(0,0);const tb=document.getElementById('tab-bar');if(tb)tb.style.display=(!NO_TAB_SCREENS.includes(id)&&user)?'flex':'none';const hideFabs=HIDE_FABS_SCREENS.includes(id);const rf=document.getElementById('report-fab');const af=document.getElementById('admin-edit-fab');if(rf)rf.style.display=hideFabs?'none':(user?'flex':'none');if(af)af.style.display=hideFabs?'none':(user&&user.isAdmin?'flex':'none')};
const toast=(m,t='')=>{const c=document.getElementById('toast-box'),e=document.createElement('div');e.className=`toast ${t}`;e.textContent=m;c.appendChild(e);setTimeout(()=>e.remove(),3000)};
const fmtTime=s=>(0|s/60).toString().padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const confetti=()=>{const c=document.getElementById('confetti-box');c.classList.remove('hidden');const cols=['#ffd700','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ff9ff3'];for(let i=0;i<50;i++){const p=document.createElement('div');p.className='confetti-piece';p.style.left=Math.random()*100+'%';p.style.background=cols[0|Math.random()*cols.length];p.style.animationDelay=Math.random()*1.5+'s';p.style.animationDuration=(2+Math.random()*2)+'s';p.style.borderRadius=Math.random()>.5?'50%':'2px';p.style.width=(5+Math.random()*7)+'px';p.style.height=p.style.width;c.appendChild(p)}setTimeout(()=>{c.innerHTML='';c.classList.add('hidden')},4000)};


function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
