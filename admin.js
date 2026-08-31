const SETTINGS_KEY="exam-display-settings", IMAGE_KEY="exam-display-image";
const defaults={clockSize:110,imageSize:90,imagePosition:"center",showDate:true,showClock:true,clockPosition:"bottom",clockAlign:"center",clockOffset:0,clockFont:"system",dateSize:36,dateOffset:0,slideshowSeconds:8,theme:"midnight"};
const $=id=>document.getElementById(id);
let settings={...defaults},selectedFile=null,previewUrl="",sb=null,schedules=[],scheduleFile=null;

function makeClient(){try{if(window.supabase&&typeof SUPABASE_URL!=="undefined"&&typeof SUPABASE_ANON_KEY!=="undefined")return window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY)}catch(e){console.warn("Supabase client unavailable",e)}return null}
function setAuthState(session){const signedIn=!!session;$("signInForm").hidden=signedIn;$("signOut").hidden=!signedIn;$("adminControls").hidden=!signedIn;$("authStatus").textContent=signedIn?`เข้าสู่ระบบแล้ว: ${session.user.email}`:"กรุณาเข้าสู่ระบบก่อนใช้งานหน้า Admin";$("saveSettings").disabled=!signedIn;$("publish").disabled=!signedIn;if(signedIn)loadSchedules()}
async function signIn(){if(!sb)return setStatus("⚠️ ไม่พบการตั้งค่า Supabase");const email=$("email").value.trim(),password=$("password").value;if(!email||!password)return setStatus("⚠️ กรอกอีเมลและรหัสผ่าน");setStatus("กำลังเข้าสู่ระบบ...");const {error}=await sb.auth.signInWithPassword({email,password});if(error)return setStatus(`⚠️ เข้าสู่ระบบไม่สำเร็จ: ${error.message}`);setStatus("✅ เข้าสู่ระบบแล้ว")}
async function signOut(){if(!sb)return;const {error}=await sb.auth.signOut();setStatus(error?`⚠️ ${error.message}`:"ออกจากระบบแล้ว")}
function localSettings(){try{return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")} }catch{return {...defaults}}}
function setStatus(message){$("status").textContent=message}
function saveLocal(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));if(previewUrl.startsWith("data:"))localStorage.setItem(IMAGE_KEY,previewUrl)}
function setPreviewImage(url){previewUrl=url||"";const image=$("previewImage"),empty=$("previewEmpty");if(url){image.src=url;image.hidden=false;empty.hidden=true}else{image.hidden=true;empty.hidden=false}}
function syncControls(){
  $("clockSize").value=settings.clockSize;$("imageSize").value=settings.imageSize;$("clockOffset").value=settings.clockOffset;$("clockFont").value=settings.clockFont;$("dateSize").value=settings.dateSize;$("dateOffset").value=settings.dateOffset;$("slideshowSeconds").value=settings.slideshowSeconds;$("clockValue").value=settings.clockSize;$("imageValue").value=settings.imageSize;$("clockOffsetValue").value=settings.clockOffset;$("dateSizeValue").value=settings.dateSize;$("dateOffsetValue").value=settings.dateOffset;$("slideshowSecondsValue").value=settings.slideshowSeconds;
  document.querySelectorAll(".toggle").forEach(button=>{const on=!!settings[button.dataset.setting];button.classList.toggle("is-on",on);button.setAttribute("aria-pressed",on);button.querySelector("b").textContent=on?"เปิด":"ปิด"});
  document.querySelectorAll(".choice").forEach(button=>button.classList.toggle("active",settings[button.dataset.group]===button.dataset.value));
  document.querySelectorAll(".theme-choice").forEach(button=>button.classList.toggle("active",settings.theme===button.dataset.theme));
}
function renderPreview(){
  const now=new Date();$("previewDate").textContent=now.toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});$("previewClock").textContent=now.toLocaleTimeString("th-TH",{hour12:false});
  const screen=$("previewScreen"),clock=$("previewClock"),date=$("previewDate"),wrap=$("previewImageWrap");
  screen.className=`preview-screen preview-theme-${settings.theme} clock-${settings.clockPosition} clock-align-${settings.clockAlign}`;clock.style.fontSize=`${Math.max(18,settings.clockSize*.25)}px`;clock.style.transform=`translateY(${settings.clockOffset*.25}px)`;clock.style.fontFamily=fontFamily(settings.clockFont);date.style.fontSize=`${Math.max(9,settings.dateSize*.25)}px`;date.style.transform=`translateY(${(settings.dateOffset||0)*.25}px)`;clock.hidden=!settings.showClock;date.hidden=!settings.showDate;wrap.style.alignItems={top:"flex-start",center:"center",bottom:"flex-end"}[settings.imagePosition];$("previewImage").style.maxWidth=`${settings.imageSize}%`;
}
function fontFamily(font){return {serif:'Georgia,"Times New Roman",serif',mono:'Consolas,"Courier New",monospace',thai:'"Noto Sans Thai",Tahoma,Arial,sans-serif'}[font]||'Arial,"Noto Sans Thai",sans-serif'}
function readSettingsRow(row){if(!row)return;settings={...settings,clockSize:row.clock_size??settings.clockSize,imageSize:row.image_size??settings.imageSize,imagePosition:row.image_position??settings.imagePosition,showDate:row.show_date??settings.showDate,showClock:row.show_clock??settings.showClock,clockPosition:row.clock_position??settings.clockPosition,clockAlign:row.clock_align??row.clock_alignment??settings.clockAlign,clockOffset:row.clock_offset??settings.clockOffset,clockFont:row.clock_font??settings.clockFont,dateSize:row.date_size??settings.dateSize,dateOffset:row.date_offset??settings.dateOffset,slideshowSeconds:row.slideshow_seconds??settings.slideshowSeconds,theme:row.theme??settings.theme};if(row.image_url)setPreviewImage(row.image_url)}
async function load(){settings=localSettings();setPreviewImage(localStorage.getItem(IMAGE_KEY)||"");sb=makeClient();setAuthState(null);if(sb){const {data:{session}}=await sb.auth.getSession();setAuthState(session);sb.auth.onAuthStateChange((_event,session)=>setAuthState(session));try{const {data,error}=await sb.from("display_settings").select("*").eq("id",1).maybeSingle();if(error)console.warn(error.message);else readSettingsRow(data)}catch(e){console.warn(e)}}syncControls();renderPreview()}
async function saveSettings(){saveLocal();if(!sb){setStatus("✅ บันทึกในเบราว์เซอร์แล้ว");return true}try{const row={id:1,clock_size:settings.clockSize,image_size:settings.imageSize,image_position:settings.imagePosition,show_date:settings.showDate,show_clock:settings.showClock,clock_position:settings.clockPosition,clock_align:settings.clockAlign,clock_offset:settings.clockOffset,clock_font:settings.clockFont,date_size:settings.dateSize,date_offset:settings.dateOffset,slideshow_seconds:settings.slideshowSeconds,theme:settings.theme};let {error}=await sb.from("display_settings").upsert(row);if(error&&/clock_align/i.test(error.message)){delete row.clock_align;error=(await sb.from("display_settings").upsert(row)).error}if(error&&/(date_offset|slideshow_seconds)/i.test(error.message)){delete row.date_offset;delete row.slideshow_seconds;error=(await sb.from("display_settings").upsert(row)).error}if(error)throw error;setStatus("✅ บันทึกการตั้งค่าแล้ว");return true}catch(e){setStatus(`⚠️ บันทึกเฉพาะเครื่อง: ${e.message||"เชื่อมต่อ Supabase ไม่ได้"}`);return false}}
async function publish(){await saveSettings();if(!selectedFile){setStatus("✅ เผยแพร่การตั้งค่าแล้ว");return}if(!sb){saveLocal();setStatus("✅ บันทึกรูปในเบราว์เซอร์แล้ว");return}try{setStatus("กำลังปรับขนาดและอัปโหลดรูป...");const resized=await resizeImage(selectedFile);const ext=(selectedFile.name.split(".").pop()||"jpg").toLowerCase()==="png"?"png":"jpg",path=`display-${Date.now()}.${ext}`;const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,resized,{contentType:resized.type,upsert:false});if(error)throw error;const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);const {error:dbError}=await sb.from("display_settings").upsert({id:1,image_url:data.publicUrl});if(dbError)throw dbError;setPreviewImage(data.publicUrl);setStatus("✅ อัปโหลดและเผยแพร่แล้ว")}catch(e){setStatus(`⚠️ เก็บรูปไว้ในเครื่องแล้ว: ${e.message||"อัปโหลดไม่สำเร็จ"}`);saveLocal()}}

