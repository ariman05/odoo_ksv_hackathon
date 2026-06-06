# VendorBridge - procurement & Vendor Management System

VendorBridge is a procurement portal designed to streamline request-for-quotes (RFQs), quotation bidding, side-by-side bid comparisons, multi-step approval workflows, automated Purchase Orders (POs), invoicing, audit logs, and reports.

## Project Architecture

This is a monorepo containing:
- `backend/`: Django + Django REST Framework + SQLite API service.
- `frontend/`: React + Vite + Tailwind CSS + shadcn dashboard interface.

---

## Git Branch Structure

The project maintains the following branching workflow:
1. `main`: Contains the consolidated, fully functioning monorepo (frontend and backend integrated).
2. `frontend`: Focuses strictly on React UI, components, routing, and mockup state.
3. `backend`: Focuses strictly on Django models, REST endpoints, SQLite, and JWT auth logic.

---

## Local Development Setup

### Backend (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Copy `.env.example` from the root to `backend/.env` and adjust settings.
5. Run migrations and start the server:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py runserver
   ```
   The backend API will run on `http://127.0.0.1:8000/`.

---

### Frontend (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` from the root to `frontend/.env` and adjust the API URL if necessary.
4. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend app will run on `http://localhost:5173/`.
