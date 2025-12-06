// Alle Validierungsfunktionen zusammenfassen
function doValidations() {
    validateLebensmittelName();
    validateLebensmittelMenge();
    validateEinheit();
    validateKalorienZiel();
}

// Fehler zurücksetzen
function clearValidationErrors() {
    document.getElementById('errorLebensmittelName').innerText = '';
    document.getElementById('errorLebensmittelMenge').innerText = '';
    document.getElementById('errorEinheit').innerText = '';
    document.getElementById('errorKalorienZiel').innerText = '';
    document.getElementById("errorAPI").innerText = '';

    document.getElementById('lebensmittelName').classList.remove('inputError');
    document.getElementById('lebensmittelMenge').classList.remove('inputError');
    document.getElementById('einheit').classList.remove('inputError');
    document.getElementById('kalorienZiel').classList.remove('inputError');
}

// Prüfen, ob Validierungsfehler vorhanden sind
function hasValidationErrors() {
    return document.getElementById('errorLebensmittelName').innerText !== '' ||
        document.getElementById('errorLebensmittelMenge').innerText !== '' ||
        document.getElementById('errorEinheit').innerText !== '' ||
        document.getElementById('errorKalorienZiel').innerText !== '';
}

// Alle Validierungen
function validateKalorienZiel() {
    let kalorienziel = document.getElementById('kalorienZiel');
    let errorKalorienZiel = document.getElementById('errorKalorienZiel');
    let ziel = parseFloat(kalorienziel.value);

    if (kalorienziel.value.trim() === '') {
        kalorienziel.classList.add('inputError');
        errorKalorienZiel.innerText = "Das Kalorienziel muss mit einer gültigen Zahl ausgefüllt sein.";
    }
    else if (isNaN(ziel) || ziel <= 0 || ziel > 10000) {
        kalorienziel.classList.add('inputError');
        errorKalorienZiel.innerText = "Das Kalorienziel muss grösser als 0 und maximal 10'000 kcal sein.";
    }
    else {
        errorKalorienZiel.innerText = '';
        kalorienziel.classList.remove('inputError');
    }
}

function validateLebensmittelName() {
    let name = document.getElementById('lebensmittelName');
    let errorName = document.getElementById('errorLebensmittelName');

    if (name.value.trim() === '') {
        name.classList.add('inputError');
        errorName.innerText = "Bitte einen Lebensmittelnamen eingeben";
    } else if (!/^[a-zA-Z\s]+$/.test(name.value)) {
        name.classList.add('inputError');
        errorName.innerText = "Nur Buchstaben und Leerzeichen erlaubt.";
    } else {
        errorName.innerText = '';
        name.classList.remove('inputError');
    }
}

function validateLebensmittelMenge() {
    let menge = document.getElementById('lebensmittelMenge');
    let errorMenge = document.getElementById('errorLebensmittelMenge');
    let value = parseFloat(menge.value);

    if (menge.value.trim() === '') {
        menge.classList.add('inputError');
        errorMenge.innerText = "Die Menge muss mit einer gültigen Zahl ausgefüllt sein.";
    } else if (isNaN(value) || value <= 0) {
        menge.classList.add('inputError');
        errorMenge.innerText = "Die Menge muss eine Zahl grösser als 0 sein.";
    } else {
        errorMenge.innerText = '';
        menge.classList.remove('inputError');
    }
}

function validateEinheit() {
    let einheit = document.getElementById('einheit');
    let errorEinheit = document.getElementById('errorEinheit');

    if (!einheit.value) {
        einheit.classList.add('inputError');
        errorEinheit.innerText = "Bitte eine Einheit auswählen.";
    } else {
        errorEinheit.innerText = '';
        einheit.classList.remove('inputError');
    }
}

let gespeicherteLebensmittel = [];

function lebensmittelHinzufuegen() {
    clearValidationErrors();
    doValidations();
    if (hasValidationErrors()) {
    return;
    }
    let lebensmittelName = document.getElementById("lebensmittelName").value.trim();
    let lebensmittelMenge = document.getElementById("lebensmittelMenge").value;
    let einheit = document.getElementById("einheit").value;
    let kalorienZiel = document.getElementById("kalorienZiel").value;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "Kalorientracker.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
        let output = document.getElementById("errorAPI");
        let response = parseJsonHelper(xhr.responseText);

        if (xhr.status === 200 && response) {
            if (response.error) {
                output.innerText = response.error;
            } else {
                gespeicherteLebensmittel = response.lebensmittelListe;
                aktualisiereAnzeige(kalorienZiel, response.zusammenfassung);
                output.innerText = "";
            }
        } else if (xhr.status === 400 && response && response.error) {
            output.innerText = response.error;
        } else if (xhr.status === 500 && response && response.error) {
            output.innerText = response.error; // Fehler beim Abrufen der API-Daten
        } else {
            output.innerText = `Fehler: ${xhr.status} ${xhr.statusText}`;
        }
    };

    xhr.onerror = function () {
        let output = document.getElementById("errorAPI");
        output.innerText = "Netzwerkfehler: Anfrage konnte nicht gesendet werden.";
    };

    xhr.ontimeout = function () {
        let output = document.getElementById("errorAPI");
        output.innerText = "Zeitüberschreitung: Der Server hat zu lange gebraucht.";
    };

    xhr.timeout = 5000;
    let requestData = JSON.stringify({ lebensmittelName, lebensmittelMenge, einheit, kalorienZiel });
    xhr.send(requestData);
}

