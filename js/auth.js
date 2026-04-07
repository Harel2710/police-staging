// js/auth.js - Authentication, profile, Firebase Auth
// Auto-extracted from index.html

// ===== AUTH =====
function emailLogin(){
  const errEl=document.getElementById('login-error');
  const email=(document.getElementById('login-email').value||'').trim();
  const pass=document.getElementById('login-password').value||'';
  if(!email||!pass){errEl.textContent='הזן אימייל וסיסמה.';return}
  errEl.textContent='';
  document.getElementById('login-btn').disabled=true;
  document.getElementById('login-btn').textContent='מתחבר...';
  firebase.auth().signInWithEmailAndPassword(email,pass).then(cred=>{
    const uid=cred.user.uid;
    const displayName=cred.user.displayName||email.split('@')[0];
    enterApp(uid,displayName,email);
  }).catch(err=>{
    document.getElementById('login-btn').disabled=false;
    document.getElementById('login-btn').textContent='התחבר';
    if(err.code==='auth/user-not-found'||err.code==='auth/invalid-credential')errEl.textContent='אימייל או סיסמה שגויים.';
    else if(err.code==='auth/invalid-email')errEl.textContent='כתובת אימייל לא תקינה.';
    else if(err.code==='auth/too-many-requests')errEl.textContent='יותר מדי ניסיונות. נסה שוב מאוחר יותר.';
    else errEl.textContent='שגיאה: '+(err.message||err.code);
  });
}
function emailRegister(){
  const errEl=document.getElementById('login-error');
  const name=(document.getElementById('reg-name').value||'').trim();
  const email=(document.getElementById('reg-email').value||'').trim();
  const pass=document.getElementById('reg-password').value||'';
  if(!name||name.length<2){errEl.textContent='הזן שם מלא (2 תווים לפחות).';return}
  if(!email){errEl.textContent='הזן כתובת אימייל.';return}
  if(pass.length<6){errEl.textContent='סיסמה חייבת להכיל לפחות 6 תווים.';return}
  errEl.textContent='';
  document.getElementById('register-btn').disabled=true;
  document.getElementById('register-btn').textContent='נרשם...';
  firebase.auth().createUserWithEmailAndPassword(email,pass).then(cred=>{
    return cred.user.updateProfile({displayName:name}).then(()=>{
      const uid=cred.user.uid;
      enterApp(uid,name,email);
    });
  }).catch(err=>{
    document.getElementById('register-btn').disabled=false;
    document.getElementById('register-btn').textContent='הרשמה';
    if(err.code==='auth/email-already-in-use')errEl.textContent='אימייל זה כבר רשום. נסה להתחבר.';
    else if(err.code==='auth/invalid-email')errEl.textContent='כתובת אימייל לא תקינה.';
    else if(err.code==='auth/weak-password')errEl.textContent='סיסמה חלשה מדי.';
    else errEl.textContent='שגיאה: '+(err.message||err.code);
  });
}
function checkInactivityReset(u){
  if(!u||!u.lastActive||u.isAdmin)return false;
  const elapsed=Date.now()-u.lastActive;
  if(elapsed>THREE_MONTHS&&(u.points||0)>0){
    // Reset progress, keep identity
    u.points=0;
    u.completed=[];
    u.quizResults={};
    u.totalTime=0;
    u.dailyTimePoints={};
    u.boostCount=0;
    return true;
  }
  return false;
}

