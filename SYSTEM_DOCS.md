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
```

---

## 아키텍처

### 시스템 구조도
```
┌─────────────────────────────────────────────────┐
│              Browser (Client)                    │
│  ┌──────────────────────────────────────────┐   │
│  │  Devil Town Website (index.html)         │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  Devil Coach Section               │  │   │
│  │  │  - Chat UI (coachChatMessages)     │  │   │
│  │  │  - Input Field (coachInput)        │  │   │
│  │  │  - Send Button (coachSendBtn)      │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
                      │ HTTP POST /chat
                      ▼
┌─────────────────────────────────────────────────┐
│         FastAPI Backend (main.py)                │
│  ┌──────────────────────────────────────────┐   │
│  │  CORS Middleware                         │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  /chat Endpoint                          │   │
│  │  - Receive: {message, history}           │   │
│  │  - Load: system_prompt.md                │   │
│  │  - Call: Gemini API                      │   │
│  │  - Return: {response}                    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
                      │ API Call
                      ▼
┌─────────────────────────────────────────────────┐
│         Google Gemini API                        │
│  - Model: gemini-2.0-flash-exp                   │
│  - System Instruction: 매미킴 맛 찐친 페르소나    │
│  - Temperature: 1.0                              │
└─────────────────────────────────────────────────┘
```

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

### 2. 의존성 설치
```bash
cd "/Users/chaehyeonbyeongsin/Desktop/코딩/데빌타운 웹사이트"
pip install -r requirements.txt
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

### 4. 서버 실행
```bash
# 방법 1: 직접 실행
python main.py

# 방법 2: uvicorn 사용
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**실행 확인**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## 사용 방법

### 웹 인터페이스 접속
1. 브라우저에서 `http://127.0.0.1:8000` 접속
2. 우측 상단 **MENU** 버튼 클릭
3. **Devil Coach (AI)** 선택

### 채팅 시작
- 입력창에 메시지 입력
- **Enter** 키 또는 **보내기** 버튼 클릭
- AI 응답 대기 (보통 2-5초)

### 대화 예시

**사용자**: "오늘 10km 뛰려는데 준비운동 뭐해?"

**AI 응답**:
```
야, 그냥 뛰면 무릎 골로 간다 ☠️

딱 3개만 하고 뛰어라:
1. 발목 돌리기: 양쪽 20번씩
2. 무릎 돌리기: 앉았다 일어났다 10번
3. 제자리 뛰기 1분: 심장한테 신호 줘야지

다 했으면 튀어 나가! ε=ε=ε=ε=┌(;￣▽￣)┘
```

---

## API 문서

### POST /chat

**Endpoint**: `http://127.0.0.1:8000/chat`

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

**Error Response** (500):
```json
{
  "detail": "API Key not configured"
}
```

### 히스토리 관리
- 프론트엔드에서 `chatHistory` 배열로 관리
- 각 메시지는 `{role: 'user'|'assistant', content: string}` 형식
- 백엔드로 전송 시 Gemini API 형식으로 변환

---

## 페르소나 커스터마이징

### system_prompt.md 수정

