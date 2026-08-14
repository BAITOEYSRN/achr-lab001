# รายงานสะท้อนผล (Reflection Report)

**โปรเจกต์**: CLI Task Manager & Focus Timer  
**วันที่**: 2026-08-14  
**เครื่องมือ**: Spec Kit + Cursor Agent

---

## 1. Architectural Guardrails — ADR 0001 จำกัด agent อย่างไรตอน implement?

ADR 0001 เป็น **ข้อจำกัดเชิงสถาปัตยกรรมที่มีผลผูกพัน (binding)** ไม่ใช่คำแนะนำทั่วไป — agent ต้องทำตามตั้งแต่ specify จนถึง implement

### สิ่งที่ ADR 0001 บังคับ

| ข้อกำหนด | รายละเอียด |
|----------|------------|
| **ที่เก็บข้อมูล** | ไฟล์ JSON บน filesystem ของผู้ใช้ (`~/.cli-task-manager/tasks.json`) |
| **สิ่งที่ห้าม** | SQLite, in-memory-only สำหรับ production tasks |
| **Schema** | `id`, `title`, `completed`, `createdAt` |

### ชั้นที่ agent ถูกจำกัด (Guardrail Layers)

```text
ADR 0001 (adr/0001-persist-tasks-to-local-json.md)
    ↓ อ้างอิงใน
Constitution Principle II (Local JSON Persistence)
    ↓ ไหลลงใน
spec.md (FR-006) → plan.md (Technical Context) → contracts/cli-commands.md
    ↓ แตกเป็น
tasks.md (T009 taskStore, T028 ห้าม forbidden deps)
    ↓ ตรวจโดย
/speckit-implement + fitness function (check-persistence-adr.ps1)
```

### ผลต่อการ implement จริง

1. **เลือก tech stack ไม่ได้อิสระ** — ใน `/speckit-plan` ระบุชัดว่าใช้ `fs.readFileSync` / `fs.writeFileSync` และห้าม `better-sqlite3`, `sequelize`
2. **โครงสร้างโค้ดถูกกำหนด** — persistence รวมศูนย์ที่ `src/storage/taskStore.ts` เท่านั้น ไม่สร้าง repository แยกที่ใช้ DB
3. **Agent ไม่สามารถ “เพิ่ม SQLite เพราะเร็วกว่า”** — constitution ระบุว่า ADR ที่ Accepted มีผลเหนือ plan/spec/tasks ที่ขัดกัน
4. **Contract เป็นเกณฑ์ตรวจ** — `contracts/cli-commands.md` มีส่วน Forbidden dependencies และ test matrix สำหรับ persistence

### ตัวอย่างในโค้ดที่ implement แล้ว

- `src/storage/taskStore.ts` — อ่าน/เขียน JSON ด้วย sync I/O
- `src/lib/paths.ts` — resolve path ไปที่ `~/.cli-task-manager/tasks.json`
- `package.json` — มีแค่ `commander` ไม่มี database driver

**สรุป**: ADR 0001 ทำหน้าที่เป็น **rail ทางเดียว** สำหรับ persistence — agent implement ได้เฉพาะในกรอบ JSON + local file ไม่ใช่เลือก storage เองตามใจ

---

## 2. Closed-Loop Correction — `/speckit-converge` พบ drift ไหม?

### รอบแรก (หลัง implement ครบ 28 tasks)

พบ **4 findings (partial)** และ append เป็น Phase 8: Convergence (T029–T032):

| ID | ปัญหา | ความรุนแรง |
|----|-------|------------|
| F1 | focus test ไม่ได้ทดสอบ default 1500 วินาที | HIGH |
| F2 | SIGINT cancellation ไม่ได้ทดสอบผ่าน handler จริง | MEDIUM |
| F3 | ข้อความ error ตอน complete ไม่มี id | LOW |
| F4 | add command ไม่ได้ทดสอบ corrupt JSON store | LOW |

นี่คือ **drift เล็กน้อย** — ฟีเจอร์หลักทำงานแล้ว แต่ test coverage และข้อความ error ยังไม่ครบตาม contract/spec

### รอบที่สอง (หลัง `/speckit-implement` Phase 8)

