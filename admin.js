const DEFAULTS={clockSize:110,clockPosition:"right",imageSize:90,imagePosition:"center",showDate:true,showClock:true,showSchedule:true,showImage:true};
const $=id=>document.getElementById(id);let selectedFile=null,settings={...DEFAULTS};
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function setStatus(t){$("status").textContent=t;setTimeout(()=>{if($("status").textContent===t)$("status").textContent=""},5000);}
async function requireUser(){const {data}=await sb.auth.getUser();if(!data.user){location.href="index.html";return null;}$("userInfo").textContent=data.user.email||"";return data.user;}
async function loadSettings(){
const {data}=await sb.from("display_settings").select("*").eq("id",1).maybeSingle();if(data)settings={...DEFAULTS,...data};
$("clockSize").value=settings.clockSize;$("imageSize").value=settings.imageSize;$("clockValue").textContent=settings.clockSize;$("imageValue").textContent=settings.imageSize;
$("clockPosition").value=settings.clockPosition;$("imagePosition").value=settings.imagePosition;$("showDate").value=String(settings.showDate);$("showClock").value=String(settings.showClock);$("showSchedule").value=String(settings.showSchedule);$("showImage").value=String(settings.showImage);
$("announcement").value=settings.announcement||"";$("showAnnouncement").checked=!!settings.show_announcement;
if(settings.image_url)$("previewBox").innerHTML=`<img src="${settings.image_url}" alt="preview">`;
}
async function loadExams(){
const {data,error}=await sb.from("exams").select("*").eq("exam_date",$("examDate").value).order("start_time");if(error){$("examTable").textContent=error.message;return;}
if(!data?.length){$("examTable").innerHTML='<div class="empty">ไม่มีรายการสอบวันนี้</div>';return;}
$("examTable").innerHTML=`<table><thead><tr><th>วิชา</th><th>เวลา</th><th>ห้อง</th><th>แสดง</th><th>จัดการ</th></tr></thead><tbody>${data.map(e=>`<tr><td>${esc(e.subject)}</td><td>${esc(e.start_time)} – ${esc(e.end_time)}</td><td>${esc(e.room)}</td><td>${e.enabled?"✅":"ซ่อน"}</td><td><button class="danger-link" onclick="deleteExam('${e.id}')">ลบ</button></td></tr>`).join("")}</tbody></table>`;
}
window.deleteExam=async id=>{if(!confirm("ลบรายการสอบนี้หรือไม่?"))return;const {error}=await sb.from("exams").delete().eq("id",id);if(error)return setStatus("❌ "+error.message);setStatus("✅ ลบแล้ว");loadExams();};
async function addExam(){
const row={exam_date:$("examDate").value,subject:$("subject").value.trim(),start_time:$("startTime").value,end_time:$("endTime").value,room:$("room").value.trim(),enabled:$("enabled").value==="true"};
if(!row.exam_date||!row.subject||!row.start_time||!row.end_time)return setStatus("❌ กรุณากรอกข้อมูลให้ครบ");
if(row.end_time<=row.start_time)return setStatus("❌ เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
const {error}=await sb.from("exams").insert(row);if(error)return setStatus("❌ "+error.message);$("subject").value="";$("room").value="";setStatus("✅ เพิ่มตารางสอบแล้ว");loadExams();
}
async function saveSettings(){
const row={id:1,clockSize:+$("clockSize").value,clockPosition:$("clockPosition").value,imageSize:+$("imageSize").value,imagePosition:$("imagePosition").value,showDate:$("showDate").value==="true",showClock:$("showClock").value==="true",showSchedule:$("showSchedule").value==="true",showImage:$("showImage").value==="true"};
const {error}=await sb.from("display_settings").upsert(row);setStatus(error?"❌ "+error.message:"✅ บันทึกการตั้งค่าแล้ว");
}
async function saveAnnouncement(){const {error}=await sb.from("display_settings").upsert({id:1,announcement:$("announcement").value.trim(),show_announcement:$("showAnnouncement").checked});setStatus(error?"❌ "+error.message:"✅ บันทึกประกาศแล้ว");}
async function uploadImage(){
if(!selectedFile)return setStatus("❌ กรุณาเลือกรูปก่อน");if(selectedFile.size>10*1024*1024)return setStatus("❌ รูปต้องไม่เกิน 10MB");
setStatus("กำลังอัปโหลด...");const ext=(selectedFile.name.split(".").pop()||"jpg").toLowerCase(),path=`display-${Date.now()}.${ext}`;
const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,selectedFile,{upsert:false,contentType:selectedFile.type});if(error)return setStatus("❌ "+error.message);
const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);const {error:dbError}=await sb.from("display_settings").upsert({id:1,image_url:data.publicUrl});
if(dbError)return setStatus("❌ "+dbError.message);$("previewBox").innerHTML=`<img src="${data.publicUrl}" alt="preview">`;setStatus("✅ อัปโหลดรูปเรียบร้อย");
}
async function removeImage(){const {error}=await sb.from("display_settings").upsert({id:1,image_url:null});setStatus(error?"❌ "+error.message:"✅ ลบรูปจากหน้าจอแล้ว");$("previewBox").textContent="ไม่มีรูป";}
$("examDate").value=today();$("clockSize").oninput=e=>$("clockValue").textContent=e.target.value;$("imageSize").oninput=e=>$("imageValue").textContent=e.target.value;
$("examDate").onchange=loadExams;$("addExam").onclick=addExam;$("saveSettings").onclick=saveSettings;$("saveAnnouncement").onclick=saveAnnouncement;$("uploadImage").onclick=uploadImage;$("removeImage").onclick=removeImage;
$("imageFile").onchange=e=>{selectedFile=e.target.files[0]||null;if(selectedFile){const u=URL.createObjectURL(selectedFile);$("previewBox").innerHTML=`<img src="${u}" alt="preview">`;}};
$("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html";};
(async()=>{const u=await requireUser();if(!u)return;await loadSettings();await loadExams();})();
