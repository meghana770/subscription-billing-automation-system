# Subscription Billing Automation System — Milestone 1

**Infosys Internship Project:** *Creation of Subscription Billing Automation System using Recurring Revenue Model*
**Scope of this repository:** Milestone 1 only (Weeks 1–2) — *Subscription Plans, Customer Models & Billing Cycle Engine*.

Tech stack: Python, FastAPI, PostgreSQL, SQLAlchemy, Celery (+ Redis as the message broker).

---

## 1. What Milestone 1 covers

| # | Requirement from the project document | Where it is implemented |
|---|---|---|
| 1 | PostgreSQL schema for plans, customers, subscriptions, billing_cycles, invoices, payments, audit_logs with enum-typed status fields | `app/models.py`, `database/schema.sql`, `docs/erd.md` |
| 2 | Subscription state machine (trial → active → past_due → cancelled, trial → cancelled) with a timestamp for each state change | `app/state_machine.py`, `app/services/subscription_service.py` |
| 3 | Plan management APIs: create / update / archive, pricing, billing interval (monthly, annual), feature entitlements, trial period | `app/routers/plans.py`, `app/services/plan_service.py` |
| 4 | Customer subscription APIs: create (with trial), change plan, pause, resume, cancel (immediate or end-of-cycle) | `app/routers/subscriptions.py`, `app/services/subscription_service.py` |
| 5 | Celery beat billing cycle scheduler that triggers invoice generation jobs at the correct renewal date | `app/tasks/celery_app.py`, `app/tasks/billing_tasks.py`, `app/services/scheduler_service.py` |

Extra helpers (needed to use and verify the above): customer create/list APIs, billing cycle list, audit log list, a "run scan now" endpoint, tests, seed data.

**Not in Milestone 1 (intentionally not built):** invoice calculation, proration, payment gateway/webhooks, refunds, retry schedule, tax, PDF invoices, React dashboard. The `invoices` and `payments` tables exist (the schema was required), but no logic uses them yet. The invoice job that Celery triggers is a clearly marked hook (`generate_invoice_job`) that Milestone 2 will fill in.

---

## 2. Folder structure

```
subscription-billing-automation/
├── README.md
├── requirements.txt
├── docker-compose.yml        # PostgreSQL + Redis for local use
├── .env.example              # copy to .env
├── .gitignore
├── pytest.ini
├── database/
│   └── schema.sql            # the PostgreSQL schema as plain SQL
├── docs/
│   └── erd.md                # ER diagram + state machine diagram
├── app/
│   ├── main.py               # FastAPI app
│   ├── config.py             # settings (.env)
│   ├── database.py           # DB engine / session
│   ├── enums.py              # enum types
│   ├── models.py             # the 7 tables
│   ├── schemas.py            # request/response shapes
│   ├── state_machine.py      # allowed status changes
│   ├── audit.py              # audit log writer
│   ├── errors.py, utils.py
│   ├── routers/              # plans, customers, subscriptions, billing (+audit)
│   ├── services/             # business logic
│   │   ├── plan_service.py
│   │   ├── customer_service.py
│   │   ├── subscription_service.py
│   │   ├── billing_cycle_service.py
│   │   └── scheduler_service.py   # the billing cycle engine
│   └── tasks/
│       ├── celery_app.py     # Celery + beat schedule
│       └── billing_tasks.py  # scan task + invoice job hook
├── scripts/
│   ├── init_db.py            # creates the tables
│   └── seed_data.py          # sample plans + customers
└── tests/                    # automated tests (no PostgreSQL/Redis needed)
```

---

## 3. Installation (step by step)

### 3.1 Install these first
- **Python 3.10 or newer** (check: `python --version`)
- **Git** (check: `git --version`)
- **Docker Desktop** (easiest way to get PostgreSQL + Redis). If you cannot use Docker, install PostgreSQL 16 and Redis yourself and create a database/user matching `.env.example`.

### 3.2 Set up the project
Open a terminal **inside the project folder**.

```bash
# 1. create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows (cmd / PowerShell)
source venv/bin/activate       # Mac / Linux

# 2. install the libraries
pip install -r requirements.txt

# 3. create your settings file
copy .env.example .env         # Windows
cp .env.example .env           # Mac / Linux
```

### 3.3 Start PostgreSQL and Redis
```bash
docker compose up -d
```
Wait ~10 seconds. (If port 5432 is already used by another PostgreSQL on your PC, change `"5432:5432"` to `"5433:5432"` in `docker-compose.yml` and use `5433` in `DATABASE_URL` inside `.env`.)

### 3.4 Create the tables and sample data
```bash
python -m scripts.init_db
python -m scripts.seed_data      # optional but handy: adds 3 plans + 2 customers
```

---

## 4. Running the project

You need **three terminals** (each with the virtual environment activated, each inside the project folder).

