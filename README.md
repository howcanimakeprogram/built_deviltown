# Devil Town Running Coach

욕쟁이 AI 러닝 코치가 있는 Devil Town 웹사이트

## 🏃 주요 기능

- **💀 Skull Game**: 오늘 뛸 거리를 악마에게 물어보는 운명의 주사위
- **🤬 Devil Coach (AI)**: 욕설과 팩트 폭격으로 동기부여하는 AI 코치
- **📅 Schedule**: 러닝 일정 관리
- **📸 Archive**: 사진/영상 아카이브
- **🎵 Mixes**: DJ 믹스 플레이리스트
- **🏅 Marathoner**: 마라토너 정보

## 🚀 실행 방법

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. API 키 설정
`.env` 파일을 생성하고 Google Gemini API 키를 입력하세요:
```env
GOOGLE_API_KEY=your_api_key_here
```

API 키는 [Google AI Studio](https://aistudio.google.com/)에서 발급받을 수 있습니다.

### 3. 서버 실행

**프론트엔드 서버** (포트 8999):
```bash
python3 -m http.server 8999
```

**백엔드 API 서버** (포트 8000):
```bash
python main.py
```

### 4. 접속
브라우저에서 `http://127.0.0.1:8999` 접속

## 📁 프로젝트 구조

```
데빌타운 웹사이트/
├── index.html              # 메인 HTML
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── script.js           # 메인 로직 + Skull Game
│   ├── devil_coach.js      # 기존 단발성 코치
│   └── devil_coach_chat.js # AI 채팅 인터페이스
├── main.py                 # FastAPI 백엔드
├── system_prompt.md        # AI 페르소나 정의
├── SYSTEM_DOCS.md          # 시스템 전체 문서
├── requirements.txt        # Python 의존성
├── .env                    # 환경 변수 (gitignore됨)
└── .gitignore              # Git 제외 파일
```

## 🤖 AI 코치 페르소나

- **스타일**: 매미킴(김동현) 맛 찐친 러닝 코치
- **특징**: 욕설, 밈, 팩트 폭격
- **목적**: 거친 동기부여로 러닝 의욕 고취
- **아스키 아트**: 재미있는 이모티콘으로 응답 강화

자세한 내용은 [`system_prompt.md`](system_prompt.md) 참조

## 📚 문서

- [`SYSTEM_DOCS.md`](SYSTEM_DOCS.md): 시스템 전체 구조, API 문서, 트러블슈팅
- [`system_prompt.md`](system_prompt.md): AI 페르소나 및 대화 가이드

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python, FastAPI
- **AI**: Google Gemini API
- **Deployment**: Local Server (Mac) + Cloudflare Tunnel
- **Server**: Uvicorn (ASGI)

## 🔒 보안

- `.env` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- API 키는 절대 공개 저장소에 업로드하지 마세요
- 프로덕션 환경에서는 CORS 설정을 제한하세요

## 📝 라이선스

이 프로젝트는 Devil Town 팀의 소유입니다.

---

**Happy Running! 🏃‍♂️💨**
