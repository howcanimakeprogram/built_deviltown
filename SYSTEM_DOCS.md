# Devil Town Running Coach - 시스템 전체 문서

## 📚 목차
1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [설치 및 설정](#설치-및-설정)
4. [사용 방법](#사용-방법)
5. [API 문서](#api-문서)
6. [페르소나 커스터마이징](#페르소나-커스터마이징)
7. [트러블슈팅](#트러블슈팅)
8. [유지보수](#유지보수)

---

## 시스템 개요

### 프로젝트 목적
Devil Town 웹사이트에 통합된 AI 러닝 코치로, 사용자에게 거친 욕설과 팩트 폭격을 통해 동기부여를 제공합니다.

### 핵심 기능
- 💬 **실시간 채팅**: 대화 히스토리를 유지하며 자연스러운 대화
- 🎭 **페르소나**: "매미킴 맛 찐친" 스타일의 욕쟁이 코치
- 🎨 **아스키 아트**: 재미있는 이모티콘으로 응답 강화
- 🏃 **전문 조언**: 러닝 자세, 장비, 부상 관리 등 실용적 정보

### 기술 스택
```
Frontend: HTML5 + CSS3 + Vanilla JavaScript
Backend: Python 3.8+ (FastAPI)
AI: Google Gemini 2.0 Flash
Server: Uvicorn (ASGI)
OS: macOS (Main Dev) & Windows 10 Home (Production Server)
```

---

## 아키텍처

### 시스템 구조도
```mermaid
graph TD
    User([User]) -->|HTTPS Request| CF[Cloudflare Edge]
    CF -->|Encrypted Tunnel| Tunnel["Cloudflared (Home Server)"]
    Tunnel -->|Forward Request| FastAPI["FastAPI Backend (Port 8000)"]
    
    subgraph "Home Server Infrastructure"
        Tunnel
        FastAPI
        Static["Static Files (HTML/CSS/JS)"]
        Logic["Business Logic"]
    end
    
    FastAPI -->|Serve| Static
    FastAPI -->|Process| Logic
    Logic -->|API Call| Gemini[Google Gemini API]
```

### 서버 인프라 상세 정보

| 역할 | 기기 | OS | 사양 | 위치 | 프로젝트 경로 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **운영 (Production)** | 윈도우 미니 PC | Windows 10 Home | Intel Pentium G4600 / 16GB RAM | 홈 서버 | `D:\DEVILTOWN` |
| **개발 (Development)** | 맥북 프로 | macOS | M-Series / 16GB+ RAM | 로컬 개발 | `/Users/chaehyeonbyeongsin/Desktop/코딩/데빌타운 웹사이트` |

### 데이터 흐름
1. **사용자 입력** → `coachInput` 필드에 메시지 입력
2. **프론트엔드** → `devil_coach_chat.js`가 `/chat`으로 POST 요청
3. **백엔드** → `main.py`가 요청 수신 및 검증
4. **AI 처리** → Gemini API에 시스템 프롬프트 + 히스토리 + 메시지 전달
5. **응답 생성** → AI가 페르소나에 맞는 응답 생성
6. **프론트엔드** → 응답을 채팅창에 표시

---

## 설치 및 설정

### 1. 시스템 요구사항
- Python 3.8 이상
- pip (Python 패키지 관리자)
- 인터넷 연결 (Gemini API 호출용)
- Google Gemini API 키

### 2. 프로젝트 경로 및 설치

**Environment 1: macOS (Development)**
```bash
cd "/Users/chaehyeonbyeongsin/Desktop/코딩/데빌타운 웹사이트"
pip install -r requirements.txt
```

**Environment 2: Windows (Production Server)**
```powershell
cd "D:\DEVILTOWN"
pip install -r requirements.txt
# 또는 PowerShell 스크립트 실행
# .\setup_env.ps1
```

**설치되는 패키지**:
- `fastapi==0.104.1`: 웹 프레임워크
- `uvicorn==0.24.0`: ASGI 서버
- `google-generativeai==0.3.1`: Gemini API 클라이언트
- `python-dotenv==1.0.0`: 환경 변수 관리

### 3. API 키 설정
`.env` 파일을 생성하고 Google Gemini API 키를 입력하세요:
```env
GOOGLE_API_KEY=your_actual_api_key_here
```

API 키는 [Google AI Studio](https://aistudio.google.com/)에서 발급받을 수 있습니다.

> ⚠️ **보안 주의**: `.env` 파일은 절대 Git에 커밋하지 마세요!

### 4. 서버 실행 방법

**macOS (Terminal)**:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Windows (PowerShell)**:
```powershell
# 가상환경 활성화 (Optional)
.\venv\Scripts\Activate

# 서버 실행
python main.py
# 또는
uvicorn main:app --host 0.0.0.0 --port 8000
```

**실행 확인**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 5. 자동 실행 설정 (Windows)
PC가 켜질 때 서버를 자동으로 시작하려면 다음 단계를 수행하세요:

1. PowerShell을 관리자 권한으로 실행합니다.
2. 다음 명령어를 입력하여 자동 실행을 등록합니다:
   ```powershell
   cd "D:\DEVILTOWN"
   powershell -ExecutionPolicy Bypass -File setup_autostart.ps1
   ```
3. 이제 로그인 시 `start_server.bat`가 자동으로 실행됩니다.

---

## 사용 방법

### 웹 인터페이스 접속
1. 브라우저에서 `https://www.welcometodeviltown.com` 접속 (또는 로컬 `http://127.0.0.1:8000`)
2. 우측 상단 **MENU** 버튼 클릭
3. **Devil Coach (AI)** 선택

### SKULL Dice 게임
1. 메인 화면의 **ROLL THE SKULL DICE** 버튼 클릭
2. 버튼 하단에서 주사위 애니메이션과 결과 확인
3. AI 코치가 거리에 따른 맞춤형 코멘트 제공

### 채팅 시작
- 입력창에 메시지 입력
- **Enter** 키 또는 **보내기** 버튼 클릭
- AI 응답 대기 (보통 2-5초)

---

## API 문서

### POST /chat

**Endpoint**: `/chat`

**Request Body**:
```json
{
  "message": "오늘 춥네, 뛰기 싫은데?",
  "history": [
    {
      "role": "user",
      "content": "안녕"
    },
    {
      "role": "assistant",
      "content": "야 새끼야, 뭐 물어볼 거 있냐?"
    }
  ]
}
```

**Response**:
```json
{
  "response": "쫄? ಠ_ಠ 날도 좋은데 쫄았네 쉐끼. 걍 뛰면 몸에서 용암 나옴ㅋㅋㅋ"
}
```

### POST /dice-comment

**Endpoint**: `/dice-comment`

**Request Body**:
```json
{
  "distance": "30km LSD"
}
```

**Response**:
```json
{
  "comment": "지옥주 시작이다! 30km LSD 실시! 토나올 때까지!"
}
```

---

## 트러블슈팅

### 문제 1: "API Key not configured" 에러
**원인**: `.env` 파일이 없거나 API 키가 잘못됨

**해결책**:
```bash
# .env 파일 확인 및 키 재설정
echo "GOOGLE_API_KEY=your_key_here" > .env
```

### 문제 2: 포트 충돌
**증상**: "Address already in use" 에러

**해결책**:
```bash
# Windows 포트 확인 및 종료
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

---

## 유지보수 (Maintenance)

### 1. 서버 코드 업데이트 (Git Pull)
최신 코드를 적용하려면 다음 명령어를 실행하세요:

**Windows**:
```powershell
cd D:\DEVILTOWN
git pull origin main
# 의존성 변경이 있다면
pip install -r requirements.txt
# 서버 재시작 (터널은 유지됨)
taskkill /F /IM python.exe
# (자동 실행 스크립트나 배치 파일로 다시 시작)
.\start_server.bat
```

### 2. 로그 확인
서버에 문제가 생겼을 때 가장 먼저 확인해야 할 파일입니다.
- **Windows**: `D:\DEVILTOWN\Logs\server.log`
- **실시간 확인**: PowerShell에서 `Get-Content D:\DEVILTOWN\Logs\server.log -Wait`

### 3. 정기 점검 체크리스트
- [ ] `git pull`로 최신 코드 유지
- [ ] `winget upgrade Cloudflare.cloudflared`로 터널 프로그램 업데이트
- [ ] `pip list --outdated`로 Python 패키지 최신화 여부 확인
- [ ] 로그 파일 용량이 너무 크지 않은지 확인 (필요시 삭제)

### 파일 구조 상세

```
데빌타운 웹사이트/
├── main.py                    # FastAPI 백엔드 서버
│   ├── CORS 미들웨어
│   ├── /chat 엔드포인트
│   ├── /dice-comment 엔드포인트
│   └── Gemini API 통합
│
├── system_prompt.md           # AI 페르소나 정의
├── .env                       # 환경 변수 (API 키)
├── requirements.txt           # Python 의존성
├── SETUP_ENV.ps1              # [설치용] 환경 변수 및 파이썬 경로 자동 설정
├── setup_autostart.ps1        # [설치용] 윈도우 시작 시 자동 실행 등록 스크립트
├── start_server.bat           # [실행용] 서버와 터널을 한 번에 실행하는 배치 파일
├── cloudflared.exe            # [실행용] Cloudflare Tunnel 클라이언트 (단독 실행 파일)
├── README.md                  # 프로젝트 설명
├── SYSTEM_DOCS.md             # 시스템 전체 문서 (본 파일)
│
├── index.html                 # 메인 HTML
│
├── css/
│   └── style.css              # 스타일시트
│
├── js/
│   ├── script.js              # 메인 로직 (Dice, UI)
│   └── devil_coach_chat.js    # 채팅 로직
│
└── Logs/                      # 서버 로그 (Windows 전용)
    └── server.log             # 실행 및 에러 로그
```

---

## 연락처 및 지원

문제가 발생하거나 개선 제안이 있으시면:
1. GitHub Issues 등록
2. 프로젝트 관리자에게 연락
3. `system_prompt.md` 직접 수정 후 PR

**Happy Running! 🏃‍♂️💨**
