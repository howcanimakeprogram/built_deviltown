/* ===== Devil Coach Gemini Integration (Merged) ===== */

/**
 * Devil Coach Chat Integration (devil_coach_chat.js)
 * 역할: AI 코치(Gemini)와의 실시간 채팅 인터페이스 및 메시지 처리 담당
 * 호출 관계: index.html에서 로드되어 Backend(/chat)와 통신함
 * 수정 시 주의사항: 대화 히스토리 관리 논리 및 메시지 세척(sanitize) 규칙 준수
 */

const coachInput = document.getElementById('coachInput');
const coachSendBtn = document.getElementById('coachSendBtn');
const coachChatMessages = document.getElementById('coachChatMessages');
const coachLoading = document.getElementById('coachLoading');

let chatHistory = [];

async function buildApiErrorMessage(response, defaultMessage) {
    const retryAfter = response.headers.get('Retry-After');
    const status = response.status;
    let detail = '';
    try {
        const payload = await response.json();
        if (payload && typeof payload.detail === 'string') {
            detail = payload.detail;
        }
    } catch (_) {
        // ignore json parse errors and use fallback message
    }

    if (status === 429) {
        const waitText = retryAfter ? `${retryAfter}초` : '잠시';
        return detail || `요청이 너무 많다. ${waitText} 후 다시 시도하거나 새로고침해라.`;
    }

    if (status >= 500) {
        return '지금 서버가 잠깐 불안정하다. 잠시 후 다시 시도해라.';
    }

    if (status === 413) {
        return detail || '메시지가 너무 길다. 조금 짧게 보내라.';
    }

    if (status === 400) {
        return detail || '요청 형식이 잘못됐다. 다시 입력해라.';
    }

    return detail || defaultMessage;
}

// Add message to chat
function addCoachMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'coach-message';
    messageDiv.textContent = content;

    coachChatMessages.appendChild(messageDiv);
    coachChatMessages.scrollTop = coachChatMessages.scrollHeight;
}

// Send message to Backend (FastAPI)
async function sendCoachMessage() {
    const message = coachInput.value.trim();
    if (!message) return;

    // Add user message
    addCoachMessage(message, true);
    coachInput.value = '';

    // UI Loading state
    coachSendBtn.disabled = true;
    coachLoading.style.display = 'block';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: chatHistory
            })
        });

        if (!response.ok) {
            const errorMessage = await buildApiErrorMessage(
                response,
                `HTTP error! status: ${response.status}`
            );
            throw new Error(errorMessage);
        }

        const data = await response.json();
        let cleanResponse = data.response;

        // Strip markdown-style formatting patterns (if backend hasn't already)
        cleanResponse = cleanResponse.replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/__/g, '')
            .replace(/_/g, '')
            .replace(/#/g, '')
            .replace(/`/g, '');

        // Update history
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: cleanResponse });

        // Add bot response
        addCoachMessage(cleanResponse, false);

    } catch (error) {
        console.error('Chat error:', error);
        addCoachMessage(`아 씨발, 뭔 에러냐? 닥치고 다시 해봐. (${error.message})`, false);
    } finally {
        coachLoading.style.display = 'none';
        coachSendBtn.disabled = false;
        coachInput.focus();
    }
}

// Event listeners
if (coachSendBtn) {
    coachSendBtn.addEventListener('click', sendCoachMessage);
}

if (coachInput) {
    coachInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendCoachMessage();
        }
    });
}
