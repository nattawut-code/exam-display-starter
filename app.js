const DEFAULTS={clock_size:110,clock_position:"right",image_size:90,image_position:"center",show_date:true,show_clock:true,show_schedule:true,show_image:true};
let settings={...DEFAULTS}, exams=[], currentDate=localDateISO();
const $=id=>document.getElementById(id);

function localDateISO(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function thaiDate(d=new Date()){return d.toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});}
function parseTime(t){if(!t)return 0;const [h,m]=t.split(":").map(Number);return h*60+m;}
function fmtTime(t){return t?t.slice(0,5):"";}
function nowMinutes(d=new Date()){return d.getHours()*60+d.getMinutes()+d.getSeconds()/60;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function applySettings(){
document.documentElement.style.setProperty("--clock-size",settings.clock_size+"px");
document.documentElement.style.setProperty("--image-size",settings.image_size+"%");
$("clock").style.display=settings.show_clock?"flex":"none";
$("dateText").style.display=settings.show_date?"block":"none";
$("scheduleCard").style.display=settings.show_schedule?"block":"";
$("imageWrap").style.display=settings.show_image?"flex":"none";
$("bottomBar").className="bottom-bar clock-"+(settings.clock_position||"right");
$("imageWrap").className="image-wrap image-"+(settings.image_position||"center");
}

async function loadSettings(){
try{
const {data,error}=await sb.from("display_settings").select("*").eq("id",1).maybeSingle();
if(!error&&data)settings={...DEFAULTS,...data};
else if(error)console.error("loadSettings error:",friendlyError(error));
}catch(err){console.error("loadSettings failed:",friendlyError(err));}
applySettings();
}

async function loadExams(){
try{
const {data,error}=await sb.from("exams").select("*").eq("exam_date",currentDate).eq("enabled",true).order("start_time");
if(error){console.error("loadExams error:",friendlyError(error));return;}
exams=data||[];
renderSchedule();
renderNextExam();
}catch(err){console.error("loadExams failed:",friendlyError(err));}
}

async function loadImage(){
try{
const {data,error}=await sb.from("display_settings").select("image_url,announcement,show_announcement").eq("id",1).maybeSingle();
if(error||!data){if(error)console.error("loadImage error:",friendlyError(error));return;}
const img=$("examImage"),empty=$("empty");
if(data.image_url){img.src=data.image_url;img.hidden=false;empty.hidden=true;}
else{img.hidden=true;empty.hidden=false;}
if(data.show_announcement&&data.announcement){$("announcement").textContent=data.announcement;$("announcement").hidden=false;}
else $("announcement").hidden=true;
}catch(err){console.error("loadImage failed:",friendlyError(err));}
}

function renderSchedule(){
if(!exams.length){$("scheduleList").innerHTML='<div class="empty">ยังไม่มีตารางสอบวันนี้</div>';return;}
$("scheduleList").innerHTML=exams.map((e,i)=>`<div class="exam-row ${i%2?"alt":""}"><div class="exam-subject">${esc(e.subject)}</div><div class="exam-time">${esc(fmtTime(e.start_time))} – ${esc(fmtTime(e.end_time))} น.</div><div class="exam-room">${esc(e.room)}</div></div>`).join("");
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

async function fullscreen(){
try{
if(!document.fullscreenElement){await document.documentElement.requestFullscreen();}
else{await document.exitFullscreen();}
}catch(err){document.body.classList.toggle("pseudo-fullscreen");}
}

// หมายเหตุ: ตัดโค้ด login modal ที่เคยผูกกับ #loginBtn/#loginModal/#loginEmail ฯลฯ ออกแล้ว
// เพราะ element เหล่านี้ไม่มีอยู่ใน index.html อีกต่อไป (admin ไม่ต้องล็อกอินแล้ว)
// ของเดิมทำให้เกิด TypeError ตั้งแต่โหลดหน้า และสคริปต์ทั้งหมดที่ตามมาไม่ทำงานเลย

try{
if($("fullscreenBtn"))$("fullscreenBtn").onclick=fullscreen;
if($("fullscreenBtn2"))$("fullscreenBtn2").onclick=fullscreen;
}catch(err){console.error("bind fullscreen buttons failed:",err);}

setInterval(()=>{$("clock").textContent=new Date().toLocaleTimeString("th-TH",{hour12:false});$("dateText").textContent=thaiDate();renderNextExam();},1000);
setInterval(()=>{if(localDateISO()!==currentDate)refreshAll();},30000);

(async()=>{
await refreshAll();
try{
sb.channel("exam-display-realtime")
.on("postgres_changes",{event:"*",schema:"public",table:"exams"},loadExams)
.on("postgres_changes",{event:"*",schema:"public",table:"display_settings"},()=>{loadSettings();loadImage();})
.subscribe();
}catch(err){console.error("realtime subscribe failed",err);}
})();
