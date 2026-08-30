const DEFAULTS={clockSize:110,clockPosition:"right",imageSize:90,imagePosition:"center",showDate:true,showClock:true,showSchedule:true,showImage:true};
let settings={...DEFAULTS}, exams=[], currentDate=localDateISO();
const $=id=>document.getElementById(id);

function localDateISO(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function thaiDate(d=new Date()){return d.toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});}
function parseTime(t){if(!t)return 0;const [h,m]=t.split(":").map(Number);return h*60+m;}
function nowMinutes(d=new Date()){return d.getHours()*60+d.getMinutes()+d.getSeconds()/60;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function applySettings(){
document.documentElement.style.setProperty("--clock-size",settings.clockSize+"px");
document.documentElement.style.setProperty("--image-size",settings.imageSize+"%");
$("clock").style.display=settings.showClock?"flex":"none";
$("dateText").style.display=settings.showDate?"block":"none";
$("scheduleCard").style.display=settings.showSchedule?"block":"";
$("imageWrap").style.display=settings.showImage?"flex":"none";
$("bottomBar").className="bottom-bar clock-"+(settings.clockPosition||"right");
$("imageWrap").className="image-wrap image-"+(settings.imagePosition||"center");
}

async function loadSettings(){
const {data,error}=await sb.from("display_settings").select("*").eq("id",1).maybeSingle();
if(!error&&data)settings={...DEFAULTS,...data};
applySettings();
}

async function loadExams(){
const {data,error}=await sb.from("exams").select("*").eq("exam_date",currentDate).eq("enabled",true).order("start_time");
if(error)return;
exams=data||[];
renderSchedule();
renderNextExam();
}

async function loadImage(){
const {data,error}=await sb.from("display_settings").select("image_url,announcement,show_announcement").eq("id",1).maybeSingle();
if(error||!data)return;
const img=$("examImage"),empty=$("empty");
if(data.image_url){img.src=data.image_url;img.hidden=false;empty.hidden=true;}
else{img.hidden=true;empty.hidden=false;}
if(data.show_announcement&&data.announcement){$("announcement").textContent=data.announcement;$("announcement").hidden=false;}
else $("announcement").hidden=true;
}

function renderSchedule(){
if(!exams.length){$("scheduleList").innerHTML='<div class="empty">ยังไม่มีตารางสอบวันนี้</div>';return;}
$("scheduleList").innerHTML=exams.map((e,i)=>`<div class="exam-row ${i%2?"alt":""}"><div class="exam-subject">${esc(e.subject)}</div><div class="exam-time">${esc(e.start_time)} – ${esc(e.end_time)} น.</div><div class="exam-room">${esc(e.room)}</div></div>`).join("");
}

function renderNextExam(now=new Date()){
const box=$("nextExam"); if(!exams.length){box.textContent="";return;}
const min=nowMinutes(now);
const active=exams.find(e=>min>=parseTime(e.start_time)&&min<parseTime(e.end_time));
if(active){box.innerHTML=`🟢 กำลังสอบ: <b>${esc(active.subject)}</b>`;return;}
const next=exams.filter(e=>parseTime(e.start_time)>min).sort((a,b)=>parseTime(a.start_time)-parseTime(b.start_time))[0];
if(!next){box.textContent="✅ วันนี้สอบเสร็จแล้ว";return;}
const diff=Math.max(0,Math.round(parseTime(next.start_time)-min));
box.innerHTML=`⏳ วิชาถัดไป <b>${esc(next.subject)}</b> ใน ${String(Math.floor(diff/60)).padStart(2,"0")}:${String(diff%60).padStart(2,"0")}`;
}

async function refreshAll(){currentDate=localDateISO();await Promise.all([loadSettings(),loadExams(),loadImage()]);}
async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}}
function openLogin(){$("loginModal").hidden=false;$("loginEmail").focus();}
function closeLogin(){$("loginModal").hidden=true;$("loginStatus").textContent="";}
async function doLogin(){
$("loginStatus").textContent="กำลังเข้าสู่ระบบ...";
const {error}=await sb.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
if(error){$("loginStatus").textContent="❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง";return;}
location.href="admin.html";
}

$("loginBtn").onclick=openLogin;$("closeLogin").onclick=closeLogin;$("doLogin").onclick=doLogin;
$("fullscreenBtn").onclick=fullscreen;$("fullscreenBtn2").onclick=fullscreen;
$("loginPassword").addEventListener("keydown",e=>{if(e.key==="Enter")doLogin();});
setInterval(()=>{$("clock").textContent=new Date().toLocaleTimeString("th-TH",{hour12:false});$("dateText").textContent=thaiDate();renderNextExam();},1000);
setInterval(()=>{if(localDateISO()!==currentDate)refreshAll();},30000);

(async()=>{await refreshAll();sb.channel("exam-display-realtime").on("postgres_changes",{event:"*",schema:"public",table:"exams"},loadExams).on("postgres_changes",{event:"*",schema:"public",table:"display_settings"},()=>{loadSettings();loadImage();}).subscribe();})();
