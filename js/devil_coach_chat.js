/* ===== Devil Coach Chat Integration ===== */

const coachInput = document.getElementById('coachInput');
const coachSendBtn = document.getElementById('coachSendBtn');
const coachChatMessages = document.getElementById('coachChatMessages');
const coachLoading = document.getElementById('coachLoading');

let chatHistory = [];

// Add message to chat
function addCoachMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'coach-message';
    messageDiv.style.cssText = `
        background: ${isUser ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)'};
        padding: 12px 15px;
        border-radius: 10px;
        max-width: 80%;
        align-self: ${isUser ? 'flex-end' : 'flex-start'};
        animation: fadeIn 0.3s ease-in;
        color: #fff;
        line-height: 1.5;
        font-size: 14px;
        word-break: break-word;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    messageDiv.textContent = content;

    console.log(`Adding message: ${content.substring(0, 20)}... (User: ${isUser})`);
    coachChatMessages.appendChild(messageDiv);
    coachChatMessages.scrollTop = coachChatMessages.scrollHeight;
}

// Send message to backend
async function sendCoachMessage() {
    const message = coachInput.value.trim();

    if (!message) return;

    // Add user message
    addCoachMessage(message, true);
    coachInput.value = '';

    // Disable input
    coachSendBtn.disabled = true;
    coachLoading.style.display = 'block';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        let cleanResponse = data.response;

        // Strip markdown-style formatting patterns completely
        cleanResponse = cleanResponse.replace(/\*\*/g, '') // bold
            .replace(/\*/g, '')  // italics/bullets
            .replace(/__/g, '')  // bold 2
            .replace(/_/g, '')   // italics 2
            .replace(/#/g, '')   // headers
            .replace(/`/g, '');  // code

        // Update history
        chatHistory.push({
            role: 'user',
            content: message
        });
        chatHistory.push({
            role: 'assistant',
            content: cleanResponse
        });

        // Add bot response
        addCoachMessage(cleanResponse, false);

    } catch (error) {
        console.error('Chat error:', error);

        // Provide specific error messages
        let errorMessage = '아 씨발, 서버가 뒤졌네. ';

        if (error.message && error.message.includes('Failed to fetch')) {
            errorMessage += 'API 서버 연결 실패. 백엔드(포트 8000) 확인해봐.';
        } else if (error.message && error.message.includes('500')) {
            errorMessage += 'API 키 확인하고 다시 시도해봐.';
        } else {
            errorMessage += `에러: ${error.message || '알 수 없는 오류'}`;
        }

        addCoachMessage(errorMessage, false);
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
