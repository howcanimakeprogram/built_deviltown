# DEVILTOWN WEBSITE

DevilTown 다크 테마 웹사이트입니다.

## 🏃 주요 기능

- **💀 Skull Game**: 오늘 뛸 거리를 악마에게 물어보는 운명의 주사위
- **🤬 Devil Coach (AI)**: "방구석여포" 페르소나 채팅 메뉴
- **📅 Schedule**: iCloud 공개 캘린더 기반 일정 피드 (현재 UI는 제목 + 시간 표시)
- **📸 Archive**: 사진/영상 아카이브
- **🎵 Mixes**: DJ 믹스 플레이리스트
- **🏅 Marathoner**: 마라토너 정보

## 🚀 실행 방법

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 아래 값을 설정하세요:
```env
GOOGLE_API_KEY=your_api_key_here
ICLOUD_CALENDAR_ICS_URL=https://p44-caldav.icloud.com/published/2/...
RATE_LIMIT_WINDOW_SECONDS=60
CHAT_RATE_LIMIT_PER_WINDOW=60
DICE_RATE_LIMIT_PER_WINDOW=120
CALENDAR_RATE_LIMIT_PER_WINDOW=30
MAX_CHAT_MESSAGE_LENGTH=500
MAX_CHAT_HISTORY_ITEMS=24
CALENDAR_CACHE_TTL_SECONDS=120
CORS_ALLOWED_ORIGINS=https://welcometodeviltown.com,https://www.welcometodeviltown.com
APP_VERSION=1.3.0
LOG_MAX_BYTES=5242880
LOG_BACKUP_COUNT=10
```

로컬 개발에서 API 호출 테스트가 필요하면 `CORS_ALLOWED_ORIGINS`에
`http://localhost:8000` 또는 `http://127.0.0.1:8000`를 추가하세요.

API 키는 [Google AI Studio](https://aistudio.google.com/)에서 발급받을 수 있습니다.

### 3. 서버 실행
단일 명령어로 프론트엔드와 백엔드가 모두 실행됩니다:

```bash
python main.py
```

### 4. 접속
브라우저에서 `http://localhost:8000` 접속

### 5. 버전/로그 빠른 점검
```bash
cat VERSION
curl -s http://localhost:8000/meta/version
ls -lh Logs/server.log*
```

## 📁 프로젝트 구조

```
데빌타운 웹사이트/
├── index.html              # 메인 HTML
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── visuals.js          # 배경/ASCII/스크램블/공용 DOM
│   ├── navigation_feeds.js # 메뉴/모달/피드/태그 필터
│   ├── game_video.js       # Skull Dice + 비디오 모달
│   ├── boot_gate.js        # 인트로/게이트/부팅 초기화
│   └── devil_coach_chat.js # AI 채팅 인터페이스
├── main.py                 # FastAPI 백엔드
├── VERSION                 # 배포 버전 문자열 (예: 1.3.0)
├── system_prompt.md        # AI 페르소나 정의
├── SYSTEM_DOCS.md          # 시스템 전체 문서
├── MAINTENANCE.md          # 유지보수 가이드
├── RUNBOOK.md              # 장애 대응 실행 가이드
├── CHANGELOG.md            # 변경 이력
├── requirements.txt        # Python 의존성
├── .env                    # 환경 변수 (gitignore됨)
└── .gitignore              # Git 제외 파일
```

## 🤖 Devil Coach 페르소나

- **스타일**: 방구석여포 (입만 산 키보드 워리어)
- **특징**: 커뮤니티 용어, 내로남불, 팩트 폭격
- **목적**: 거친 동기부여로 러닝 의욕 고취
- **아스키 아트**: 재미있는 이모티콘으로 응답 강화
- **히스토리 정책**: 대화 문맥은 요청 처리용으로만 사용되며 서버에 사용자별 영구 저장하지 않음

자세한 내용은 [`system_prompt.md`](system_prompt.md) 참조

## 📚 문서

- [`SYSTEM_DOCS.md`](SYSTEM_DOCS.md): 시스템 전체 구조, API 문서, 트러블슈팅
- [`MAINTENANCE.md`](MAINTENANCE.md): 배포/운영/점검 가이드
- [`RUNBOOK.md`](RUNBOOK.md): 장애/오류 대응 절차
- [`CHANGELOG.md`](CHANGELOG.md): 변경 이력
- [`system_prompt.md`](system_prompt.md): AI 페르소나 및 대화 가이드

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python, FastAPI
- **AI**: Google Gemini API
- **Deployment**: Home Server (Windows) + Cloudflare Tunnel
- **Server**: Uvicorn (ASGI)

## 🔒 보안

- `.env` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- API 키는 절대 공개 저장소에 업로드하지 마세요
- API는 `CORS_ALLOWED_ORIGINS` + Origin/Referer 검사로 허용 사이트만 접근할 수 있습니다
- `/chat`, `/dice-comment`, `/calendar/events`는 IP 기준 레이트 리밋이 적용됩니다
- 로그는 `RotatingFileHandler`로 자동 분할됩니다 (`server.log`, `server.log.1`, ...)

## 📝 라이선스

이 프로젝트는 Devil Town 팀의 소유입니다.

---

**Happy Running! 🏃‍♂️💨**
