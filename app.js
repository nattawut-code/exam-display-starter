const settingsKey = "exam-display-settings";
const localImageKey = "exam-display-image";
const defaults = {clockSize:110,imageSize:90,imagePosition:"center",showDate:true,showClock:true};

function getSettings(){try{return {...defaults,...JSON.parse(localStorage.getItem(settingsKey)||"{}")}}catch{return defaults}}
function update(){
  const s=getSettings(), now=new Date();
  document.documentElement.style.setProperty("--clock-size",s.clockSize+"px");
  document.documentElement.style.setProperty("--image-size",s.imageSize+"%");
  const pos={center:"center",top:"flex-start",bottom:"flex-end"}[s.imagePosition]||"center";
  document.querySelector(".image-wrap").style.alignItems=pos;
  document.getElementById("clock").style.display=s.showClock?"flex":"none";
  document.getElementById("dateText").parentElement.style.display=s.showDate?"flex":"none";
  document.getElementById("clock").textContent=now.toLocaleTimeString("th-TH",{hour12:false});
  document.getElementById("dateText").textContent=now.toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
}
function loadImage(){
  const url=localStorage.getItem(localImageKey);
  const img=document.getElementById("examImage"), empty=document.getElementById("empty");
  if(url){img.src=url;img.hidden=false;empty.hidden=true}else{img.hidden=true;empty.hidden=false}
}
loadImage(); update(); setInterval(update,1000);
