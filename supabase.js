// ใส่ค่าจาก Supabase Project Settings > API
const SUPABASE_URL = "https://sqpdfqbdtdcrhbixsmnh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_X-XzZyGXBm9LIKgGwirV0Q_28d0IfXb";

// ชื่อ bucket ที่สร้างใน Supabase Storage
const STORAGE_BUCKET = "exam-images";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ข้อความ error ที่อ่านง่ายขึ้น สำหรับกรณีเชื่อมต่อ Supabase ไม่ได้เลย
// (เช่น TypeError: Failed to fetch) ซึ่งมักเกิดจากเครือข่าย/DNS ไม่ใช่บั๊กในระบบ
function friendlyError(err) {
  const msg = String(err?.message || err || "");
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed") ||
    msg.includes("fetch failed")
  ) {
    return "❌ เชื่อมต่อ Supabase ไม่ได้ — ไม่ใช่บั๊กในระบบ แต่เป็นปัญหาเครือข่าย เช่น เน็ตที่ใช้อยู่บล็อกโดเมน supabase.co, ไม่มีอินเทอร์เน็ต, หรือกำลังเปิดผ่าน in-app browser (เช่น Messenger/LINE) ลองเปิดผ่าน Safari/Chrome ปกติ หรือสลับเครือข่ายแล้วลองใหม่";
  }
  return "❌ " + msg;
}
