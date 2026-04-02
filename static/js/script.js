const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const prizesInput = document.getElementById("prizesInput");
const playersInput = document.getElementById("playersInput");

const updateBtn = document.getElementById("updateBtn");
const spinBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");

const resultPrize = document.getElementById("resultPrize");
const resultPlayer = document.getElementById("resultPlayer");
const historyTableBody = document.getElementById("historyTableBody");

let prizes = [...initialPrizes];
let players = [...initialPlayers];
let winners = [];

let wheelItems = [...prizes];
let currentAngle = 0;
let isSpinning = false;

const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#84cc16",
    "#14b8a6"
];

function getListFromTextarea(textarea) {
    return textarea.value
        .split("\n")
        .map(item => item.trim())
        .filter(item => item !== "");
}

function getRemainingPrizes(allPrizes, winnerList) {
    const used = new Set(winnerList.map(item => item.prize));
    return allPrizes.filter(prize => !used.has(prize));
}

function getRemainingPlayers(allPlayers, winnerList) {
    const used = new Set(winnerList.map(item => item.player));
    return allPlayers.filter(player => !used.has(player));
}

function drawWheel(items = wheelItems) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 220;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (items.length === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#d1d5db";
        ctx.fill();

        ctx.fillStyle = "#111827";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("已抽完", centerX, centerY);
        return;
    }

    const arcSize = (Math.PI * 2) / items.length;

    for (let i = 0; i < items.length; i++) {
        const startAngle = currentAngle + i * arcSize;
        const endAngle = startAngle + arcSize;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);

        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial";
        ctx.fillText(items[i], radius - 18, 6);

        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();
}

function renderHistory() {
    historyTableBody.innerHTML = "";

    winners.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.prize}</td>
            <td>${item.player}</td>
        `;
        historyTableBody.appendChild(tr);
    });
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function updateDataFromInputs() {
    prizes = getListFromTextarea(prizesInput);
    players = getListFromTextarea(playersInput);
    wheelItems = getRemainingPrizes(prizes, winners);
    currentAngle = 0;
    drawWheel(wheelItems);
}

async function spinWheel() {
    if (isSpinning) return;

    prizes = getListFromTextarea(prizesInput);
    players = getListFromTextarea(playersInput);

    if (prizes.length === 0) {
        alert("請至少輸入一個獎品");
        return;
    }

    if (players.length === 0) {
        alert("請至少輸入一位抽獎者");
        return;
    }

    const remainingPrizes = getRemainingPrizes(prizes, winners);
    const remainingPlayers = getRemainingPlayers(players, winners);

    if (remainingPrizes.length === 0) {
        alert("所有獎品都已抽完");
        return;
    }

    if (remainingPlayers.length === 0) {
        alert("所有抽獎者都已中獎");
        return;
    }

    wheelItems = remainingPrizes;
    drawWheel(wheelItems);

    isSpinning = true;
    spinBtn.disabled = true;
    updateBtn.disabled = true;
    resetBtn.disabled = true;

    resultPrize.textContent = "獎品：抽獎中...";
    resultPlayer.textContent = "得獎者：抽獎中...";

    try {
        const response = await fetch("/spin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prizes: prizes,
                players: players,
                winners: winners
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "抽獎失敗");
            isSpinning = false;
            spinBtn.disabled = false;
            updateBtn.disabled = false;
            resetBtn.disabled = false;
            return;
        }

        const winnerPrize = data.winner_prize;
        const winnerPlayer = data.winner_player;
        const wheelIndex = data.wheel_index;
        const currentWheelItems = data.remaining_prizes;

        wheelItems = currentWheelItems;

        const arcSize = (Math.PI * 2) / wheelItems.length;
        const targetAngle =
            (Math.PI * 2 * 6) +
            (Math.PI * 1.5) -
            (wheelIndex * arcSize + arcSize / 2);

        const startAngle = currentAngle;
        const duration = 4000;
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            currentAngle = startAngle + (targetAngle - startAngle) * eased;
            drawWheel(wheelItems);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                currentAngle = targetAngle % (Math.PI * 2);
                drawWheel(wheelItems);

                winners.push({
                    prize: winnerPrize,
                    player: winnerPlayer
                });

                resultPrize.textContent = `獎品：${winnerPrize}`;
                resultPlayer.textContent = `得獎者：${winnerPlayer}`;

                renderHistory();

                wheelItems = getRemainingPrizes(prizes, winners);
                currentAngle = 0;
                drawWheel(wheelItems);

                isSpinning = false;
                spinBtn.disabled = false;
                updateBtn.disabled = false;
                resetBtn.disabled = false;
            }
        }

        requestAnimationFrame(animate);

    } catch (error) {
        alert("發生錯誤：" + error);
        isSpinning = false;
        spinBtn.disabled = false;
        updateBtn.disabled = false;
        resetBtn.disabled = false;
    }
}

updateBtn.addEventListener("click", () => {
    updateDataFromInputs();
    resultPrize.textContent = "獎品：名單已更新";
    resultPlayer.textContent = "得獎者：等待抽獎";
});

spinBtn.addEventListener("click", spinWheel);

resetBtn.addEventListener("click", () => {
    winners = [];
    resultPrize.textContent = "獎品：尚未抽獎";
    resultPlayer.textContent = "得獎者：尚未抽獎";
    renderHistory();
    updateDataFromInputs();
});

updateDataFromInputs();
renderHistory();