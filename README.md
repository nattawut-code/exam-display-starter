# Exam Display

หน้าจอแสดงตารางสอบและหน้า Admin สำหรับอัปโหลดรูป พร้อมการซิงก์แบบ Realtime ผ่าน Supabase

## ตั้งค่า Supabase (โปรเจกต์ใหม่)

1. ที่ Supabase Dashboard เปิด **SQL Editor** แล้วรันไฟล์ `schema.sql` ทั้งหมด
   - จะสร้าง `public.display_settings`, เปิด RLS, เปิด Realtime และสร้าง Storage bucket `exam-images` แบบ public
2. ไปที่ **Project Settings → Data API** แล้วให้ schema `public` ถูกเปิดเผยกับ Data API หากโปรเจกต์ใหม่ตั้งเป็น private (การตั้งค่านี้เป็นคนละส่วนกับ RLS)
3. ที่ **Authentication → Users** สร้างผู้ใช้ Admin อย่างน้อยหนึ่งคน และตรวจว่าไม่ได้เปิดให้บุคคลทั่วไปสมัครบัญชี หากไม่ต้องการ
4. เปิด `admin.html` แล้วเข้าสู่ระบบด้วยบัญชี Admin ก่อนกดบันทึกหรือเผยแพร่
5. เปิด `index.html` บนอุปกรณ์ใดก็ได้เพื่อแสดงผล

`supabase.js` มีเฉพาะ Project URL และ Publishable key ที่ปลอดภัยสำหรับฝั่งเบราว์เซอร์เท่านั้น ห้ามใส่ secret key หรือ service_role key ลงในไฟล์นี้

## การทำงาน

- หน้าจอแสดงผลอ่านค่าจาก `display_settings` และรูปจาก `exam-images` ได้แบบสาธารณะ
- ผู้ใช้ที่เข้าสู่ระบบเท่านั้นที่แก้ไขการตั้งค่าหรืออัปโหลดรูปได้
- ใช้แถวเดียว `id = 1` เพื่อให้ทุกหน้าจอเห็นค่าเดียวกัน