// --- Image resize/compress before upload (keeps kiosk boards fast to load) ---
function resizeImage(file,maxWidth=1600,quality=.85){
  return new Promise(resolve=>{
    if(!file.type||!file.type.startsWith("image/")||file.type==="image/svg+xml")return resolve(file);
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      const scale=Math.min(1,maxWidth/img.width);
      const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
      const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      const outType=file.type==="image/png"?"image/png":"image/jpeg";
      canvas.toBlob(blob=>resolve(blob||file),outType,quality);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);resolve(file)};
    img.src=url;
  });
}

// --- Multiple exam-schedule sets: upload, reorder, auto date-range, history ---
function fmtDateTime(iso){try{return new Date(iso).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"})}catch{return iso||""}}
async function loadSchedules(){if(!sb)return;try{const {data,error}=await sb.from("exam_schedules").select("*").order("sort_order",{ascending:true});if(error){console.warn(error.message);return}schedules=data||[];renderScheduleList()}catch(e){console.warn(e)}}
function renderScheduleList(){
  const list=$("scheduleList");if(!list)return;
  if(!schedules.length){list.innerHTML='<p class="hint">ยังไม่มีชุดตารางสอบ — อัปโหลดชุดแรกด้านบนได้เลย</p>';return}
  list.innerHTML="";
  schedules.forEach((row,i)=>{
    const today=new Date().toISOString().slice(0,10);
    const active=(!row.start_date||row.start_date<=today)&&(!row.end_date||row.end_date>=today);
    const item=document.createElement("div");item.className="schedule-item";
    item.innerHTML=`
      <img class="schedule-thumb" src="${row.image_url}" alt="">
      <div class="schedule-info">
        <input class="schedule-title-input" type="text" value="${(row.title||"").replace(/"/g,"&quot;")}" placeholder="ชื่อชุด">
        <div class="schedule-dates">
          <label>เริ่ม<input type="date" class="schedule-start-input" value="${row.start_date||""}"></label>
          <label>ถึง<input type="date" class="schedule-end-input" value="${row.end_date||""}"></label>
        </div>
        <div class="schedule-meta"><span class="schedule-status ${active?"is-active":""}">${active?"● กำลังแสดง":"○ ไม่ได้แสดง (นอกช่วงวันที่)"}</span><span class="hint">อัปโหลดเมื่อ ${fmtDateTime(row.created_at)}${row.created_by?` โดย ${row.created_by}`:""}</span></div>
      </div>
      <div class="schedule-actions">
        <button type="button" class="choice schedule-up" ${i===0?"disabled":""} title="เลื่อนขึ้น">↑</button>
        <button type="button" class="choice schedule-down" ${i===schedules.length-1?"disabled":""} title="เลื่อนลง">↓</button>
        <button type="button" class="secondary schedule-delete" title="ลบชุดนี้">ลบ</button>
      </div>`;
    item.querySelector(".schedule-up").onclick=()=>moveSchedule(row,i,-1);
    item.querySelector(".schedule-down").onclick=()=>moveSchedule(row,i,1);
    item.querySelector(".schedule-delete").onclick=()=>deleteSchedule(row);
    item.querySelector(".schedule-title-input").onchange=e=>updateSchedule(row,{title:e.target.value});
    item.querySelector(".schedule-start-input").onchange=e=>updateSchedule(row,{start_date:e.target.value||null});
    item.querySelector(".schedule-end-input").onchange=e=>updateSchedule(row,{end_date:e.target.value||null});
    list.append(item);
  });
}
async function updateSchedule(row,patch){if(!sb)return;try{const {error}=await sb.from("exam_schedules").update(patch).eq("id",row.id);if(error)throw error;Object.assign(row,patch);renderScheduleList();setStatus("✅ อัปเดตชุดตารางสอบแล้ว")}catch(e){setStatus(`⚠️ อัปเดตไม่สำเร็จ: ${e.message}`)}}
async function moveSchedule(row,index,dir){
  const target=schedules[index+dir];if(!target||!sb)return;
  const a=row.sort_order??index,b=target.sort_order??index+dir;
  try{
    await sb.from("exam_schedules").update({sort_order:b}).eq("id",row.id);
    await sb.from("exam_schedules").update({sort_order:a}).eq("id",target.id);
    row.sort_order=b;target.sort_order=a;
    schedules.sort((x,y)=>(x.sort_order??0)-(y.sort_order??0));
    renderScheduleList();setStatus("✅ ปรับลำดับแล้ว")
  }catch(e){setStatus(`⚠️ ปรับลำดับไม่สำเร็จ: ${e.message}`)}
}
async function deleteSchedule(row){
  if(!sb)return;if(!confirm(`ลบชุด "${row.title||"ไม่มีชื่อ"}" ?`))return;
  try{
    if(row.storage_path)await sb.storage.from(STORAGE_BUCKET).remove([row.storage_path]);
    const {error}=await sb.from("exam_schedules").delete().eq("id",row.id);if(error)throw error;
    schedules=schedules.filter(r=>r.id!==row.id);renderScheduleList();setStatus("✅ ลบชุดตารางสอบแล้ว")
  }catch(e){setStatus(`⚠️ ลบไม่สำเร็จ: ${e.message}`)}
}
async function addSchedule(){
  if(!sb)return setStatus("⚠️ ต้องเข้าสู่ระบบและตั้งค่า Supabase ก่อน");
  if(!scheduleFile)return setStatus("⚠️ เลือกรูปก่อนเพิ่มชุดตารางสอบ");
  try{
    setStatus("กำลังปรับขนาดและอัปโหลดชุดใหม่...");
    const resized=await resizeImage(scheduleFile);
    const ext=(scheduleFile.name.split(".").pop()||"jpg").toLowerCase()==="png"?"png":"jpg",path=`schedule-${Date.now()}.${ext}`;
    const {error:upErr}=await sb.storage.from(STORAGE_BUCKET).upload(path,resized,{contentType:resized.type,upsert:false});
    if(upErr)throw upErr;
    const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const {data:{session}}=await sb.auth.getSession();
    const maxOrder=schedules.reduce((m,r)=>Math.max(m,r.sort_order??0),-1);
    const row={title:$("scheduleTitle").value.trim(),image_url:data.publicUrl,storage_path:path,start_date:$("scheduleStart").value||null,end_date:$("scheduleEnd").value||null,sort_order:maxOrder+1,created_by:session?.user?.email||null};
    const {data:inserted,error:insErr}=await sb.from("exam_schedules").insert(row).select().single();
    if(insErr)throw insErr;
    schedules.push(inserted);renderScheduleList();
    scheduleFile=null;$("scheduleFile").value="";$("scheduleTitle").value="";$("scheduleStart").value="";$("scheduleEnd").value="";
    setStatus("✅ เพิ่มชุดตารางสอบแล้ว")
  }catch(e){setStatus(`⚠️ เพิ่มชุดไม่สำเร็จ: ${e.message||"ลองใหม่อีกครั้ง"}`)}
}

document.querySelectorAll(".toggle").forEach(button=>button.onclick=()=>{settings[button.dataset.setting]=!settings[button.dataset.setting];syncControls();renderPreview()});
document.querySelectorAll(".choice").forEach(button=>button.onclick=()=>{if(!button.dataset.group)return;settings[button.dataset.group]=button.dataset.value;syncControls();renderPreview()});
document.querySelectorAll(".theme-choice").forEach(button=>button.onclick=()=>{settings.theme=button.dataset.theme;syncControls();renderPreview()});
$("clockSize").oninput=e=>{settings.clockSize=+e.target.value;syncControls();renderPreview()};$("imageSize").oninput=e=>{settings.imageSize=+e.target.value;syncControls();renderPreview()};$("clockOffset").oninput=e=>{settings.clockOffset=+e.target.value;syncControls();renderPreview()};$("dateSize").oninput=e=>{settings.dateSize=+e.target.value;syncControls();renderPreview()};$("dateOffset").oninput=e=>{settings.dateOffset=+e.target.value;syncControls();renderPreview()};$("slideshowSeconds").oninput=e=>{settings.slideshowSeconds=+e.target.value;syncControls()};$("clockFont").onchange=e=>{settings.clockFont=e.target.value;renderPreview()};
$("imageFile").onchange=e=>{selectedFile=e.target.files[0]||null;if(!selectedFile)return;const reader=new FileReader();reader.onload=()=>{setPreviewImage(reader.result);renderPreview()};reader.readAsDataURL(selectedFile)};
$("scheduleFile").onchange=e=>{scheduleFile=e.target.files[0]||null};
$("scheduleAdd").onclick=addSchedule;
$("signIn").onclick=signIn;$("signOut").onclick=signOut;$("saveSettings").onclick=saveSettings;$("publish").onclick=publish;setInterval(renderPreview,1000);load();