function resetLebensmittelListe() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "Kalorientracker.php?reset=true", true);

    xhr.onload = function () {
        let output = document.getElementById("errorAPI");
        let response = parseJsonHelper(xhr.responseText);

        if (xhr.status === 200 && response) {
            gespeicherteLebensmittel = [];
            document.getElementById("food-list").innerHTML = `<li>Keine Lebensmittel hinzugefügt.</li>`;
            aktualisiereGesamtdaten(0, response.zusammenfassung || { kalorien: 0, fett: 0, eiweiss: 0, kohlenhydrate: 0 });
            output.innerText = "";
        } else if (xhr.status === 400) {
            output.innerText = "Fehlerhafte Anfrage. Bitte erneut versuchen.";
        } else {
            output.innerText = `Fehler: ${xhr.status} ${xhr.statusText}`;
        }
    };

    xhr.onerror = function () {
        let output = document.getElementById("errorAPI");
        output.innerText = "Netzwerkfehler: Anfrage konnte nicht gesendet werden.";
    };

    xhr.ontimeout = function () {
        let output = document.getElementById("errorAPI");
        output.innerText = "Zeitüberschreitung: Der Server hat zu lange gebraucht.";
    };

    xhr.timeout = 5000;
    xhr.send();
}

function zeigeKalorienZielCookie() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "Kalorientracker.php", true);

    xhr.onload = function () {
        let output = document.getElementById("cookieInfo");
        let response = parseJsonHelper(xhr.responseText);

        if (xhr.status === 200 && response) {
            output.innerHTML = `<p><strong>Dein letztes Kalorienziel war: </strong> ${response.cookieKalorienZiel || "Kein Cookie gesetzt"}</p>`;
        } else {
            output.innerHTML = `<p>Fehler: ${xhr.status} ${xhr.statusText}</p>`;
        }
    };

    xhr.onerror = function () {
        let output = document.getElementById("cookieInfo");
        output.innerHTML = `<p>Netzwerkfehler: Cookie konnte nicht abgerufen werden.</p>`;
    };

    xhr.ontimeout = function () {
        let output = document.getElementById("cookieInfo");
        output.innerHTML = `<p>Das Cookie konnte nicht abgerufen werden.</p>`;
    };

    xhr.timeout = 5000;
    xhr.send();
}

function parseJsonHelper(text) {
    try {
        return JSON.parse(text);
    } catch (error) {
        return null;
    }
}

window.onload = function () {
    resetLebensmittelListe();
    zeigeKalorienZielCookie();
    initAndyGame();
};

function aktualisiereAnzeige(kalorienZiel, summen = { kalorien: 0, fett: 0, eiweiss: 0, kohlenhydrate: 0 }) {
    let foodList = document.getElementById("food-list");

    if (gespeicherteLebensmittel.length === 0) {
        foodList.innerHTML = `<li>Keine Lebensmittel hinzugefügt.</li>`;
    } else {
        foodList.innerHTML = gespeicherteLebensmittel
            .map((item, index) => `
                <li class="item-container">
                    <div class="item-text">
                        <strong>${item.name}</strong> <br>
                        <span>Kalorien: ${item.kalorien.toFixed(2)} kcal, Fett: ${item.fett.toFixed(2)} g, Eiweiss: ${item.eiweiss.toFixed(2)} g, Kohlenhydrate: ${item.kohlenhydrate.toFixed(2)} g</span>
                    </div>
                </li>
            `).join('');
    }
    aktualisiereGesamtdaten(kalorienZiel, summen);
}