**✅ Converged — 0 findings**

| ตัวชี้วัด | ผล |
|----------|-----|
| FR-001 ถึง FR-011 | ครบ |
| US1–US4 acceptance scenarios | ครบ |
| Constitution I–V | ผ่าน |
| Tasks T001–T032 | ครบทั้งหมด |
| Tests | 17/17 ผ่าน |

`tasks.md` **ไม่ถูก append เพิ่ม** (ไม่มี Phase 9) — แปลว่า closed-loop ทำงาน: converge ตรวจ → implement แก้ → converge ยืนยันสะอาด

### วงจร Closed-Loop

```text
/speckit-implement  →  โค้ด + tests
        ↓
/speckit-converge   →  เปรียบเทียบ spec/plan/tasks กับโค้ดจริง
        ↓
   [drift?]  →  append tasks → /speckit-implement อีกรอบ
        ↓
   [clean]   →  converged — พร้อม review/PR
```

**สรุป**: รอบแรกพบ drift 4 จุด (test/error polish) รอบสอง **converged clean — 0 findings**

---

## 3. Human-in-the-Loop Governance — Decision Guardian ช่วย reviewer บน PR อย่างไร?

**Decision Guardian** คือชั้น **มนุษย์เป็นผู้ตัดสินใจสุดท้าย** ที่ตรวจว่าโค้ดจาก AI ไม่หลุดจาก architectural decisions ที่องค์กร/โปรเจกต์ยอมรับแล้ว

Agent สร้างโค้ดได้เร็ว แต่ **ไม่ใช่ authority สูงสุด** — reviewer ใช้ artifact ที่เป็น “กฎ” เป็นตารางตรวจ

### สิ่งที่ reviewer ใช้ตรวจ (Guardian Checklist)