**Terminal 1 — the API**
```bash
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs — this is the interactive API page (Swagger).

**Terminal 2 — Celery worker** (runs the invoice jobs)
```bash
celery -A app.tasks.celery_app:celery_app worker --loglevel=info --pool=solo
```

**Terminal 3 — Celery beat** (the billing cycle scheduler)
```bash
celery -A app.tasks.celery_app:celery_app beat --loglevel=info
```
Beat wakes up every 60 seconds (`BILLING_SCAN_INTERVAL_SECONDS` in `.env`) and sends the `scan_billing_cycles` task to the worker.

Stop anything with `Ctrl + C`. Stop the databases with `docker compose down`.

---

## 5. How to test and verify

### A. Automated tests (fastest — start here)
```bash
pytest -v
```
These tests use a temporary in-memory database, so they do **not** need PostgreSQL or Redis. Expected result: all tests pass (green). They cover the state machine, plan APIs, subscription APIs, the billing scan (trial conversion, monthly/annual renewal, end-of-cycle cancel, pause, scheduled plan change, retry after a failed dispatch) and audit logging.

### B. Manual walkthrough in Swagger (http://127.0.0.1:8000/docs)
Click an endpoint → **Try it out** → paste the body → **Execute**. Use the IDs returned by earlier steps.

1. `POST /plans`
   `{"name": "Pro Monthly", "price": "1499.00", "billing_interval": "monthly", "trial_period_days": 14, "features": {"max_users": 15, "support": "email"}}`
   ✔ status `active`.
   (Skip step 1–2 if you ran the seed script: plan IDs 1–3 and customer IDs 1–2 already exist.)
2. `POST /customers` → `{"name": "Test User", "email": "test@example.com"}`
3. `POST /subscriptions` → `{"customer_id": 1, "plan_id": 1}`
   ✔ `status` is `trial` and `trial_end` is 14 days away.
4. `POST /subscriptions/1/transition` → `{"to_status": "past_due"}`
   ✔ **409 error** "Invalid status change: trial -> past_due" (state machine blocks it).
5. `POST /subscriptions/1/transition` → `{"to_status": "active"}`
   ✔ status `active`, `activated_at` filled in. `GET /billing/cycles` now shows cycle 1.
6. `POST /subscriptions/1/pause` → `is_paused: true`; then `POST /subscriptions/1/resume` → `is_paused: false`.
7. `POST /subscriptions/1/change-plan` → `{"new_plan_id": 2, "effective": "immediate"}` (or `"next_cycle"`).
8. **Test the scheduler without waiting a month:** `POST /billing/run-scan` → `{"as_of": "2027-03-01T00:00:00Z"}` (any date at least two months ahead).
   ✔ `renewals_created: 1` and the new cycle appears in `GET /billing/cycles`.
9. `POST /subscriptions/1/cancel` → `{"timing": "end_of_cycle"}` then `{"timing": "immediate"}` → status `cancelled`.
10. `GET /audit-logs?subscription_id=1` — every step above is recorded here with old/new values.

### C. Live Celery check (beat → worker → database)
1. In `.env` set `BILLING_SCAN_INTERVAL_SECONDS=10`, restart the beat terminal.
2. Make sure the API, worker and beat are all running.
3. In Swagger create a plan with `"trial_period_days": 0`, then create a subscription for it (it starts `active` immediately and gets billing cycle 1).
4. Within ~10 seconds the **worker terminal prints** `Invoice job received: subscription ... cycle 1`.
5. `GET /billing/cycles` shows `invoice_job_triggered_at` filled in, and `GET /audit-logs` shows `billing_cycle.invoice_job_triggered` and `billing_cycle.invoice_job_received`.

### D. Check the database schema
```bash
docker exec -it billing_postgres psql -U billing_user -d billing_db -c "\dt"
docker exec -it billing_postgres psql -U billing_user -d billing_db -c "\dT"
```
`\dt` lists the 7 tables; `\dT` lists the enum types (`subscription_status`, `billing_interval`, ...).

---

## 6. Upload to GitHub

1. On github.com click **New repository**, name it (for example `subscription-billing-automation`), leave it empty (no README/.gitignore), click **Create**. Skip this if your internship repository already exists.
2. In the project folder:
```bash
git init
git add .
git status                      # make sure ".env" and "venv" are NOT listed
git commit -m "Milestone 1: plans, subscription lifecycle, state machine, billing cycle scheduler"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
Copy the exact repository URL from GitHub's green **Code** button.
- First time using git? Run once: `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
- GitHub does not accept your account password in the terminal. A browser sign-in window or a Personal Access Token (GitHub → Settings → Developer settings → Tokens) is used instead.
- If the repository already has files and the push is rejected: `git pull origin main --allow-unrelated-histories`, then `git push -u origin main`.
- Optional: mark the milestone — `git tag milestone-1` then `git push origin milestone-1`.

---

## 7. Design decisions and assumptions

- **Pause/resume is a flag, not a status.** The document lists the status flow as trial → active → past_due → cancelled, so pausing uses `is_paused` / `paused_at` and only works on `active` subscriptions. A paused subscription is skipped by the scheduler; resuming extends the current period by the paused time.
- **Two extra transitions were needed:** `active → cancelled` (the cancel API must work on paying customers) and `past_due → active` (so a customer can recover once payment succeeds). Remove `S.PAST_DUE: {S.ACTIVE, ...}` in `app/state_machine.py` if you want the strictly listed set.
- **Nothing sets `past_due` automatically yet.** That needs payment failures (Milestone 2/3). For now use `POST /subscriptions/{id}/transition`.
- **Trials convert automatically** to `active` when the trial ends (no payment method exists yet), which also opens the first billing cycle.
- **Billing happens at the start of each period.** The scheduler creates a `billing_cycles` row for each new period and triggers one invoice job per cycle. A unique constraint (subscription + period start) and a "job already triggered" timestamp make repeated scans safe.
- **Change plan** swaps the plan immediately or schedules it for the next cycle. Proration (credit for unused time) is Milestone 2.
- **Money** is returned by the API as strings (for example `"499.00"`) to avoid rounding errors.
- **Known limitation:** monthly renewals add one calendar month to the previous period end, so a subscription that started on the 31st can drift to the 28th after February.
