const settingsKey="exam-display-settings", imageKey="exam-display-image";
const defaults={clockSize:110,imageSize:90,imagePosition:"center",showDate:true,showClock:true};
const $=id=>document.getElementById(id);
let selectedDataUrl=null;

function load(){
  const s={...defaults,...JSON.parse(localStorage.getItem(settingsKey)||"{}")};
  $("clockSize").value=s.clockSize;$("imageSize").value=s.imageSize;
  $("clockValue").textContent=s.clockSize;$("imageValue").textContent=s.imageSize;
  $("imagePosition").value=s.imagePosition;$("showDate").value=String(s.showDate);$("showClock").value=String(s.showClock);
}
function save(){
  const s={clockSize:+$("clockSize").value,imageSize:+$("imageSize").value,imagePosition:$("imagePosition").value,showDate:$("showDate").value==="true",showClock:$("showClock").value==="true"};
  localStorage.setItem(settingsKey,JSON.stringify(s));
  $("status").textContent="✅ บันทึกการตั้งค่าแล้ว";
}
$("clockSize").oninput=e=>$("clockValue").textContent=e.target.value;
$("imageSize").oninput=e=>$("imageValue").textContent=e.target.value;
$("imageFile").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  const r=new FileReader();
  r.onload=()=>{selectedDataUrl=r.result;$("previewBox").innerHTML=`<img src="${selectedDataUrl}" alt="preview">`};
  r.readAsDataURL(file);
};
$("saveSettings").onclick=save;
$("publish").onclick=()=>{
  if(selectedDataUrl)localStorage.setItem(imageKey,selectedDataUrl);
  save();
  $("status").textContent="✅ เผยแพร่แล้ว (เวอร์ชันทดสอบบนเครื่องนี้)";
};
load();
