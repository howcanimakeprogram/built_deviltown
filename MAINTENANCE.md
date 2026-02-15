# MAINTENANCE.md - Devil Town 웹사이트 유지보수 가이드

## 📦 의존성 목록 및 버전

### Backend (Python)
```
python >= 3.8
fastapi >= 0.104.0
uvicorn >= 0.24.0
google-generativeai == 0.8.6
python-dotenv >= 1.0.0
pydantic >= 2.0.0
```

### Frontend
```
Vanilla JavaScript (ES6+)
CSS3
HTML5
```

### 외부 API
- **Google Gemini API**: `gemini-2.0-flash` 모델 사용
- **API Key**: 환경변수 `GOOGLE_API_KEY`로 관리

---

## 🔧 환경 설정 방법

### 1. `.env` 파일 구조
프로젝트 루트에 `.env` 파일 생성:
```bash
GOOGLE_API_KEY=your_api_key_here
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 서버 실행
```bash
python main.py
```
- 기본 포트: `8000`
- 접속 URL: `http://localhost:8000`

---

## 🚀 배포 절차

### Mac (로컬 개발 서버)
1. 코드 수정 및 테스트
2. Git 커밋 및 푸시
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin main
   ```

### Windows (프로덕션 서버)
1. 서버에서 최신 코드 pull
   ```bash
   git pull origin main
   ```
2. 서버 재시작
   ```bash
   pkill python
   python main.py &
   ```
3. Cloudflare Tunnel 확인
   ```bash
   cloudflared tunnel run deviltown
   ```

---

## ⏮️ 롤백 방법

### Git을 통한 롤백
```bash
# 이전 커밋 확인
git log --oneline -10

# 특정 커밋으로 롤백
git reset --hard <commit-hash>

# 원격 저장소에 강제 푸시 (주의!)
git push origin main --force
```

### 파일 단위 롤백
```bash
# 특정 파일만 이전 버전으로 복구
git checkout <commit-hash> -- path/to/file
git commit -m "revert: rollback file to previous version"
```

---

## 📊 로그 확인 방법

### 서버 로그
- **위치**: `Logs/server.log`
- **실시간 확인**:
  ```bash
  tail -f Logs/server.log
  ```

### 로그 레벨
- `INFO`: 정상 흐름 (API 요청, 응답)
- `WARNING`: 복구 가능한 이상 징후
- `ERROR`: 작업 실패 (API 오류, 예외)

### 주요 로그 패턴
```
[INFO] Serving index.html
[INFO] Chat request received
[ERROR] Error in chat_endpoint: <error message>
```

---

## 🔍 정기 점검 항목

### 일일 점검
- [ ] 서버 상태 확인 (`ps aux | grep python`)
- [ ] 로그 파일 확인 (`tail -f Logs/server.log`)
- [ ] 웹사이트 접속 테스트 (http://localhost:8000)

### 주간 점검
- [ ] API 사용량 확인 (Google Cloud Console)
- [ ] 로그 파일 크기 확인 및 정리
- [ ] Git 커밋 히스토리 정리

### 월간 점검
- [ ] 의존성 업데이트 확인
  ```bash
  pip list --outdated
  ```
- [ ] 보안 패치 확인
- [ ] `.env` 파일 백업

---

## 🔄 외부 API 변경 대응 절차

### Google Gemini API 변경 시
1. **공식 문서 확인**: https://ai.google.dev/
2. **모델 버전 확인**: `main.py`의 `model_name` 파라미터
3. **테스트 환경에서 검증**:
   ```bash
   python debug_windows.py
   ```
4. **변경사항 문서화**: `CHANGELOG.md` 업데이트
5. **배포**

### API Key 만료/변경 시
1. Google Cloud Console에서 새 API Key 발급
2. `.env` 파일 업데이트
3. 서버 재시작
4. 동작 확인

---

## 🐛 일반적인 문제 해결

### 1. "GOOGLE_API_KEY not found" 오류
**원인**: `.env` 파일 누락 또는 잘못된 위치  
**해결**:
```bash
# .env 파일 확인
cat .env

# 파일이 없으면 생성
echo "GOOGLE_API_KEY=your_key" > .env
```

### 2. 포트 8000 이미 사용 중
**원인**: 이전 서버 프로세스가 종료되지 않음  
**해결**:
```bash
# 프로세스 확인
lsof -i :8000

# 강제 종료
pkill -9 python
```

### 3. 정적 파일 로딩 실패
**원인**: CSS/JS 파일 경로 문제  
**해결**:
- 브라우저 캐시 클리어 (Cmd+Shift+R)
- `index.html`의 CSS 버전 파라미터 변경 (`?v=2.6`)

---

## 📝 기술 부채 (TODO)

### 현재 알려진 이슈
1. ⚠️ **로그 포맷 표준화 필요**: job_id, duration_ms 미적용
2. ⚠️ **함수 docstring 부족**: `main.py`의 엔드포인트 함수들
3. ⚠️ **에러 핸들링 개선**: 프론트엔드에서 API 오류 처리 강화

### 향후 개선 계획
- [ ] 로그 로테이션 구현
- [ ] 자동 배포 스크립트 작성
- [ ] 모니터링 대시보드 추가
- [ ] 단위 테스트 작성

---

## 📞 긴급 연락처

- **프로젝트 관리자**: [연락처 추가 필요]
- **Google Cloud 지원**: https://cloud.google.com/support

---

**마지막 업데이트**: 2026-02-15  
**문서 버전**: 1.0.0