| แหล่ง | บทบาทต่อ reviewer |
|-------|-------------------|
| **Constitution** | หลักการ MUST/SHOULD — ผิด = reject หรือขอ ADR ใหม่ |
| **ADR 0001** | ตัดสินเรื่อง persistence — ห้าม merge ถ้าเปลี่ยนเป็น SQLite โดยไม่มี ADR supersede |
| **spec.md / plan.md** | ขอบเขตฟีเจอร์ — ห้าม scope creep (web UI, cloud sync) |
| **contracts/** | ข้อความ CLI, exit code, forbidden deps |
| **tasks.md + converge report** | งานครบหรือยัง มี drift ค้างไหม |
| **Fitness function** | ตรวจอัตโนมัติก่อนมนุษย์อ่าน diff |

### บทบาทของ Decision Guardian บน PR

1. **ไม่ต้องเดา intent ของ agent** — เปิด constitution + ADR แล้วถาม “PR นี้ขัด MUST ไหม?”
2. **จับ architectural drift ที่ AI แอบแนะ** — เช่น agent เสนอ ORM เพราะ “best practice” แต่ ADR 0001 ห้าม
3. **ยืนยัน converge ผ่านจริง** — ดูว่า `/speckit-converge` รายงาน 0 findings หรือมี Phase Convergence ค้าง
4. **อนุมัติ exception อย่างมีเอกสาร** — ถ้าต้องเปลี่ยน persistence ต้องมี ADR ใหม่ + แก้ constitution ไม่ใช่แค่ comment ใน PR
5. **แยก “โค้ดรันได้” กับ “โค้ดถูกต้องตาม governance”** — tests ผ่านไม่พอ ถ้าขัด ADR ก็ไม่ merge

### ตัวอย่างคำถามที่ reviewer (Decision Guardian) ถามบน PR นี้

- `package.json` มี database driver ไหม?
- `taskStore.ts` ยังใช้ JSON + sync fs ไหม?
- มีฟีเจอร์นอก spec (sync, custom timer) ไหม?
- Critical-path tests (add, complete, focus) ครบไหม?
- Converge report เป็น clean ไหม?

**สรุป**: Decision Guardian คือ **คนที่ hold กุญแจ merge** โดยอ้างอิง constitution + ADR เป็นกฎหมายสูงสุด — agent กับ converge ช่วยลดภาระตรวจ แต่มนุษย์ยังเป็นผู้รับผิดชอบการตัดสินใจเชิงสถาปัตยกรรม

---

## 4. Fitness Function — `scripts/check-persistence-adr.ps1`

Fitness function คือ **การตรวจสุขภาพของ architecture แบบอัตโนมัติ** ที่รันได้ทุกครั้ง (local, CI, pre-merge) เพื่อยืนยันว่า ADR 0001 ยังไม่ถูกละเมิด

### ทำไมต้องมี (เมื่อเทียบกับ converge)

| เครื่องมือ | จุดประสงค์ | ความถี่ |
|------------|-----------|---------|
| `/speckit-converge` | เปรียบเทียบ spec/plan/tasks กับโค้ดทั้ง feature | หลัง implement / ก่อนปิดงาน |
| `check-persistence-adr.ps1` | ตรวจกฎ ADR 0001 แบบแคบ รวดเร็ว ทำซ้ำได้ | ทุก commit / CI / pre-PR |

Converge กว้างและใช้ LLM — fitness function **แคบ แต่ deterministic**

### สิ่งที่สคริปต์ตรวจ

```powershell
# รันจาก root โปรเจกต์
powershell -ExecutionPolicy Bypass -File scripts/check-persistence-adr.ps1
```

| การตรวจ | เงื่อนไขผ่าน | ถ้า fail |
|---------|-------------|---------|
| **Forbidden deps** | `package.json` ไม่มี `sqlite3`, `better-sqlite3`, `sequelize` | exit 1 |
| **Sync JSON I/O** | `taskStore.ts` มี `readFileSync` และ `writeFileSync` | exit 1 |
| **Store path** | `paths.ts` อ้างอิง `cli-task-manager` | exit 1 |
| **No forbidden libs in store** | `taskStore.ts` ไม่ mention sqlite/sequelize | exit 1 |

### ตำแหน่งในวงจร governance

```text
Agent implement
    → npm test (พฤติกรรม)
    → check-persistence-adr.ps1 (สถาปัตยกรรม ADR 0001)
    → /speckit-converge (ความครบของ spec)
    → Human reviewer (Decision Guardian)
    → Merge
```

### ตัวอย่างผลลัพธ์

**ผ่าน:**

```text
ADR 0001 fitness check PASSED — local JSON persistence guardrails intact.
```

**ไม่ผ่าน (ตัวอย่าง):**

```text
ADR 0001 fitness check FAILED:
  - Forbidden dependency found in package.json: better-sqlite3 (ADR 0001)
```

### ข้อจำกัดของ fitness function

- ตรวจ **pattern ในไฟล์** ไม่ได้พิสูจน์พฤติกรรม runtime ทั้งหมด
- ไม่แทน unit/integration tests
- ไม่แทน human review สำหรับ scope/YAGNI

ใช้ร่วมกับ tests + converge + Decision Guardian จึงครบวงจร

---

## สรุปภาพรวม

| มิติ | บทบาท | ผลในโปรเจกต์นี้ |
|------|--------|------------------|
| **Architectural Guardrails** | ADR + Constitution จำกัด agent ตั้งแต่ plan → implement | JSON-only persistence, ห้าม SQLite |
| **Closed-Loop Correction** | `/speckit-converge` หา drift แล้ว append tasks | รอบ 1: 4 findings → รอบ 2: **0 findings (clean)** |
| **Human-in-the-Loop** | Decision Guardian ใช้ constitution/ADR ตรวจ PR | มนุษย์ merge เมื่อ governance ผ่าน |
| **Fitness Function** | `check-persistence-adr.ps1` ตรวจ ADR 0001 อัตโนมัติ | รันใน CI/local ก่อน review |

```text
[ADR 0001 + Constitution]  ← กฎ (Guardrails)
         ↓
[Spec Kit workflow]        ← Agent ทำงานในกรอบ
         ↓
[Fitness Function + Tests] ← ตรวจอัตโนมัติ
         ↓
[/speckit-converge]        ← ตรวจความครบ (closed-loop)
         ↓
[Decision Guardian / PR]   ← มนุษย์ตัดสินใจสุดท้าย
```
