# Cloudflare 도메인 연결 및 배포 가이드

## 📋 목차
1. [보안 최종 점검](#보안-최종-점검)
2. [GitHub 푸시](#github-푸시)
3. [Cloudflare 도메인 구매](#cloudflare-도메인-구매)
4. [서버 배포 (VPS/Cloud)](#서버-배포)
5. [Cloudflare DNS 설정](#cloudflare-dns-설정)
6. [SSL/HTTPS 설정](#sslhttps-설정)
7. [환경 변수 설정](#환경-변수-설정)
8. [최종 테스트](#최종-테스트)

---

## 🔒 보안 최종 점검

### ✅ 점검 완료 항목

1. **API 키 보호**
   - ✅ `.env` 파일에만 존재
   - ✅ `.gitignore`에 `.env` 포함
   - ✅ 코드에 하드코딩된 API 키 없음
   - ✅ 문서에 실제 API 키 없음

2. **민감한 파일**
   ```bash
   # .gitignore 확인
   .env
   __pycache__/
   *.pyc
   *.pyo
   *.pyd
   .Python
   *.so
   *.egg
   *.egg-info/
   dist/
   build/
   ```

3. **Git 저장소 확인**
   ```bash
   # .env가 Git에 추가되지 않았는지 확인
   git ls-files | grep .env
   # 결과: 없음 (정상)
   ```

---

## 📤 GitHub 푸시

### 1. 원격 저장소 연결
```bash
cd "D:\DEVILTOWN"

# 원격 저장소 추가
git remote add origin https://github.com/howcanimakeprogram/built_deviltown.git

# 또는 이미 있다면 URL 변경
git remote set-url origin https://github.com/howcanimakeprogram/built_deviltown.git
```

### 2. 푸시
```bash
# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

---

## 🌐 Cloudflare 도메인 구매

### 1. Cloudflare 계정 생성
1. https://dash.cloudflare.com/sign-up 접속
2. 이메일 + 비밀번호로 가입
3. 이메일 인증

### 2. 도메인 구매
1. **Cloudflare Dashboard** → **Domain Registration** 클릭
2. 원하는 도메인 검색 (예: `deviltown.run`, `deviltown.club`)
3. 가격 확인 (.com: ~$10/년, .run: ~$3/년, .club: ~$13/년)
4. **Purchase** 클릭
5. 결제 정보 입력 (카드 또는 PayPal)
6. 구매 완료

---

## 🖥️ Devil Town 홈 서버 배포 가이드 (Windows Mini PC)

### 📋 개요
이 가이드는 **집에 있는 Windows 미니 PC**를 메인 서버로 사용하여 전 세계에 웹사이트를 배포하는 방법을 설명합니다.
**Cloudflare Tunnel**을 사용하므로, 복잡한 공유기 설정(포트포워딩)이나 고정 IP가 필요 없습니다.

---

## 🚀 1. 준비물
- 항상 켜둘 수 있는 **Windows PC**
- 도메인 (예: `welcometodeviltown.com`)
- Cloudflare 계정

---

## 🛠️ 2. 서버 실행 (Python)

서버는 항상 켜져 있어야 합니다. `start_server.bat`를 사용하거나 직접 실행합니다.

```powershell
cd "D:\DEVILTOWN"
.\start_server.bat
```

---

## 🚇 3. 외부 연결 (Cloudflare Tunnel)

### 3-1. 설치
```powershell
winget install Cloudflare.cloudflared
```

### 3-2. 로그인 & 터널 생성
```powershell
cloudflared tunnel login
cloudflared tunnel create deviltown
```

### 3-3. 도메인 연결 & 실행
```powershell
cloudflared tunnel route dns deviltown welcometodeviltown.com
cloudflared tunnel run deviltown
```

---

## 🔄 4. 자동 실행 (Windows)
PC를 재부팅해도 서버가 자동으로 켜지게 설정되어 있습니다.
- `D:\DEVILTOWN\setup_autostart.ps1` 스크립트를 통해 작업 스케줄러에 등록됨.
- 로그인 시 `start_server.bat`가 실행되어 Backend와 Tunnel을 동시에 켭니다.

**수동 등록 방법**:
```powershell
powershell -ExecutionPolicy Bypass -File D:\DEVILTOWN\setup_autostart.ps1
```

---

## ✅ 체크리스트
- [ ] `python main.py` 실행 중인가?
- [ ] `cloudflared tunnel run` 실행 중인가?
- [ ] 도메인(`welcometodeviltown.com`) 접속 시 잘 열리는가?

---
