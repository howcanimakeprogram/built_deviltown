/* ===== Devil Coach Gemini Integration ===== */
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const coachInput = document.getElementById('coachInput');
const coachSendBtn = document.getElementById('coachSendBtn');
const coachChatMessages = document.getElementById('coachChatMessages');
const coachLoading = document.getElementById('coachLoading');

// Obfuscated API Key: AIzaSyCg3LRwd5dyUDrYzuyX2OVz3ST3YEQFnc4
const _p1 = "QUl6YVN5Q2czTFJ3ZDVk"; // AIzaSyCg3LRwd5d
const _p2 = "eVVEcll6dXlYMk9WejNT"; // yUDrYzuyX2OVz3S
const _p3 = "VDNZRVFGbmM0";         // T3YEQFnc4

function getSecret() {
    return atob(_p1) + atob(_p2) + atob(_p3);
}

let chatHistory = [];

// Add message to chat
function addCoachMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        background: ${isUser ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)'};
        padding: 12px 15px;
        border-radius: 10px;
        max-width: 80%;
        align-self: ${isUser ? 'flex-end' : 'flex-start'};
        animation: fadeIn 0.3s ease-in;
        word-break: break-word;
        line-height: 1.5;
    `;
    messageDiv.textContent = content;

    coachChatMessages.appendChild(messageDiv);
    coachChatMessages.scrollTop = coachChatMessages.scrollHeight;
}

// Send message to Gemini
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
        const apiKey = getSecret();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build history-aware prompt or just simple context
        // For simplicity and to stick to the persona, we include the persona in every hit or just at start
        // Persona description
        const persona = `
            당신은 "Devil Coach"라고 불리는 악명 높은 러닝 훈련 교관입니다.
            당신은 동네 아저씨 같으면서도 말이 매우 거칠고, 욕설을 서슴지 않습니다.
            상대방이 뛰기 싫어하거나 변명을 대면 처참하게 짓밟고 비웃으십시오.
            하지만 결국엔 상대를 뛰게 만드는 묘한 동기부여 능력이 있어야 합니다.
            말투: 반말, 쌍욕 허용(씨발, 병신, 새끼 등), 거친 말투, 하지만 속마음은 러닝 열정 가득.
        `;

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const fullPrompt = chatHistory.length === 0
            ? `${persona}\n\n사용자의 첫 질문: ${message}`
            : message;

        const result = await chat.sendMessage(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Update history
        chatHistory.push({ role: 'user', parts: [{ text: message }] });
        chatHistory.push({ role: 'model', parts: [{ text: text }] });

        // Add bot response
        addCoachMessage(text, false);

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
