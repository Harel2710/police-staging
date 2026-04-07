// js/init.js - App initialization and event binding
// Auto-extracted from index.html

// ===== INIT =====
function init(){
  // Auth buttons
  document.getElementById('login-btn').onclick=emailLogin;
  document.getElementById('register-btn').onclick=emailRegister;
  document.getElementById('show-register-link').onclick=e=>{e.preventDefault();toggleAuthView('register')};
  document.getElementById('show-login-link').onclick=e=>{e.preventDefault();toggleAuthView('login')};
  document.getElementById('login-password').onkeydown=e=>{if(e.key==='Enter')emailLogin()};
  document.getElementById('reg-password').onkeydown=e=>{if(e.key==='Enter')emailRegister()};
  document.getElementById('logout-btn').onclick=logout;
  document.getElementById('next-btn').onclick=nextQ;
  document.getElementById('quit-quiz-btn').onclick=quitQuiz;
  // Boost buttons
  document.getElementById('boost-heb').onclick=()=>startBoost('hebrew');
  document.getElementById('boost-dpr').onclick=()=>startBoost('dpr');
  // Sim buttons
  document.getElementById('sim-heb').onclick=()=>startSim('hebrew');
  document.getElementById('sim-dpr').onclick=()=>startSim('dpr');
  // Admin
  document.getElementById('admin-reports-btn').onclick=showAdminReports;
  document.getElementById('admin-lb-config-btn').onclick=showAdminLBConfig;
  // Auto-login: try localStorage first, then Firebase redirect
  const last=localStorage.getItem('pApp_last');
  if(last&&getUser(last)){
    user=getUser(last);if(!user.quizResults)user.quizResults={};
    const wasReset=checkInactivityReset(user);
    user.lastActive=Date.now();saveUser(user);
    if(wasReset)toast('עברו 3 חודשים - ההתקדמות אופסה. בהצלחה!');
    if(!user.profile){
      document.getElementById('profile-back-btn').style.display='none';
      showScreen('profile-screen');
    } else {
      showDash();startTimeTracking();
      document.getElementById('report-fab').style.display='flex';toggleAdminFab();
    }
  } else if(firebaseReady){
    const loginBtn=document.getElementById('google-login-btn');
    const origText=loginBtn?.innerHTML;
    if(loginBtn)loginBtn.innerHTML='<span style="font-size:14px">מתחבר...</span>';
    firebase.auth().getRedirectResult().then(function(result){
      if(result && result.user){
        const name=result.user.displayName||result.user.email?.split('@')[0]||'User';
        const uid=result.user.uid;
        const email=result.user.email||'';
        enterApp(uid,name,email);
      } else {
        if(loginBtn)loginBtn.innerHTML=origText;
      }
    }).catch(function(err){
      console.warn('Redirect auth:',err);
      if(loginBtn)loginBtn.innerHTML=origText;
    });
  }
  // Observer for lesson content population
  const obs=new MutationObserver(()=>populateVocabLesson());
  obs.observe(document.getElementById('lesson-content'),{childList:true});
}
document.addEventListener('DOMContentLoaded',init);
</script><script>

