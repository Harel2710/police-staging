// js/storage.js - LocalStorage, Firestore sync, overrides
// Auto-extracted from index.html

// ===== STORAGE =====
const getUsers=()=>{try{return JSON.parse(localStorage.getItem('pApp_u'))||{}}catch{return{}}};
const saveUsers=u=>localStorage.setItem('pApp_u',JSON.stringify(u));
const getUser=n=>getUsers()[n]||null;
const saveUser=u=>{const us=getUsers();const key=u.uid||u.name;us[key]=u;saveUsers(us);syncUserToFirestore(u)};
const newUser=n=>({name:n,points:0,completed:[],totalTime:0,lastActive:Date.now(),created:Date.now(),quizResults:{},classification:null});

// ===== FIRESTORE SYNC =====
let _syncTimer=null;
let _firestoreUsersCache=null;
let _firestoreCacheTime=0;
const FIRESTORE_CACHE_TTL=600000; // 10 minutes
let _userCountCache=null;
let _userCountCacheTime=0;
const USER_COUNT_CACHE_TTL=600000; // 10 minutes

function syncUserToFirestore(u){
  if(!db||!u)return;
  const docId=u.uid||u.name;
  if(!docId)return;
  // Debounce: wait 10 seconds of inactivity before syncing
  if(_syncTimer)clearTimeout(_syncTimer);
  _syncTimer=setTimeout(()=>{
    const doc={
      name:u.name,
      email:u.email||'',
      uid:u.uid||'',
      points:u.points||0,
      completed:u.completed||[],
      totalTime:u.totalTime||0,
      lastActive:Date.now(),
      created:u.created||Date.now(),
      quizResults:u.quizResults||{},
      classification:u.classification||null,
      isAdmin:u.isAdmin||false,
      profile:u.profile||null
    };
    db.collection('users').doc(docId).set(doc,{merge:true}).then(()=>{
      console.log('Firestore synced:',u.name);
      // Note: do NOT invalidate _firestoreUsersCache here - let TTL handle it to reduce reads
    }).catch(e=>console.warn('Firestore sync error:',e));
  },10000);
}

function fetchFirestoreLeaderboard(){
  return new Promise((resolve)=>{
    if(!db){resolve([]);return}
    // Use cache if fresh
    if(_firestoreUsersCache&&(Date.now()-_firestoreCacheTime<FIRESTORE_CACHE_TTL)){
      resolve(_firestoreUsersCache);return;
    }
    db.collection('users').orderBy('points','desc').limit(50).get().then(snap=>{
      const users=[];
      snap.forEach(doc=>users.push(doc.data()));
      _firestoreUsersCache=users;
      _firestoreCacheTime=Date.now();
      resolve(users);
    }).catch(e=>{
      console.warn('Firestore leaderboard fetch error:',e);
      resolve([]);
    });
  });
}

function mergeFirestoreUser(firestoreData,localUser){
  // Merge strategy: keep highest points, union completed, merge quizResults (newest wins)
  if(!firestoreData)return localUser;
  if(!localUser)return firestoreData;
  const merged={...localUser};
  if(firestoreData.points>merged.points)merged.points=firestoreData.points;
  // Union completed arrays
  const fcSet=new Set([...(merged.completed||[]),...(firestoreData.completed||[])]);
  merged.completed=[...fcSet];
  // Merge quizResults: keep whichever has newer lastDate per key
  if(firestoreData.quizResults){
    if(!merged.quizResults)merged.quizResults={};
    for(const[key,val] of Object.entries(firestoreData.quizResults)){
      if(!merged.quizResults[key]||(val.lastDate||0)>(merged.quizResults[key].lastDate||0)){
        merged.quizResults[key]=val;
      }
    }
  }
  if(firestoreData.totalTime>merged.totalTime)merged.totalTime=firestoreData.totalTime;
  if(firestoreData.classification&&!merged.classification)merged.classification=firestoreData.classification;
  if(firestoreData.isAdmin)merged.isAdmin=true;
  if(firestoreData.profile&&!merged.profile)merged.profile=firestoreData.profile;
  return merged;
}


// === Reports storage ===
function getReports(){try{return JSON.parse(localStorage.getItem('pApp_reports'))||[]}catch{return[]}}
function saveReports(r){localStorage.setItem('pApp_reports',JSON.stringify(r))}

// === Overrides system ===
function getOverrides(){return JSON.parse(localStorage.getItem('pApp_overrides')||'{}')}
function saveOverrides(o){
  localStorage.setItem('pApp_overrides',JSON.stringify(o));
  // Admin: sync overrides to Firestore for all users
  if(user&&user.isAdmin&&db){
    db.collection('appConfig').doc('overrides').set({data:JSON.stringify(o),updated:Date.now()},{merge:true})
      .then(()=>console.log('Overrides synced to Firestore'))
      .catch(e=>console.warn('Overrides sync failed:',e));
  }
}
function loadGlobalOverrides(callback){
  if(!db){if(callback)callback();return}
  db.collection('appConfig').doc('overrides').get().then(doc=>{
    if(doc.exists&&doc.data().data){
      localStorage.setItem('pApp_overrides',doc.data().data);
      console.log('Global overrides loaded from Firestore');
    }
    if(callback)callback();
  }).catch(e=>{console.warn('Failed to load global overrides:',e);if(callback)callback()});
}
// Admin: push all existing local overrides to Firestore
function pushAllOverrides(){
  if(!user||!user.isAdmin){toast('רק אדמין יכול לבצע פעולה זו');return}
  if(!db){toast('שגיאה: אין חיבור לדאטאבייס');return}
  const o=getOverrides();
  db.collection('appConfig').doc('overrides').set({data:JSON.stringify(o),updated:Date.now()})
    .then(()=>toast('✓ כל העריכות הועלו לשרת'))
    .catch(e=>toast('שגיאה: '+e.message));
}

function applyOverrides(arr){
  const ovr=getOverrides();
  return arr.map(q=>{
    if(!q._srcKey&&q._srcKey!==0)return q;
    const oKey=q._srcKey+':'+q._srcIdx;
    const o=ovr[oKey];
    if(o&&o.deleted)return null;
    if(o){
      const c={...q};
      if(o.q!==undefined)c.q=o.q;
      if(o.o)c.o=[...o.o];
      if(o.a!==undefined)c.a=o.a;
      if(o.e!==undefined)c.e=o.e;
      return c;
    }
    return q;
  }).filter(Boolean);
}

function tagQuestions(arr,key){
  return arr.map((q,i)=>({...q,_srcKey:key,_srcIdx:i}));
}


