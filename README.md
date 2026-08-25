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

## การ Deploy ด้วย CI/CD (Docker Hub + Server)

Pipeline ทำงานเมื่อ **push เข้า `develop`**:

1. **CI** — build Docker image (ตรวจว่า build ผ่าน)
2. **CD** — push image ขึ้น Docker Hub แล้ว SSH deploy บนเซิร์ฟเวอร์

### GitHub Secrets ที่ต้องตั้ง (อ้างอิง vps01 guide)

| Secret | ค่าจริง / ตัวอย่าง |
|---|---|
| `SSH_HOST` | `202.29.231.188` |
| `SSH_PORT` | `22210` |
| `SSH_USER` | `vps01` |
| `SSH_PRIVATE_KEY` | เนื้อไฟล์ private key ของตัวเอง (`~/.ssh/vps01_deploy`) |
| `DOCKERHUB_USERNAME` | username Docker Hub ของคุณ |
| `DOCKERHUB_TOKEN` | Access Token จาก Docker Hub |
| `DEPLOY_PATH` | `/home/vps01/apps/s033-petcheck` |

### เตรียมเซิร์ฟเวอร์ครั้งแรก (vps01)

```bash
# บนเครื่องคุณ — สร้างคีย์แล้ว copy ขึ้นเซิร์ฟเวอร์ (ทำครั้งเดียว)
ssh-keygen -t ed25519 -f ~/.ssh/vps01_deploy -N ""
ssh-copy-id -p 22210 -i ~/.ssh/vps01_deploy.pub vps01@202.29.231.188
# ใส่ password ตามที่ครูแจกครั้งเดียวเท่านั้น — ห้ามใส่ password ใน GitHub Secret

ssh -p 22210 -i ~/.ssh/vps01_deploy vps01@202.29.231.188
mkdir -p ~/apps/s033-petcheck
# สร้างไฟล์ .env ในโฟลเดอร์นั้น (คัดลอกจาก .env.prod.example)
```

หลังตั้ง Secrets แล้ว merge/push เข้า `develop` — CD จะ copy compose ไปที่ `DEPLOY_PATH` แล้ว `pull` + `up -d`

เข้าใช้งาน (พอร์ตตามใบงาน 30100–30199):

- Frontend: `http://202.29.231.188:30133`
- Backend API: `http://202.29.231.188:30134`
- หรือผ่าน nginx: `http://202.29.231.188:30133/api/...`

## Contributors

- CRUD Pet Check Program Team
