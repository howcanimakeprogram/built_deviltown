# 변경 이력 (Changelog)

이 프로젝트의 모든 주요 변경 사항은 이 파일에 기록됩니다.

## [1.3.0] - 2026-02-16
### 추가됨 (Added)
- `/calendar/events` 응답 캐시(`CALENDAR_CACHE_TTL_SECONDS`) 추가
- `/chat`, `/dice-comment`, `/calendar/events` IP 기준 레이트 리밋 추가
- `RUNBOOK.md` 신규 추가 (장애 대응 절차/체크리스트)
- `VERSION` 파일 + `APP_VERSION` 기반 버전 식별 추가
- `GET /meta/version` 운영 점검 API 추가
- `.env.example` 템플릿 파일 추가

### 변경됨 (Changed)
- Schedule 이벤트 카드 표시를 `제목 + 시간`만 출력하도록 단순화
- 외부 새 탭 링크에 `rel=\"noopener noreferrer\"` 적용
- API 에러 응답을 내부 예외 문자열 직접 노출 없이 일반화
- `README.md`, `SYSTEM_DOCS.md`, `MAINTENANCE.md`를 최신 운영 설정에 맞게 동기화
- 요청 로그에 상태코드 반영, 응답 헤더에 `X-Request-ID`/`X-App-Version` 추가
- 파일 로그를 `RotatingFileHandler`로 변경 (`LOG_MAX_BYTES`, `LOG_BACKUP_COUNT`)
- 미사용 레거시 파일(`js/script.js`, `debug_windows.py`)과 생성 산출물(`__pycache__`, `.DS_Store`) 정리

### 보안 (Security)
- 로그에서 API 키 접두사 출력 제거
- 채팅 입력 원문 로그를 제거하고 길이/히스토리 개수만 기록

## [1.2.2] - 2026-02-15
### 추가됨 (Added)
- **MAINTENANCE.md**: 유지보수 가이드 (의존성, 배포, 롤백, 로그, 정기 점검)
- **함수 docstring**: `main.py`의 API 엔드포인트에 상세 설명 추가
- **GLOBAL_RULES.md 준수**: 엔지니어링 표준 적용

## [1.2.1] - 2026-02-15
### 변경됨 (Changed)
- **인트로 대문 디자인 간소화**: 복잡한 SVG 아이콘 대신 이모지 사용, 흰색 박스 스타일로 변경.
- **체크박스 영역**: 3px 검은 테두리 + 50px 둥근 모서리로 강조.
- **Footer**: "Hellfire Ray ID" 및 "Soul ID" 표시.

## [1.2.0] - 2026-02-15
### 추가됨 (Added)
- **인트로 대문 (Entrance Gate)**: 사이트 접속 시 "악마의 구역" 경고문과 함께 입장 버튼(ENTER IF YOU DARE)을 클릭해야 진입하는 키치한 인트로 오버레이 추가.
- **오디오/인터랙션**: 입장 버튼 클릭 시 글리치 효과 및 자연스러운 화면 전환 구현.

## [1.1.0] - 2026-02-15
### 추가됨 (Added)
- **반응형 레이아웃**: 모바일 환경에서도 잘 보이도록 `auto-fit` 그리드 시스템과 텍스트 줄바꿈 적용.
- **보안 설정 스크립트**: 윈도우에서 API 키를 안전하게 등록할 수 있는 `setup_env.ps1` 추가.
- **새로운 페르소나**: AI 코치 스타일을 "방구석 여포(입만 산 키보드 워리어)"로 변경.

### 변경됨 (Changed)
- **AI 모델 업그레이드**: API 오류 해결을 위해 `gemini-1.5-flash`에서 `gemini-2.0-flash`로 버전 변경.
- **문서 현행화**: `README.md`와 `SYSTEM_DOCS.md`에 최신 배포 방법 및 페르소나 변경 사항 반영.
- **API 키 관리 방식**: 소스 코드에 하드코딩된 API 키 제거 및 환경 변수(`GOOGLE_API_KEY`) 사용으로 변경.

### 수정됨 (Fixed)
- **모바일 UI 오류**: 작은 화면에서 버튼이 겹치거나 텍스트가 잘리는 문제 해결.
- **윈도우 배포 오류**: `WinError 10048` (포트 충돌) 및 `ModuleNotFoundError` 해결.
- **보안 취약점**: `.env` 및 `setup_env.ps1`을 `.gitignore`에 추가하여 API 키 유출 방지.

## [1.0.0] - 2026-02-14
### 추가됨 (Added)
- DevilTown 웹사이트 최초 릴리즈.
- 주요 기능: 해골 주사위 게임(Skull Game), Devil Coach 채팅 메뉴, 스케줄, 아카이브, 믹스셋.
