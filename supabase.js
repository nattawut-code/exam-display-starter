// ใส่ค่าจาก Supabase Project Settings > API
const SUPABASE_URL = "https://sqpdfqbdtdcrhbixsmnh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_X-XzZyGXBm9LIKgGwirV0Q_28d0IfXb";

// ชื่อ bucket ที่สร้างใน Supabase Storage
const STORAGE_BUCKET = "exam-images";

// สร้าง client จริง ๆ (ไฟล์เดิมขาดบรรทัดนี้ไป ทำให้ sb เป็น undefined
// และทุกฟังก์ชันที่เรียก sb.from() / sb.auth / sb.storage พังหมด — นี่คือสาเหตุที่ล็อกอินใช้ไม่ได้)
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
