<div align="center">

<img src="https://img.shields.io/badge/FinTrack-Personal%20Finance%20Tracker-6366f1?style=for-the-badge&logo=trending-up&logoColor=white" alt="FinTrack" />

<br/>
<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br/>

**Track expenses · Set budgets · Achieve savings goals · Visualise reports**

[Live Demo](#) · [Report Bug](https://github.com/adonayhaile/finance-tracker/issues) · [Request Feature](https://github.com/adonayhaile/finance-tracker/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Real-time summary cards, income vs expense area chart, spending pie chart |
| 💸 **Transactions** | Full CRUD with category & date filters, pagination |
| 💰 **Budgets** | Per-category spending limits with colour-coded progress bars |
| 🎯 **Savings Goals** | Track contributions toward financial goals, auto-completes at 100% |
| 📈 **Reports** | Yearly bar charts, net savings trend line, savings rate, category breakdowns |
| 🗂️ **Categories** | Custom income & expense categories with colour picker |
| 🔐 **Auth** | JWT-based register / login with protected routes |
| 🗄️ **Adminer** | Built-in database GUI for browsing PostgreSQL data |

---

## 🖼️ Screenshots

> Dashboard · Transactions · Budgets · Savings · Reports

<table>
  <tr>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Transactions</b></td>
    <td align="center"><b>Budgets</b></td>
  </tr>
  <tr>
    <td><img src="https://placehold.co/400x240/6366f1/ffffff?text=Dashboard" /></td>
    <td><img src="https://placehold.co/400x240/10b981/ffffff?text=Transactions" /></td>
    <td><img src="https://placehold.co/400x240/f59e0b/ffffff?text=Budgets" /></td>
  </tr>
  <tr>
    <td align="center"><b>Savings Goals</b></td>
    <td align="center"><b>Reports</b></td>
    <td align="center"><b>Adminer DB</b></td>
  </tr>
  <tr>
    <td><img src="https://placehold.co/400x240/ec4899/ffffff?text=Savings+Goals" /></td>
    <td><img src="https://placehold.co/400x240/8b5cf6/ffffff?text=Reports" /></td>
    <td><img src="https://placehold.co/400x240/14b8a6/ffffff?text=Adminer+GUI" /></td>
  </tr>
</table>

---

## 🏗️ Architecture

```
finace tracker/
├── 📁 client/                  # React 19 + Tailwind CSS v4 (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, AppLayout
│   │   │   └── ui/             # Modal, StatCard, EmptyState, ConfirmDialog
│   │   ├── context/            # AuthContext (JWT state)
│   │   ├── pages/              # Dashboard, Transactions, Budgets, Savings, Reports…
│   │   ├── services/           # Axios API client
│   │   └── utils/              # Currency & date formatters
│   ├── nginx.conf              # Reverse proxy → /api to server container
│   └── Dockerfile              # Multi-stage: Vite build → nginx serve
│
├── 📁 server/                  # Node.js + Express REST API
│   └── src/
│       ├── controllers/        # auth, transactions, budgets, savings, categories, reports
│       ├── db/                 # pg Pool + auto-migration
│       ├── middleware/         # JWT auth, error handler
│       └── routes/             # Express routers
│   └── Dockerfile              # Multi-stage: deps → non-root runner
│
├── docker-compose.yml          # postgres · adminer · server · client
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — only thing you need

### One-command startup

```bash
git clone https://github.com/adonayhaile/finance-tracker.git
cd finance-tracker
docker compose up --build -d
```

That's it. Docker will:
1. Start **PostgreSQL 16** and run migrations automatically
2. Start the **Node.js API** on port `5000`
3. Build & serve the **React app** via nginx on port `3000`
4. Start **Adminer** DB GUI on port `8888`

---

## 🌐 Service URLs

| Service | URL | Credentials |
|---|---|---|
| 🖥️ **React App** | http://localhost:3000 | Register a new account |
| ⚙️ **REST API** | http://localhost:5000/api/health | — |
| 🗄️ **Adminer** | http://localhost:8888 | Server: `postgres` · User: `postgres` · Pass: `postgres` |
| 🐘 **PostgreSQL** | `localhost:5433` | User: `postgres` · Pass: `postgres` · DB: `finance_tracker` |

---

## 🗄️ Database Schema

```
users
 └──< categories
 └──< transactions ──> categories
 └──< budgets      ──> categories
 └──< savings_goals
       └──< savings_contributions
```

6 tables, auto-created on first server startup — no manual migration needed.

---

## 📡 API Reference

<details>
<summary><b>Auth</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account (seeds 10 default categories) |
| `POST` | `/api/auth/login` | Login → returns JWT |
| `GET` | `/api/auth/me` | Get current user |
| `PATCH` | `/api/auth/profile` | Update name / currency |

</details>

<details>
<summary><b>Transactions</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | List with filters: `type`, `category_id`, `start_date`, `end_date`, `limit`, `offset` |
| `POST` | `/api/transactions` | Create transaction |
| `PUT` | `/api/transactions/:id` | Update |
| `DELETE` | `/api/transactions/:id` | Delete |

</details>

<details>
<summary><b>Budgets</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budgets` | List budgets with real-time `spent` amount |
| `POST` | `/api/budgets` | Create budget |
| `PUT` | `/api/budgets/:id` | Update |
| `DELETE` | `/api/budgets/:id` | Delete |

</details>

<details>
<summary><b>Savings Goals</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/savings` | List goals |
| `POST` | `/api/savings` | Create goal |
| `PATCH` | `/api/savings/:id` | Update |
| `DELETE` | `/api/savings/:id` | Delete |
| `POST` | `/api/savings/:id/contribute` | Add contribution (auto-completes goal) |
| `GET` | `/api/savings/:id/contributions` | List contributions |

</details>

<details>
<summary><b>Reports</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/summary` | Total income, expenses, net savings, count |
| `GET` | `/api/reports/monthly?year=2026` | 12-month income vs expenses |
| `GET` | `/api/reports/by-category` | Spending per category |
| `GET` | `/api/reports/daily` | Day-by-day breakdown |

</details>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router v7, Recharts, Lucide React |
| **Backend** | Node.js 20, Express 5, JWT, bcryptjs, Helmet, Morgan |
| **Database** | PostgreSQL 16, `pg` driver |
| **Infrastructure** | Docker, Docker Compose, nginx 1.27 |
| **Dev Tools** | Nodemon, ESLint, Adminer |

---

## 🔧 Development (without Docker)

```bash
# 1. Start only the database
docker compose up postgres adminer -d

# 2. Server
cd server
cp .env.example .env      # already pre-filled
npm install
npm run seed:admin        # creates default admin account(s)
npm run dev               # http://localhost:5000

# 3. Client
cd client
npm install
npm run dev               # http://localhost:5173
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feat/amazing-feature`
3. Commit your changes — `git commit -m 'feat: add amazing feature'`
4. Push to the branch — `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by [adonayhaile](https://github.com/adonayhaile)

⭐ Star this repo if you found it useful!

</div>
