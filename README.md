# SorevMaster

Система оценки и подсчета очков в режиме реального времени для соревновательных спортивных мероприятий (боевые виды спорта). Несколько судей оценивают участников с помощью своих мобильных устройств, а главный судья отслеживает совокупные результаты на панели управления в режиме реального времени.

## Tech Stack

- **Frontend**: React 18, Vite, Material-UI, React Router, Socket.io-client, Axios
- **Backend**: FastAPI (Python), WebSockets

## Project Structure

```
sorev-master/
├── backend/          # FastAPI server (main.py, requirements.txt)
├── src/              # React frontend source
│   ├── Pages/        # NewRoundPage, TablePage, MobilePage, NewJudgePage
│   ├── Components/   # Reusable UI components
│   └── api/          # API communication layer
├── dist/             # Built frontend (served by backend)
├── run_server.bat    # Windows launch script
└── Installer/        # Windows installer files
```

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Run the server
python -m uvicorn main:app --reload
```

### Frontend (dev / rebuild only)
```bash
npm install
npm run build
```

## Usage

1. Open the app and enter two competitor names (Blue vs Red) to start a round
2. Judges navigate to `/connect`, enter their name, and are redirected to the mobile scoring interface
3. Use the QR code on the main table view to share the judge connection URL
4. Judges score each competitor per strike type (hand strike, leg strike, throw) — 1–3 points or warning
5. The main judge dashboard (`/table`) shows all judges' live scores and the final result

## Routes

| Route | Description |
|-------|-------------|
| `/` | New round setup |
| `/table` | Main judge dashboard |
| `/connect` | Judge registration |
| `/mobile` | Mobile scoring interface |