function aktualisiereGesamtdaten(kalorienZiel = 0, summen = { kalorien: 0, fett: 0, eiweiss: 0, kohlenhydrate: 0 }) {
    let verbleibendeKalorien = Math.max(0, kalorienZiel - (summen.kalorien || 0)).toFixed(2);

    zeichneFortschrittskreis(summen.kalorien || 0, kalorienZiel || 1);

    document.getElementById("result").innerHTML = `
        <p><strong>Aufgenommene Nährwerte:</strong></p>
        <p>Kalorien: ${summen.kalorien.toFixed(2)} kcal</p>
        <p>Fett: ${summen.fett.toFixed(2)} g</p>
        <p>Eiweiss: ${summen.eiweiss.toFixed(2)} g</p>
        <p>Kohlenhydrate: ${summen.kohlenhydrate.toFixed(2)} g</p>
        <p><strong>Kalorienziel:</strong> ${kalorienZiel} kcal</p>
        <p><strong>Verbleibende Kalorien:</strong> ${verbleibendeKalorien} kcal</p>
    `;
}

// Navigation für kleine Bildschirme
function toggleNavbar() {
    let navbar = document.getElementById("small-navbar");
    navbar.classList.toggle("w3-hide");
}
function closeNavbar() {
    let navbar = document.getElementById("small-navbar");
    navbar.classList.add("w3-hide");
}

// Canvas
function zeichneFortschrittskreis(kalorien = 0, kalorienZiel = 1) {
    let canvas = document.getElementById('progressCanvas');
    let ctx = canvas.getContext("2d");
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let radius = 70;
    let kalorienProzent = kalorienZiel > 0 ? Math.min((kalorien / kalorienZiel), 1) : 0;
    let endAngle = Math.PI * 2 * kalorienProzent;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e6e6e6';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Fortschrittsbereich zeichnen
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + endAngle, false);
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    let innerRadius = radius - 20;
    for (let i = 0; i < 12; i++) {
        let angle = (Math.PI * 2 / 12) * i;
        let x1 = centerX + Math.cos(angle) * innerRadius;
        let y1 = centerY + Math.sin(angle) * innerRadius;
        let x2 = centerX + Math.cos(angle) * radius;
        let y2 = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    ctx.font = '18px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(kalorienProzent * 100).toFixed(0)}%`, centerX, centerY);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Andy-Reaktionstest
let andyGame = {
    score: 0,
    best: 0,
    timeLeft: 20,
    running: false,
    moveTimer: null,
    countdownTimer: null
};

function initAndyGame() {
    const startBtn = document.getElementById('andy-start');
    const target = document.getElementById('andy-target');
    if (!startBtn || !target) {
        return;
    }
    startBtn.addEventListener('click', startAndyGame);
    target.addEventListener('click', hitAndy);
    updateAndyDisplay();
}

function startAndyGame() {
    if (andyGame.running) return;

    andyGame.running = true;
    andyGame.score = 0;
    andyGame.timeLeft = 20;
    document.getElementById('andy-status').innerText = 'Fang Andy so oft wie möglich!';
    document.getElementById('andy-start').disabled = true;
    moveAndyTarget();
    updateAndyDisplay();

    andyGame.countdownTimer = setInterval(() => {
        andyGame.timeLeft -= 1;
        updateAndyDisplay();
        if (andyGame.timeLeft <= 0) {
            endAndyGame();
        }
    }, 1000);

    andyGame.moveTimer = setInterval(moveAndyTarget, 900);
}

function hitAndy() {
    if (!andyGame.running) return;
    andyGame.score += 1;
    updateAndyDisplay();
    moveAndyTarget();
}

function moveAndyTarget() {
    const playground = document.getElementById('andy-playground');
    const target = document.getElementById('andy-target');
    if (!playground || !target) return;

    const areaWidth = playground.clientWidth;
    const areaHeight = playground.clientHeight;
    const targetWidth = target.offsetWidth;
    const targetHeight = target.offsetHeight;

    const maxLeft = Math.max(0, areaWidth - targetWidth);
    const maxTop = Math.max(0, areaHeight - targetHeight);

    const newLeft = Math.floor(Math.random() * maxLeft);
    const newTop = Math.floor(Math.random() * maxTop);

    target.style.left = `${newLeft}px`;
    target.style.top = `${newTop}px`;
}

function endAndyGame() {
    clearInterval(andyGame.moveTimer);
    clearInterval(andyGame.countdownTimer);
    andyGame.running = false;
    if (andyGame.score > andyGame.best) {
        andyGame.best = andyGame.score;
    }
    updateAndyDisplay();
    document.getElementById('andy-start').disabled = false;
    document.getElementById('andy-status').innerText = `Fertig! Du hast Andy ${andyGame.score}x erwischt.`;
}

function updateAndyDisplay() {
    const scoreEl = document.getElementById('andy-score');
    const timeEl = document.getElementById('andy-time');
    const bestEl = document.getElementById('andy-best');

    if (scoreEl) scoreEl.innerText = andyGame.score;
    if (timeEl) timeEl.innerText = Math.max(0, andyGame.timeLeft);
    if (bestEl) bestEl.innerText = andyGame.best;
}
