/* ===== Devil Coach Logic ===== */
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const coachBtn = document.getElementById("coachBtn");
const coachResult = document.getElementById("coachResult");

// Obfuscated API Key
const _p1 = "QUl6YVN5Qw=="; // AIzaSyC
const _p2 = "ZzNMUndkNQ=="; // g3LRwd5
const _p3 = "ZHlVRHJZeg=="; // dyUDrYz
const _p4 = "dXlYMk9WeQ=="; // uyX2OVz
const _p5 = "M1NUM1lFUQ=="; // 3ST3YEQ
const _p6 = "Rm5jNA==";     // Fnc4

function getSecret() {
    return atob(_p1) + atob(_p2) + atob(_p3) + atob(_p4) + atob(_p5) + atob(_p6); // Reassemble
}

if (coachBtn) {
    coachBtn.addEventListener("click", async () => {
        // const apiKey = document.getElementById("apiKeyInput").value.trim(); // Removed
        const apiKey = getSecret();

        const goal = document.getElementById("goalInput").value.trim();
        const excuse = document.getElementById("excuseInput").value.trim();

        if (!goal) {
            alert("목표도 없나? 당장 목표 거리를 적어라!");
            return;
        }

        // UI Loading state
        coachBtn.disabled = true;
        coachBtn.textContent = "훈련 교관 호출 중... (Calling Coach)";
        coachResult.style.display = "block";
        coachResult.textContent = "교관이 네놈의 변명을 듣고 오고 있다...\n(Fetching response...)";

        try {
            // Initialize Gemini API
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
        당신은 "Devil Coach"라고 불리는 악명 높은 러닝 훈련 교관입니다.
        사용자의 목표 거리와 변명을 듣고, 거친 욕설과 강한 어조로 정신 교육을 시켜야 합니다.
        하지만 단순히 욕만 하는 게 아니라, 결국엔 뛰러 나가게끔 강력한 동기를 부여해야 합니다.
        말투: 반말, 군대 교관 스타일, 욕설 섞임, 매우 거침.
        
        [사용자 정보]
        목표: ${goal}
        변명: ${excuse}
        
        [지시 사항]
        1. 사용자의 변명을 처참하게 비난하십시오.
        2. 당장 목표(${goal})를 완수하라고 소리치십시오.
        3. 짧고 굵게 (300자 이내) 답변하십시오.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Typing effect for the result
            typeWriter(text, coachResult);

        } catch (error) {
            console.error(error);
            coachResult.textContent = `[ERROR] 통신 오류다! 네트워크 상태 확인 안 하나? \n(${error.message})`;
        } finally {
            coachBtn.disabled = false;
            coachBtn.textContent = "정신 교육 받기 (Get Motivated)";
        }
    });
}

function typeWriter(text, element) {
    element.textContent = "";
    let i = 0;
    const speed = 30; // ms

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}
