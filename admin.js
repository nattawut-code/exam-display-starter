const DEFAULTS={clock_size:110,clock_position:"right",image_size:90,image_position:"center",show_date:true,show_clock:true,show_schedule:true,show_image:true};
const $=id=>document.getElementById(id);let selectedFile=null,settings={...DEFAULTS};

function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function fmtTime(t){return t?t.slice(0,5):"";}
function setStatus(t){$("status").textContent=t;setTimeout(()=>{if($("status").textContent===t)$("status").textContent=""},5000);}

function initTabs(){
document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>{
document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
document.querySelectorAll(".tab-panel").forEach(p=>p.hidden=true);
btn.classList.add("active");$("panel-"+btn.dataset.tab).hidden=false;
}));
}

async function loadSettings(){
const {data,error}=await sb.from("display_settings").select("*").eq("id",1).maybeSingle();
if(data)settings={...DEFAULTS,...data};
$("clockSize").value=settings.clock_size;
$("imageSize").value=settings.image_size;
$("clockValue").textContent=settings.clock_size;
$("imageValue").textContent=settings.image_size;
$("clockPosition").value=settings.clock_position;
$("imagePosition").value=settings.image_position;
$("showDate").value=String(settings.show_date);
$("showClock").value=String(settings.show_clock);
$("showSchedule").value=String(settings.show_schedule);
$("showImage").value=String(settings.show_image);
$("announcement").value=settings.announcement||"";
$("showAnnouncement").checked=!!settings.show_announcement;
if(settings.image_url)$("previewBox").innerHTML=`<img src="${settings.image_url}" alt="preview">`;
if(error)setStatus("⚠️ โหลดการตั้งค่าไม่ได้: "+error.message);
}

async function loadExams(){
const {data,error}=await sb.from("exams").select("*").eq("exam_date",$("examDate").value).order("start_time");
if(error){$("examTable").textContent=error.message;return;}
if(!data?.length){$("examTable").innerHTML='<div class="empty">ไม่มีรายการสอบวันนี้</div>';return;}
$("examTable").innerHTML=`<table><thead><tr><th>วิชา</th><th>เวลา</th><th>ห้อง</th><th>แสดง</th><th>จัดการ</th></tr></thead><tbody>${data.map(e=>`<tr><td>${esc(e.subject)}</td><td>${esc(fmtTime(e.start_time))} – ${esc(fmtTime(e.end_time))}</td><td>${esc(e.room)}</td><td>${e.enabled?"✅":"ซ่อน"}</td><td><button class="danger-link" onclick="deleteExam('${e.id}')">ลบ</button></td></tr>`).join("")}</tbody></table>`;
}

window.deleteExam=async id=>{
if(!confirm("ลบรายการสอบนี้หรือไม่?"))return;
const {error}=await sb.from("exams").delete().eq("id",id);
if(error)return setStatus("❌ "+error.message);
setStatus("✅ ลบแล้ว");loadExams();
};

async function addExam(){
const row={exam_date:$("examDate").value,subject:$("subject").value.trim(),start_time:$("startTime").value,end_time:$("endTime").value,room:$("room").value.trim(),enabled:$("enabled").value==="true"};
if(!row.exam_date||!row.subject||!row.start_time||!row.end_time)return setStatus("❌ กรุณากรอกข้อมูลให้ครบ");
if(row.end_time<=row.start_time)return setStatus("❌ เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
const {error}=await sb.from("exams").insert(row);
if(error)return setStatus("❌ "+error.message);
$("subject").value="";$("room").value="";
setStatus("✅ เพิ่มตารางสอบแล้ว");loadExams();
}

async function saveSettings(){
const row={id:1,clock_size:+$("clockSize").value,clock_position:$("clockPosition").value,image_size:+$("imageSize").value,image_position:$("imagePosition").value,show_date:$("showDate").value==="true",show_clock:$("showClock").value==="true",show_schedule:$("showSchedule").value==="true",show_image:$("showImage").value==="true"};
const {error}=await sb.from("display_settings").upsert(row);
setStatus(error?"❌ "+error.message:"✅ บันทึกการตั้งค่าแล้ว");
}

async function saveAnnouncement(){
const {error}=await sb.from("display_settings").upsert({id:1,announcement:$("announcement").value.trim(),show_announcement:$("showAnnouncement").checked});
setStatus(error?"❌ "+error.message:"✅ บันทึกประกาศแล้ว");
}

async function uploadImage(){
if(!selectedFile)return setStatus("❌ กรุณาเลือกรูปก่อน");
if(selectedFile.size>10*1024*1024)return setStatus("❌ รูปต้องไม่เกิน 10MB");
setStatus("กำลังอัปโหลด...");
const ext=(selectedFile.name.split(".").pop()||"jpg").toLowerCase();
const path=`display-${Date.now()}.${ext}`;
const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,selectedFile,{upsert:false,contentType:selectedFile.type});
if(error)return setStatus("❌ "+error.message);
const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
const {error:dbError}=await sb.from("display_settings").upsert({id:1,image_url:data.publicUrl});
if(dbError)return setStatus("❌ "+dbError.message);
settings.image_url=data.publicUrl;
$("previewBox").innerHTML=`<img src="${data.publicUrl}" alt="preview">`;
setStatus("✅ อัปโหลดรูปเรียบร้อย");
}

async function removeImage(){
const {error}=await sb.from("display_settings").upsert({id:1,image_url:null});
if(error)return setStatus("❌ "+error.message);
settings.image_url=null;
setStatus("✅ ลบรูปจากหน้าจอแล้ว");
$("previewBox").textContent="ไม่มีรูป";
}

initTabs();
$("examDate").value=today();
$("clockSize").oninput=e=>$("clockValue").textContent=e.target.value;
$("imageSize").oninput=e=>$("imageValue").textContent=e.target.value;
$("examDate").onchange=loadExams;
$("addExam").onclick=addExam;
$("saveSettings").onclick=saveSettings;
$("saveAnnouncement").onclick=saveAnnouncement;
$("uploadImage").onclick=uploadImage;
$("removeImage").onclick=removeImage;
$("imageFile").onchange=e=>{
selectedFile=e.target.files[0]||null;
if(selectedFile){
const u=URL.createObjectURL(selectedFile);
$("previewBox").innerHTML=`<img src="${u}" alt="preview">`;
}
};
$("logoutBtn").onclick=()=>location.href="index.html";

(async()=>{
await loadSettings();
await loadExams();
})();