function enterApp(uid,displayName,email){
  loadGlobalOverrides(()=>{
    let u=getUser(uid);
    if(!u){
      u=newUser(displayName);
      u.uid=uid;
      u.email=email||'';
    }
    u.name=displayName;
    u.uid=uid;
    if(email)u.email=email;
    if(!u.quizResults)u.quizResults={};
    const wasReset=checkInactivityReset(u);
    u.lastActive=Date.now();
    u.firebaseUid=uid;
    const finishEntry=()=>{
      user=u;saveUser(user);
      localStorage.setItem('pApp_last',uid);
      if(wasReset){
        toast('עברו 3 חודשים - ההתקדמות אופסה. בהצלחה!');
      }
      if(!u.profile){
        document.getElementById('profile-back-btn').style.display='none';
        showScreen('profile-screen');
      } else {
        showDash();startTimeTracking();
        document.getElementById('report-fab').style.display='flex';
        toggleAdminFab();
      }
    };
    if(db){
      db.collection('users').doc(uid).get().then(doc=>{
        if(doc.exists){u=mergeFirestoreUser(doc.data(),u);u.uid=uid;u.name=displayName;if(email)u.email=email}
        else{
          // New user - increment global counter
          db.collection('appConfig').doc('stats').set({totalUsers:firebase.firestore.FieldValue.increment(1)},{merge:true}).catch(()=>{});
          _userCountCache=null;
        }
        finishEntry();
      }).catch(()=>finishEntry());
    } else {
      finishEntry();
    }
    toast('ברוך הבא, '+displayName+'!');
  });
}
function logout(){
  user=null;localStorage.removeItem('pApp_last');
  if(timeTracker)clearInterval(timeTracker);
  document.getElementById('login-error').textContent='';
  document.getElementById('report-fab').style.display='none';
  document.getElementById('admin-edit-fab').style.display='none';
  // Reset login form
  document.getElementById('auth-login-view').classList.remove('hidden');
  document.getElementById('auth-register-view').classList.add('hidden');
  ['login-email','login-password','reg-name','reg-email','reg-password'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  if(firebaseReady){try{firebase.auth().signOut()}catch(e){}}
  showScreen('login-screen');
}

// ===== PROFILE SETUP =====
function selectProfileRole(role){
  _profileRole=role;
  document.querySelectorAll('.profile-role-btn').forEach(b=>{b.classList.remove('btn-primary');b.classList.add('btn-secondary')});
  const btn=document.getElementById('profile-role-'+role);
  btn.classList.remove('btn-secondary');btn.classList.add('btn-primary');
  const af=document.getElementById('profile-active-fields');
  const tf=document.getElementById('profile-trainee-fields');
  const sb=document.getElementById('profile-save-btn');
  if(role==='active'){
    af.classList.remove('hidden');af.style.display='';
    tf.classList.add('hidden');tf.style.display='none';
  } else {
    tf.classList.remove('hidden');tf.style.display='';
    af.classList.add('hidden');af.style.display='none';
  }
  sb.style.display='';
  document.getElementById('profile-error').textContent='';
}

function saveProfile(){
  const errEl=document.getElementById('profile-error');
  if(!_profileRole){errEl.textContent='בחר סטטוס';return}
  let profile={role:_profileRole};
  if(_profileRole==='active'){
    const district=document.getElementById('profile-district').value;
    const unit=(document.getElementById('profile-unit').value||'').trim();
    if(!district){errEl.textContent='בחר מחוז / אגף';return}
    profile.district=district;
    profile.unit=unit;
  } else {
    const platoon=document.getElementById('profile-platoon').value;
    const cohort=document.getElementById('profile-cohort').value;
    if(!platoon){errEl.textContent='בחר פלוגה';return}
    if(!cohort){errEl.textContent='בחר מחזור';return}
    profile.platoon=platoon;
    profile.cohort=cohort;
  }
  if(!user){errEl.textContent='שגיאה: משתמש לא מחובר';return}
  user.profile=profile;
  // Auto-set classification for leaderboard
  if(profile.role==='active'){
    user.classification={type:'officer',district:profile.district,unit:profile.unit||''};
  } else {
    user.classification={type:'trainee',company:profile.platoon,cohort:profile.cohort};
  }
  saveUser(user);
  showDash();startTimeTracking();
  document.getElementById('report-fab').style.display='flex';
  toggleAdminFab();
  toast('הפרופיל נשמר!');
}

// ===== FIREBASE AUTH =====

function googleLogin(){
  if(!firebaseReady){toast('Firebase לא מוגדר. הגדר את FIREBASE_CONFIG');return}
  const provider=new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  // Try popup first (works on most browsers including mobile)
  firebase.auth().signInWithPopup(provider).then(result=>{
    const name=result.user.displayName||result.user.email?.split('@')[0]||'User';
    const uid=result.user.uid;
    const email=result.user.email||'';
    enterApp(uid,name,email);
  }).catch(err=>{
    console.error('Google login error:',err);
    if(err.code==='auth/popup-closed-by-user')return;
    if(err.code==='auth/popup-blocked'||err.code==='auth/cancelled-popup-request'){
      // Retry popup instead of redirect (redirect breaks on iOS Safari due to storage partitioning)
      toast('הפופאפ נחסם - נסה שוב או השתמש באימייל');
    } else {
      toast('שגיאה בהתחברות: '+(err.message||err.code));
    }
  });
}

function toggleAuthView(view){
  document.getElementById('auth-login-view').classList.toggle('hidden',view!=='login');
  document.getElementById('auth-register-view').classList.toggle('hidden',view!=='register');
  document.getElementById('login-error').textContent='';
}


