<div align="center">

# 🚀 SoomLog

### Practice. Reflect. Grow.

**CS 면접 공부 플랫폼**

직접 답하고, AI에게 피드백 받고, 학습 과정을 기록하는 CS 면접 학습 플랫폼

</div>

---

# 📢 Update

### 2026.09.27

SoomLog의 서비스 방향과 AI 환경을 업데이트했습니다.

* 서비스 타이틀을 **「AI-Powered Technical Interview Platform」 → 「CS 면접 공부 플랫폼」**으로 변경
* AI 답변 분석 및 피드백 모델을 **OpenAI API → Ollama 기반 로컬 AI 모델**로 변경
* CS 면접 학습에 더욱 집중할 수 있도록 서비스 콘텐츠와 기능 방향을 정리
* 사용자가 직접 답변하고 AI 피드백을 받는 학습 흐름을 유지하면서 AI 모델 환경을 개선

> **SoomLog는 이제 CS 면접을 공부하고, 답변하고, 복습하며 성장하는 학습 플랫폼을 목표로 합니다.**

---

# 📖 About

SoomLog는 개발자를 위한 **CS 면접 공부 플랫폼**입니다.

단순히 면접 질문과 답변을 제공하는 것이 아니라,

* 직접 답변 작성
* AI 피드백
* 모범답안 비교
* 꼬리질문 학습
* 학습 로그 관리

를 통해 실제 기술면접을 준비하는 것처럼 학습할 수 있도록 설계되었습니다.

> "답을 먼저 보는 것이 아니라,
> **먼저 생각하고 답하는 과정**을 중요하게 생각합니다."

---

# ✨ Key Features

## 🔒 Unlock Learning

답변을 작성하기 전까지

* 모범답안
* AI 피드백
* 심화 설명
* 꼬리 질문

모두 잠겨 있습니다.

답변을 직접 작성하고 제출한 후에만 학습 콘텐츠가 열리도록 설계하여,
**스스로 생각하고 답하는 학습 과정**을 중요하게 합니다.

---

## 🤖 AI Feedback

사용자가 작성한 답변을 AI가 분석하여 피드백을 제공합니다.

평가 항목 예시:

* 정확성
* 전달력
* 답변의 깊이
* 부족한 개념
* 개선 방향

예시:

```text
Score : 88/100

Good
✔ HTTP/2 Multiplexing 설명

Need Improvement
✖ Header Compression 설명 부족
```

SoomLog는 **Ollama 기반 AI 모델**을 활용하여
답변 분석 및 피드백 기능을 제공합니다.

---

## 🦙 Ollama AI

AI 기능은 기존 OpenAI API 기반에서 **Ollama 기반 AI 모델**로 변경되었습니다.

Ollama를 활용하여 로컬 환경에서 AI 모델을 실행하고,
사용자의 답변을 분석하여 CS 면접 학습에 필요한 피드백을 제공합니다.

```text
User Answer
     ↓
Ollama AI Model
     ↓
Answer Analysis
     ↓
AI Feedback
     ↓
Improvement Points
```

AI 모델을 서비스 구조와 분리하여
향후 다양한 로컬 LLM을 테스트하고 교체할 수 있도록 구성하는 것을 목표로 합니다.

---

## 📚 AI Model Answer

AI가 생성한 난이도별 모범답안을 제공합니다.

* 핵심 답변
* 일반 답변
* 면접 답변
* 심화 답변

답변을 먼저 확인하는 것이 아니라
**사용자가 먼저 답변을 작성한 후 모범답안을 확인**할 수 있도록 구성했습니다.

---

## 🎯 Tail Questions

답변 이후 AI가 실제 면접처럼 추가 질문을 생성합니다.

예시:

```text
HTTP/3는 무엇인가요?

HOL Blocking은 무엇인가요?

HTTP/2는 왜 Binary Protocol을 사용할까요?
```

하나의 질문에서 끝나는 것이 아니라
관련 개념을 이어서 학습할 수 있도록 설계했습니다.

---

## 📈 Dashboard

학습 현황을 한눈에 확인할 수 있습니다.

* 학습 진행률
* 카테고리별 숙련도
* 약점 분석
* 최근 학습 기록

자신이 어떤 CS 분야를 학습했고,
어떤 부분을 더 공부해야 하는지 확인할 수 있습니다.

---

## 📝 Study Log

모든 학습 기록을 저장합니다.

```text
2026-07-10

Network
92점

React
88점

OS
81점
```

GitHub Commit History처럼
자신의 **CS 면접 공부 과정과 성장 기록**을 확인할 수 있도록 구성했습니다.

---

# 🖥️ Preview

Coming Soon...

```text
Landing Page

Dashboard

Interview

History

Statistics
```

---

# 🛠 Tech Stack

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

## Backend

* Supabase

## AI

* Ollama
* Local LLM

## State Management

* Zustand

## Form Validation

* React Hook Form
* Zod

## Charts

* Recharts

---

# 📂 Project Structure

```text
src
├── app
├── components
├── features
│   ├── dashboard
│   ├── interview
│   ├── feedback
│   ├── history
│   └── profile
├── hooks
├── lib
├── services
├── types
└── utils
```

---

# 🚀 Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/StarlightSSM/SoomLog.git

cd SoomLog
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Run Development Server

```bash
npm run dev
```

## 4. Run Ollama

Ollama를 설치하고 사용할 AI 모델을 실행합니다.

```bash
ollama run <model-name>
```

프로젝트에서 Ollama 서버와 연결하여
AI 피드백 및 면접 학습 기능을 사용할 수 있습니다.

---

# 🎯 Roadmap

## Phase 1

* [x] 프로젝트 초기 세팅
* [x] 로그인
* [x] 카테고리
* [x] 질문 목록
* [x] 답변 작성
* [x] Unlock 기능

## Phase 2

* [x] AI 피드백
* [x] AI 모범답안
* [x] 꼬리질문
* [x] 학습 기록
* [x] Dashboard

## Phase 3

* [ ] 음성 면접
* [ ] AI 면접관
* [ ] 상세 통계
* [ ] PDF 학습 리포트
* [ ] 다크모드

---

# 💡 Vision

SoomLog는 단순한 CS 문제집이 아닙니다.

**생각하고 → 답하고 → 피드백 받고 → 복습하고 → 성장하는**

CS 면접 학습 경험을 제공하는 것을 목표로 합니다.

사용자가 질문의 정답을 단순히 암기하는 것이 아니라,
직접 자신의 언어로 설명하고 부족한 개념을 발견하면서
실제 면접에서 답변할 수 있는 능력을 기르는 것이 SoomLog의 목표입니다.

---

# ⭐ Practice. Reflect. Grow.

**Practice**
직접 질문에 답하고,

**Reflect**
AI 피드백을 통해 부족한 부분을 확인하고,

**Grow**
반복적인 학습과 기록을 통해 성장합니다.

---

<div align="center">

Made with ❤️ by Sumin Shin

</div>
