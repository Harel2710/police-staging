// js/lessons.js - Lesson content and rendering
// Auto-extracted from index.html

// ===== LESSONS =====
function openLesson(step){
  document.getElementById('lesson-title').textContent=step.title;
  document.getElementById('lesson-content').innerHTML=getLessonHTML(step.id);
  document.getElementById('lesson-done-btn').onclick=()=>completeStep(step);
  showScreen('lesson-screen');
  setTimeout(populateVocabLesson,50);
}

function getIntroHTML(){
  const ovr=getOverrides();
  const introOvr=ovr['lesson:intro']||{};
  const rows=introOvr.scoreTable||[
    {role:'שוטרים/סמלים',heb:'7',dpr:'4'},
    {role:'קבע',heb:'7',dpr:'5'},
    {role:'חובשים',heb:'1',dpr:'6'},
    {role:'קצינים',heb:'1',dpr:'6'}
  ];
  const tips=introOvr.tips||'המבחן ממוחשב. לפני כל חלק יש הסבר ודוגמאות (לא מוגבלים בזמן) - קרא בעיון!\nשים לב לניסוח השאלה - לפעמים הוא מבלבל בכוונה\nאל תתעכב על שאלה - דלג והמשך\nהשאלות מסודרות מקל לקשה\nהמבחן מוגבל בזמן - סביר שלא תספיק הכל, אל תילחץ';
  let tableRows=rows.map(r=>`<tr><td>${r.role}</td><td>${r.heb}</td><td>${r.dpr}</td></tr>`).join('');
  let tipsHTML=tips.split('\n').filter(t=>t.trim()).map(t=>`<li>${t.trim()}</li>`).join('');
  const lvlRows=LEVELS.map(l=>`<tr><td>${l.i} ${l.n}</td><td>${l.lv}</td><td>${l.min.toLocaleString()}</td></tr>`).join('');
  return `<div class="lesson-card glass"><h3>ברוכים הבאים!</h3>
<p>לומדה זו תסייע לך להתכונן למבחני הדפ"ר והעברית במסגרת הליכי המיון למשטרת ישראל.</p></div>
<div class="lesson-card glass"><h3>📚 מסלול הלמידה</h3>
<p>המסלול בנוי משלבים מסודרים שילוו אותך מהבסיס ועד לשליטה מלאה:</p>
<ol>
<li><strong>מבוא</strong> - ההסבר שאתה קורא עכשיו</li>
<li><strong>מבחן רמה</strong> - סימולציה בעברית ובדפ"ר למיפוי הרמה הנוכחית שלך</li>
<li><strong>מסלול עברית</strong> - אוצר מילים, ביטויים, מילים דומות, הפכים, הבנת הנקרא וכתיב</li>
<li><strong>מסלול דפ"ר</strong> - מילוי הוראות, מילון, מצפן, סדרות וצורות</li>
<li><strong>מבחן סיום</strong> - סימולציה מסכמת בעברית ובדפ"ר למדידת ההתקדמות</li>
<li><strong>סיכום</strong> - טיפים אחרונים לקראת יום המבחן</li>
</ol>
<div class="tip">מסלולי העברית והדפ"ר מתקדמים במקביל - תוכל ללמוד בכל סדר שתרצה!</div></div>
<div class="lesson-card glass"><h3>⭐ שיטת הניקוד</h3>
<p>הניקוד באפליקציה מבוסס על <strong>מעורבות ותרגול</strong> - ככל שתתרגל יותר, תצבור יותר נקודות:</p>
<ul>
<li><strong>תרגול (קוויז)</strong> - 30 נקודות + בונוס זמן</li>
<li><strong>תרגול מהיר (בוסט)</strong> - 25 נקודות + 30 נקודות בסיס + בונוס זמן</li>
<li><strong>כרטיסיות לימוד</strong> - 15 נקודות לסשן</li>
<li><strong>סימולציה</strong> - 35 נקודות + בונוס זמן</li>
</ul>
<div class="tip">הניקוד מעודד תרגול עקבי - אין עונש על טעויות, רק תגמול על מאמץ!</div></div>
<div class="lesson-card glass"><h3>🏆 10 רמות</h3>
<p>ככל שתצבור נקודות, תעלה ברמות:</p>
<table><tr><th>רמה</th><th>דרגה</th><th>נקודות נדרשות</th></tr>${lvlRows}</table></div>
<div class="lesson-card glass"><h3>מבנה המבחנים</h3>
<p><strong>מבחן עברית</strong> - אוצר מילים, כתיב, הבנת הנקרא, השלמת משפטים (23 דקות, 33 שאלות)</p>
<p><strong>מבחן דפ"ר</strong> - מילוי הוראות, סדרות מספריות, צורות</p></div>
<div class="lesson-card glass"><h3>שיטת חישוב הציון במבחן</h3>
<p>טווח הציונים: 1-8</p>
<div class="tip"><strong>עברית:</strong> תשובה שגויה לא מורידה ניקוד. אם אתה לא בטוח - <strong>נחש!</strong></div>
<div class="tip"><strong>דפ"ר:</strong> תשובה שגויה מורידה כ-1/4 נקודה. אם אתה לא בטוח - <strong>אל תענה.</strong> אם צמצמת ל-2 אפשרויות - כדאי לנחש.</div>
<p><strong>ציונים נדרשים לפי תפקיד:</strong></p>
<table><tr><th>תפקיד</th><th>עברית</th><th>דפ"ר</th></tr>${tableRows}</table></div>
<div class="lesson-card glass"><h3>טיפים חשובים</h3>
<ul>${tipsHTML}</ul></div>`;
}

