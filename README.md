# CRUD Pet Check Program

CRUD Pet Check Program คือแอปพลิเคชันจัดการข้อมูลสัตว์เลี้ยงแบบเต็มสแต็กที่ประกอบด้วย Frontend ด้วย Vue 3 และ Backend ด้วย Node.js/Express พร้อมฐานข้อมูล PostgreSQL โดยมีฟีเจอร์พื้นฐานดังนี้

- สมัครสมาชิกและเข้าสู่ระบบด้วย JWT
- จัดการข้อมูลสัตว์เลี้ยง (สร้าง แก้ไข ดู ลบ)
- แสดงสถานะความพร้อมจำหน่ายของสัตว์เลี้ยง
- รองรับการรันผ่าน Docker Compose

## เทคโนโลยีที่ใช้

- Frontend: Vue 3, Vite, Vue Router
- Backend: Node.js, Express.js, Sequelize, PostgreSQL
- Authentication: JWT + Refresh Token + bcrypt
- Container: Docker, Docker Compose

## โครงสร้างโปรเจกต์

```text
CRUD-Pet_Check_Program/
├── Backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── router/
│   │   ├── services/
│   │   └── views/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## ข้อกำหนดเบื้องต้น

- Node.js 18+ 
- npm หรือ pnpm
- Docker และ Docker Compose (ถ้าต้องการรันแบบ Container)
- PostgreSQL (ถ้าต้องการรัน Backend แบบ local โดยตรง)

## การติดตั้งและรันแบบ Local

### 1) Clone โปรเจกต์

```bash
git clone <repository-url>
cd CRUD-Pet_Check_Program
```

### 2) ตั้งค่า Backend

```bash
cd Backend
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ Backend ด้วยค่าเช่นนี้

```env
PORT=5000
DB_NAME=petcheckdb
DB_USER=postgres
DB_PASSWORD=Your_Password
DB_HOST=localhost
DB_PORT=5432
```

ถ้าต้องการให้ PostgreSQL รันผ่าน Docker ก่อน:

```bash
cd ..
docker compose up -d postgres-db
```

จากนั้นรัน Backend

```bash
cd Backend
npm run dev
```

Backend จะรันที่:

```text
http://localhost:5000
```

### 3) ตั้งค่า Frontend

```bash
cd ../Frontend
npm install
npm run dev
```

Frontend จะรันที่:

```text
http://localhost:5173
```

## การรันด้วย Docker Compose

จากโฟลเดอร์หลัก:

```bash
docker compose up --build
```

บริการที่รันจะมีดังนี้

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432

## API Overview

### Authentication

- POST `/api/auth/register` สมัครสมาชิก
- POST `/api/auth/login` เข้าสู่ระบบ
- POST `/api/auth/refresh` ต่ออายุ Access Token
- POST `/api/auth/logout` ออกจากระบบ

### Pets

- GET `/api/pets` ดูรายการสัตว์เลี้ยงทั้งหมด
- GET `/api/pets/:id` ดูข้อมูลสัตว์เลี้ยงแบบเจาะจง
- POST `/api/pets` สร้างสัตว์เลี้ยงใหม่
- PUT `/api/pets/:id` แก้ไขข้อมูลสัตว์เลี้ยง
- DELETE `/api/pets/:id` ลบข้อมูลสัตว์เลี้ยง

## ฐานข้อมูล

โปรเจกต์ใช้ Sequelize เชื่อมต่อกับ PostgreSQL โดยจะทำการ sync ตารางอัตโนมัติเมื่อ Backend เริ่มทำงาน

## หมายเหตุ

- ตัวแอป Frontend จะเรียก Backend ที่ `http://localhost:5000`
- หากต้องการเปลี่ยน Endpoint สามารถแก้ไขไฟล์ใน `Frontend/src/services/auth.js`
- ค่าตั้งต้นสำหรับ Docker Compose ถูกกำหนดไว้ในไฟล์ `docker-compose.yml`

## Contributors

- CRUD Pet Check Program Team