파일 위치: [`system_prompt.md`](file:///Users/chaehyeonbyeongsin/Desktop/코딩/데빌타운 웹사이트/system_prompt.md)

**수정 가능한 요소**:

1. **말투 조정**
   - 욕설 강도 조절
   - 사투리 변경 (경상도 → 전라도 등)

2. **신체 부위 호칭**
   ```markdown
   - 입 -> 아가리 (또는 주둥이)
   - 머리 -> 대가리 (또는 능지)
   ```

3. **상황별 대응 추가**
   ```markdown
   ### [상황: 새로운 상황]
   - **원칙:** ...
   - "답변 예시..."
   ```

4. **아스키 아트 추가**
   - 새로운 이모티콘을 섹션 4에 추가
   - 사용 예시 작성

### 변경 사항 적용
- `system_prompt.md` 저장 후 서버 재시작 **불필요**
- 각 요청마다 파일을 새로 읽어옴

---

## 트러블슈팅

### 문제 1: "API Key not configured" 에러
**원인**: `.env` 파일이 없거나 API 키가 잘못됨

**해결책**:
```bash
# .env 파일 확인
cat .env

# API 키 재설정
echo "GOOGLE_API_KEY=your_key_here" > .env
```

### 문제 2: CORS 에러
**증상**: 브라우저 콘솔에 "Access-Control-Allow-Origin" 에러

**해결책**:
- `main.py`의 CORS 설정 확인
- 이미 `allow_origins=["*"]`로 설정되어 있음

### 문제 3: 포트 충돌
**증상**: "Address already in use" 에러

**해결책**:
```bash
# 8000 포트 사용 중인 프로세스 확인
lsof -i :8000

# 프로세스 종료
kill -9 <PID>
```

### 문제 4: 응답이 너무 느림
**원인**: Gemini API 호출 지연

**해결책**:
- 인터넷 연결 확인
- API 키 할당량 확인 (Google AI Studio)
- `generation_config`의 `max_output_tokens` 줄이기

### 문제 5: 채팅창이 보이지 않음
**원인**: JavaScript 로딩 실패

**해결책**:
```bash
# 브라우저 콘솔 확인 (F12)
# devil_coach_chat.js 로딩 확인
```

---

## 유지보수

### 로그 확인
서버 실행 시 터미널에 로그 출력:
```
INFO:     127.0.0.1:52345 - "POST /chat HTTP/1.1" 200 OK
```

### API 사용량 모니터링
- [Google AI Studio](https://aistudio.google.com/) 접속
- API 키 사용량 확인
- 무료 할당량: 분당 60회 요청

### 백업 권장 사항
**중요 파일**:
- `system_prompt.md`: 페르소나 정의
- `.env`: API 키 (Git 제외)
- `main.py`: 백엔드 로직
- `js/devil_coach_chat.js`: 채팅 로직

### 업데이트 체크리스트
- [ ] `requirements.txt` 의존성 버전 확인
- [ ] Gemini API 모델 버전 확인 (`gemini-2.0-flash-exp`)
- [ ] 보안 패치 적용
- [ ] `system_prompt.md` 개선 사항 반영

### 성능 최적화
1. **캐싱**: 자주 묻는 질문 응답 캐싱 (선택사항)
2. **Rate Limiting**: 과도한 요청 방지
3. **로깅**: 에러 추적용 로깅 추가

---

## 파일 구조 상세

```
데빌타운 웹사이트/
├── main.py                    # FastAPI 백엔드 서버
│   ├── CORS 미들웨어
│   ├── /chat 엔드포인트
│   └── Gemini API 통합
│
├── system_prompt.md           # AI 페르소나 정의
│   ├── 말투 가이드
│   ├── 상황별 대응
│   └── 아스키 아트
│
├── .env                       # 환경 변수 (API 키)
├── .env.example               # 환경 변수 템플릿
├── .gitignore                 # Git 제외 파일
├── requirements.txt           # Python 의존성
├── README.md                  # 프로젝트 설명
│
├── index.html                 # 메인 HTML
│   ├── 메뉴 구조
│   ├── Skull Game 섹션
│   └── Devil Coach 섹션 (채팅 UI)
│
├── css/
│   └── style.css              # Devil Town 스타일
│
├── js/
│   ├── script.js              # 메인 스크립트
│   ├── devil_coach.js         # 기존 단발성 코치
│   └── devil_coach_chat.js    # 채팅 기능 ✨
│       ├── sendCoachMessage()
│       ├── addCoachMessage()
│       └── 이벤트 리스너
│
└── static/                    # FastAPI용 독립 버전
    ├── index.html
    ├── style.css
    └── script.js
```

---

## 2. System Architecture

```mermaid
graph TD
    User([User]) -->|HTTPS Request| CF[Cloudflare Edge]
    CF -->|Encrypted Tunnel| Tunnel[Cloudflared (Home Server)]
    Tunnel -->|Forward Request| FastAPI[FastAPI Backend (Port 8000)]
    
    subgraph "Home Server (MacBook)"
        Tunnel
        FastAPI
        Static[Static Files (HTML/CSS/JS)]
        Logic[Business Logic]
    end
    
    FastAPI -->|Serve| Static
    FastAPI -->|Process| Logic
    Logic -->|API Call| Gemini[Google Gemini API]
```

### Component Description
-   **Frontend**: Single Page Application (SPA) served by FastAPI.
-   **Backend**: FastAPI server handling static files and API requests.
-   **AI Engine**: Google Gemini 1.5 Pro for generating coach responses.
-   **Infrastructure**: Self-hosted on Windows Mini PC (Production) & MacBook (Dev), exposed via Cloudflare Tunnel.

### 2.1 Server Infrastructure Details

| Role | Device | OS | Specs | Location | Project Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Production** | Windows Mini PC | Windows 11 | Intel N100 / 16GB RAM | Home Server | `C:\Users\Public\serveradmin_env\Deviltown website` |
| **Development** | MacBook Pro | macOS | M-Series / 16GB+ RAM | Local Dev | `/Users/chaehyeonbyeongsin/Desktop/코딩/데빌타운 웹사이트` |

> **Note**: Both environments use **Cloudflare Tunnel** to expose the local server to `welcometodeviltown.com`.
> - **Production (Win)**: Always-on server.
> - **Dev (Mac)**: Used for coding & testing (Tunnel usually off).

---

## 라이선스 및 크레딧

**개발**: Devil Town Team  
**AI**: Google Gemini 2.0 Flash  
**프레임워크**: FastAPI  
**페르소나**: 김동현(매미킴) 밈 영감

---

## 연락처 및 지원

문제가 발생하거나 개선 제안이 있으시면:
1. GitHub Issues 등록
2. 프로젝트 관리자에게 연락
3. `system_prompt.md` 직접 수정 후 PR

**Happy Running! 🏃‍♂️💨**