function getLessonHTML(id){
  const L={
    intro:getIntroHTML(),

    vocab:`<div class="lesson-card glass"><h3>רשימת אוצר מילים</h3>
<p>למד את המילים הבאות. הן מופיעות לעיתים קרובות במבחן העברית:</p>
<div class="vocab-grid" id="vocabGrid"></div></div>
<div class="lesson-card glass"><h3>מילים דומות</h3>
<p>זוגות מילים שנראות דומות אך משמעותן שונה:</p>
<div id="similarGrid"></div></div>
<div class="lesson-card glass"><h3>ביטויים</h3>
<p>ביטויים נפוצים שכדאי להכיר:</p>
<div id="exprGrid"></div></div>`,

    expr_learn:`<div class="lesson-card glass"><h3>מבוא - ביטויים ומילים דומות</h3>
<p>ביטויים רבים בעברית הם <strong>מטאפוריים</strong> - המשמעות שלהם אינה מילולית. יש לזהות את המשמעות האמיתית מתוך ההקשר.</p>
<div class="tip">שימו לב לביטויים שנראים דומים אך שונים לחלוטין במשמעותם! קראו את כל האפשרויות לפני שבוחרים תשובה.</div></div>
<div class="lesson-card glass"><h3>ביטויים חשובים</h3>
<p>ביטויים נפוצים שמופיעים במבחן ומשמעותם:</p>
<div class="example"><strong>"יד רוחצת יד"</strong> = אנשים שעוזרים זה לזה ומגנים זה על זה</div>
<div class="example"><strong>"על ראש הגנב בוער הכובע"</strong> = מי שאשם מגלה את עצמו</div>
<div class="example"><strong>"אל תסתכל בקנקן אלא במה שיש בתוכו"</strong> = אל תשפוט לפי מראה חיצוני</div>
<div class="example"><strong>"אין זה מן התימה"</strong> = זה לא מפתיע</div>
<div class="example"><strong>"הוגה דעות"</strong> = אדם בעל מחשבות ורעיונות מקוריים</div>
<div class="example"><strong>"בהיסח הדעת"</strong> = בחוסר תשומת לב, בלי לשים לב</div>
<div class="example"><strong>"אוזניים ערלות"</strong> = אוזניים לא קשובות</div>
<div class="example"><strong>"אבד עליו הכלח"</strong> = התיישן מאוד, כבר לא רלוונטי</div>
<div class="example"><strong>"מרה שחורה"</strong> = דיכאון</div>
<div class="example"><strong>"החלק הארי"</strong> = החלק העיקרי, הגדול ביותר</div></div>
<div class="lesson-card glass"><h3>מילים דומות</h3>
<p>מילים שנראות דומות אך שונות לחלוטין במשמעותן. חשוב להבחין ביניהן:</p>
<div class="example"><strong>גער ≠ גהר</strong> — גער = נזף, העיר הערה חריפה | גהר = התכופף קדימה</div>
<div class="example"><strong>ציתת ≠ ציטט</strong> — ציתת = האזין בסתר | ציטט = חזר על דברי אדם אחר</div>
<div class="example"><strong>עיכב ≠ עקב</strong> — עיכב = עצר, גרם לעיכוב | עקב = עקב אחרי מישהו</div>
<div class="example"><strong>סותרת ≠ סטירה</strong> — סותרת = מנוגדת, הפוכה | סטירה = מכה בפנים</div>
<div class="example"><strong>תובעת ≠ תבעה</strong> — הקשר שונה: תובעת = הקשר משפטי | תבעה = דרישה כללית</div>
<div class="example"><strong>להניא ≠ להניע</strong> — להניא = למנוע, לשכנע שלא | להניע = לגרום לפעולה, לעודד</div></div>
<div class="lesson-card glass"><h3>טיפים לפתרון שאלות ביטויים</h3>
<div class="tip">קראו את כל האפשרויות לפני שבוחרים תשובה - לפעמים יש שתי אפשרויות שנראות נכונות.</div>
<div class="tip">שימו לב להקשר המשפט - אותו ביטוי יכול לקבל משמעות שונה בהקשרים שונים.</div>
<div class="tip">ביטויים עשויים להופיע בצורות שונות (למשל "רחצת יד" במקום "יד רוחצת יד") - הבינו את העיקרון ולא רק את הניסוח המדויק.</div></div>`,

    instr_learn:`<div class="lesson-card glass"><h3>מילוי הוראות - סקירה כללית</h3>
<p>בחלק זה של המבחן נבדקת יכולתך לעקוב אחר הוראות מורכבות ולבצע אותן במדויק.</p>
<p><strong>5 סוגי שאלות | 19 שאלות | 12 דקות</strong></p>
<div class="tip">הזמן קצוב - חשוב לעבוד מהר ומדויק. הכינו טיוטה עם א"ב ושושנת רוחות לפני תחילת הזמן!</div></div>
<div class="lesson-card glass"><h3>1. ביצוע הוראות</h3>
<p>סדרת משימות לביצוע: חשבון פשוט, ספירת אותיות, הבנת הוראות מורכבות. יש לקרוא כל מילה בקפידה.</p>
<div class="example"><strong>דוגמה:</strong> ארבעה שמות: עמרם, שאול, גילי, ששון. מהי האות השלישית בשם שאין בו אותיות חוזרות?<br><strong>פתרון:</strong> עמרם - יש מ פעמיים. גילי - יש י פעמיים. ששון - יש ש פעמיים. שאול - אין אותיות חוזרות! האות השלישית = <strong>ו</strong></div>
<div class="example"><strong>דוגמה:</strong> באיזה מספר הספרה 7 במקום המאות, 6 במקום האחדות ו-3 במקום העשרות?<br><strong>פתרון:</strong> מאות=7, עשרות=3, אחדות=6 → <strong>736</strong></div>
<div class="tip">קראו את ההוראות בקפידה, מילה אחר מילה. טעות קטנה בקריאה = תשובה שגויה!</div></div>
<div class="lesson-card glass"><h3>2. חיפוש במילון</h3>
<p>קביעה איזו מילה מופיעה ראשונה או אחרונה בסדר אלף-ביתי (כמו במילון).</p>
<div class="example"><strong>דוגמה:</strong> האם "דקדקנות" מופיעה לפני "דלילות" במילון?<br><strong>פתרון:</strong> שתיהן מתחילות ב-ד. האות השנייה: ק מול ל. ק מופיעה אחרי ל בא"ב → "דלילות" לפני "דקדקנות" → <strong>לא</strong>, דקדקנות לא מופיעה לפני.</div>
<div class="tip">כתבו את כל אותיות הא"ב על טיוטה לפני שהזמן מתחיל! זה חוסך זמן יקר.</div>
<div class="tip">בדקו אות אות משמאל לימין - ברגע שמצאתם אות שונה, היא קובעת את הסדר.</div></div>
<div class="lesson-card glass"><h3>3. קריאת נתונים</h3>
<p>שאלות על <strong>טבלאות</strong>, <strong>גרפי עמודות</strong> ו<strong>תרשימים</strong>. יש לקרוא את הנתונים בדקדקנות רבה.</p>
<div class="tip">שימו לב לכותרות העמודות והשורות בטבלאות - לפעמים הסדר לא אינטואיטיבי.</div>
<div class="tip">בגרפים - בדקו את קנה המידה של הצירים לפני שקוראים ערכים.</div>
<div class="example"><strong>דוגמה:</strong> בטבלה של מכירות חודשיות, אם שואלים "באיזה חודש המכירות הכי גבוהות" - קראו את כל הערכים, אל תסתמכו על מבט מהיר.</div></div>
<div class="lesson-card glass"><h3>4. שאלות מצפן</h3>
<p>בהינתן כיוונים ומרחקים, קבעו את הכיוון הסופי ביחס לנקודת ההתחלה.</p>
<p><strong>שלב אחר שלב:</strong></p>
<ul><li>ציירו שושנת רוחות על הטיוטה (צפון למעלה, <strong>מזרח משמאל</strong> כי כותבים בעברית מימין לשמאל)</li>
<li>כל הליכה ישרה - סמנו בקו על הטיוטה</li>
<li>בסוף - בדקו איפה אתם ביחס לנקודת ההתחלה</li></ul>
<div class="example"><strong>דוגמה:</strong> הלכת 3 ק"מ מערבה, 4 ק"מ מזרחה, 3 ק"מ דרומה. מה הכיוון?<br><strong>פתרון:</strong> מערב-מזרח: 3 מערבה + 4 מזרחה = 1 מזרחה. צפון-דרום: 3 דרומה. → הכיוון: <strong>דרום-מזרח</strong></div>
<div class="tip">ציירו כל שלב על הטיוטה - אל תנסו לפתור בראש!</div></div>
<div class="lesson-card glass"><h3>5. סדרי עדיפויות וניהול זמן</h3>
<p>עם 19 שאלות ו-12 דקות בלבד, ניהול הזמן הוא קריטי:</p>
<ul><li><strong>התחילו מהשאלות הקלות</strong> - ביצוע הוראות וקריאת נתונים בדרך כלל מהירות יותר</li>
<li><strong>אל תבזבזו זמן</strong> על שאלת מצפן מסובכת - דלגו וחזרו אליה בסוף</li>
<li><strong>הכינו טיוטה</strong> עם א"ב מלא ושושנת רוחות לפני תחילת הזמן - זה חוקי ומומלץ!</li>
<li><strong>עבדו בשיטתיות</strong> - קראו כל שאלה פעמיים לפני שעונים</li></ul>
<div class="tip">חישוב: כ-38 שניות לשאלה. אם שאלה לוקחת יותר מדקה - דלגו!</div></div>`,

    seq_learn:`<div class="lesson-card glass"><h3>סדרות מספריות</h3>
<p>בשאלות אלה עליך למצוא את החוק שלפיו בנויה הסדרה ולמצוא את המספר הבא/החסר.</p>
<p><strong>5 סוגי סדרות:</strong></p></div>
<div class="lesson-card glass"><h3>סוג 1: פעולה אחת קבועה</h3>
<p>הפרש קבוע או מכפלה/חילוק קבועים בין כל מספר למספר הבא.</p>
<div class="example">1, 8, 15, 22, 29... → <strong>+7</strong> בכל שלב</div>
<div class="example">243, 81, 27, 9, 3... → <strong>/3</strong> בכל שלב</div>
<div class="example">232, 191, ___, 109, 68, 27 → <strong>-41</strong> בכל שלב (התשובה: 150)</div>
<div class="tip">טיפ: חשבו את ההפרש בין שני מספרים סמוכים. אם הוא קבוע - מצאתם את החוק!</div></div>
<div class="lesson-card glass"><h3>סוג 2: שתי פעולות מתחלפות</h3>
<p>שתי פעולות שונות לסירוגין, או שתי פעולות על אותו שלב.</p>
<div class="example">5, 25, 20, 100, 95... → <strong>x5, -5, x5, -5</strong></div>
<div class="example">4, 8, 12, 24, 28, 56... → <strong>x2, +4, x2, +4</strong></div>
<div class="example">80, 160, 40, 80, 20, 40, 10... → <strong>x2, /4</strong> לסירוגין</div>
<div class="tip">אפשרי גם: שתי פעולות על אותו שלב: 110, 54, 26, 12... → /2 ואז -1</div>
<div class="example"><strong>מתקדם - מכפיל משתנה:</strong> 7, 15, 46, 185... → x2+1, x3+1, x4+1 (המכפיל עצמו גדל בכל שלב!)</div></div>
<div class="lesson-card glass"><h3>סוג 3: סדרת הפרשים</h3>
<p>ההפרשים בין המספרים עצמם יוצרים סדרה. כתבו את ההפרשים בשורה נפרדת.</p>
<div class="example">1, 2, 5, 14, 41... → הפרשים: 1, 3, 9, 27 → <strong>x3</strong></div>
<div class="example">10, 20, 60, 240... → הפרשים: 10, 40, 180 → <strong>x2, x3, x4</strong> (המכפיל עולה ב-1!)</div>
<div class="tip">אם ההפרשים עצמם לא יוצרים חוק ברור - נסו לחשב הפרשים של ההפרשים (שורה שלישית).</div></div>
<div class="lesson-card glass"><h3>סוג 4: סכום שני קודמים</h3>
<p>כל מספר הוא סכום שני המספרים שלפניו (כמו פיבונאצ'י).</p>
<div class="example">0, 1, 1, 2, 3, 5, 8... → 0+1=1, 1+1=2, 1+2=3, 2+3=5...</div>
<div class="tip">וריאציות אפשריות: סכום שלושה קודמים, או סכום קודמים עם פעולה נוספת.</div></div>
<div class="lesson-card glass"><h3>סוג 5: שתי סדרות משולבות</h3>
<p>שתי סדרות נפרדות שמשולבות לסירוגין - מספרים במקומות אי-זוגיים שייכים לסדרה אחת, ומספרים במקומות זוגיים לסדרה אחרת.</p>
<div class="example">3, 2, 6, 3, 9... → סדרה 1: 3, 6, 9 (<strong>+3</strong>) / סדרה 2: 2, 3 (<strong>+1</strong>)</div>
<div class="example">302, 3, 301, 6, 300, 12... → סדרה 1: 302, 301, 300 (<strong>-1</strong>) / סדרה 2: 3, 6, 12 (<strong>x2</strong>)</div>
<div class="tip">אם הסדרה עולה ויורדת בו-זמנית, או שהמספרים "קופצים" - כנראה שתי סדרות משולבות! הפרידו אותן.</div></div>
<div class="lesson-card glass"><h3>טיפ הזהב לסדרות</h3>
<ul><li>אם יש <strong>קפיצות גדולות</strong> בין המספרים → כנראה <strong>כפל</strong></li>
<li>אם הסדרה <strong>עולה ויורדת</strong> לסירוגין → כנראה <strong>שתי סדרות משולבות</strong></li>
<li>אם שום דבר לא עובד → <strong>בדקו הפרשים בין הפרשים</strong> (סדרת הפרשים)</li>
<li><strong>כתבו על נייר!</strong> אל תנסו לפתור בראש - רשמו את המספרים וההפרשים</li></ul>
<div class="tip">בדקו תמיד את התשובה: הציבו את החוק שמצאתם ותוודאו שהוא עובד על כל המספרים בסדרה.</div></div>`,

    shapes_learn:`<div class="lesson-card glass"><h3>צורות ודפוסים - סקירה כללית</h3>
<p>בדומה לסדרות מספריות, גם בשאלות הצורות קיימת <strong>חוקיות חוזרת</strong> שצריך לזהות.</p>
<p><strong>31 שאלות | 12 דקות</strong></p>
<p>ניתן לפתור כל שאלה בכמה דרכים. בנוסף, שאלות רבות משלבות שיטות שונות - למשל צורה שמסתובבת ובמקביל משנה צבע.</p>
<div class="tip">הבינו את סוגי הדפוסים הבסיסיים - רוב השאלות הן שילוב של כמה מהם.</div></div>
<div class="lesson-card glass"><h3>1. חיבור צורות / הנחה זו על זו</h3>
<p>כשמניחים שתי צורות אחת על השנייה:</p>
<ul><li><strong>קווים משותפים</strong> - נשארים כפי שהם</li>
<li><strong>קווים שאינם משותפים</strong> - מתווספים לתמונה</li></ul>
<div class="example"><strong>דוגמה:</strong> משולש + ריבוע שחולקים צלע אחת → הצלע המשותפת נשארת, ושאר הצלעות מתחברות ליצירת צורה חדשה</div>
<div class="tip">דמיינו שאתם מניחים שקף אחד על השני - מה תראו?</div></div>
<div class="lesson-card glass"><h3>2. היפוכים וסיבובים</h3>
<p>צורות מסתובבות או מתהפכות בין שלב לשלב:</p>
<ul><li><strong>סיבוב 90 מעלות</strong> - רבע סיבוב (עם או נגד כיוון השעון)</li>
<li><strong>סיבוב 180 מעלות</strong> - חצי סיבוב (הצורה הפוכה)</li>
<li><strong>שיקוף כמראה</strong> - היפוך ימין ↔ שמאל, או למעלה ↔ למטה</li></ul>
<div class="example"><strong>דוגמה:</strong> חץ שמצביע ימינה → למעלה → שמאלה → למטה = סיבוב 90 מעלות בכל שלב</div>
<div class="tip">בשאלות מתקדמות: סיבוב + שינוי נוסף (למשל סיבוב + שינוי צבע). בדקו כל מרכיב בנפרד!</div></div>
<div class="lesson-card glass"><h3>3. משחקי צבעים ודוגמאות</h3>
<p>צורות מתמלאות, מתרוקנות, או משנות דפוס בין השלבים:</p>
<ul><li><strong>דפוס מחזורי:</strong> ריק → חצי מלא → מלא → ריק (חוזר מההתחלה)</li>
<li><strong>מילוי הדרגתי:</strong> כל שלב מתמלא חלק נוסף</li>
<li><strong>החלפת צבעים:</strong> שחור הופך ללבן ולהיפך</li></ul>
<div class="example"><strong>דוגמה:</strong> עיגול ריק → עיגול חצי מלא → עיגול מלא → עיגול ריק → חוזר חלילה</div>
<div class="tip">לפעמים כמה דפוסי צבע פועלים במקביל על אלמנטים שונים באותה צורה. בדקו כל אלמנט בנפרד.</div></div>
<div class="lesson-card glass"><h3>4. פעולות חשבוניות על צורות</h3>
<p>מספר האלמנטים בצורה גדל או קטן לפי חוק מתמטי:</p>
<ul><li><strong>תוספת קבועה:</strong> +1 אלמנט, +2 אלמנטים בכל שלב</li>
<li><strong>הכפלה:</strong> מספר האלמנטים מוכפל</li>
<li><strong>סדרה:</strong> 1, 3, 5, 7... אלמנטים (כמו סדרות מספריות!)</li></ul>
<div class="example"><strong>דוגמה:</strong> צורה עם 2 נקודות → 4 נקודות → 6 נקודות → 8 נקודות = <strong>+2</strong> נקודות בכל שלב</div>
<div class="tip">ספרו את האלמנטים בכל שלב וכתבו את המספרים - אולי תגלו סדרה מספרית!</div></div>
<div class="lesson-card glass"><h3>5. כיווני שעון ותמונות מראה</h3>
<p>עקבו אחרי כיוון התנועה של אלמנטים בתוך הצורה:</p>
<ul><li><strong>תנועה עם כיוון השעון</strong> - אלמנט זז למיקום הבא בכיוון השעון</li>
<li><strong>תנועה נגד כיוון השעון</strong> - אלמנט זז למיקום הבא נגד כיוון השעון</li>
<li><strong>שיקוף אופקי</strong> - כאילו שמים מראה מימין (ימין ↔ שמאל)</li>
<li><strong>שיקוף אנכי</strong> - כאילו שמים מראה למטה (למעלה ↔ למטה)</li></ul>
<div class="example"><strong>דוגמה:</strong> נקודה שחורה נמצאת בפינה ימנית עליונה → ימנית תחתונה → שמאלית תחתונה → שמאלית עליונה = תנועה עם כיוון השעון</div></div>
<div class="lesson-card glass"><h3>6. טיפים לפתרון שאלות צורות</h3>
<div class="tip"><strong>הסתכלו על הדפוס הכללי</strong> לפני שנכנסים לפרטים - מה הרושם הראשוני?</div>
<div class="tip"><strong>בדקו מה משתנה</strong> בין צורה לצורה - ומה נשאר קבוע. מה שנשאר קבוע עוזר לזהות את החוק.</div>
<div class="tip"><strong>נסו כמה חוקיות</strong> וראו מה מתאים. אם סיבוב לא מסביר הכל - אולי יש גם שינוי צבע?</div>
<div class="tip"><strong>אם קשה - דלגו וחזרו!</strong> עם 31 שאלות ב-12 דקות, כל שאלה צריכה לקחת כ-23 שניות. אל תתקעו.</div></div>`,

    summary:`<div class="lesson-card glass"><h3>סיכום והמלצות</h3>
<p>סיימת את כל מסלול הלמידה! הנה כמה טיפים אחרונים:</p>
<ul>
<li>חזור על המילים והביטויים שלמדת</li>
<li>תרגל שוב את הנושאים שהיו קשים לך</li>
<li>בלילה שלפני המבחן - ישן טוב!</li>
<li>הגע למבחן ערני ורגוע</li>
<li>קרא כל שאלה בעיון - שים לב לניסוח</li>
<li>נהל את הזמן - אל תתעכב על שאלה קשה</li></ul>
<div class="tip">בהצלחה במבחן!</div></div>`,
  };
  return L[id]||'<div class="lesson-card glass"><p>תוכן השיעור יתעדכן בקרוב.</p></div>';
}


// ===== POPULATE VOCAB LESSON =====
function populateVocabLesson(){
  if(typeof HEBREW_DATA==='undefined')return;
  const vg=document.getElementById('vocabGrid');
  if(vg&&HEBREW_DATA.vocabulary){vg.innerHTML=HEBREW_DATA.vocabulary.map(v=>`<div class="vocab-item"><span class="vocab-word">${v.word}</span><span>${v.meaning}</span></div>`).join('')}
  const sg=document.getElementById('similarGrid');
  if(sg&&HEBREW_DATA.similarWords){sg.innerHTML='<table>'+HEBREW_DATA.similarWords.map(s=>`<tr><td><strong>${s.word1}</strong> - ${s.meaning1}</td><td><strong>${s.word2}</strong> - ${s.meaning2}</td></tr>`).join('')+'</table>'}
  const eg=document.getElementById('exprGrid');
  if(eg&&HEBREW_DATA.expressions){eg.innerHTML=HEBREW_DATA.expressions.map(e=>`<div class="vocab-item" style="grid-column:1/-1"><span class="vocab-word">${e.expr}</span><span>${e.meaning}</span></div>`).join('')}
}


