// js/typing-game.js
// Typing Challenge — integrated with Firebase Anonymous Auth + Firestore (online Top-5)
// Overwrite your existing js/typing-game.js with this file.

document.addEventListener('DOMContentLoaded', () => {
  /* --- DOM --- */
  const nameSection = document.getElementById('name-section');
  const nameInput = document.getElementById('player-name');
  const saveNameBtn = document.getElementById('save-name');
  const editNameBtn = document.getElementById('edit-name');

  const gameArea = document.getElementById('game-area');
  const targetContainer = document.getElementById('target-container');
  const typeInput = document.getElementById('type-input');
  const newRoundBtn = document.getElementById('new-round');
  const submitAsIsBtn = document.getElementById('submit-as-is');
  const clearInputBtn = document.getElementById('clear-input');

  const timeEl = document.getElementById('time');
  const wpmEl = document.getElementById('wpm');
  const accuracyEl = document.getElementById('accuracy');
  const progressEl = document.getElementById('progress');

  const resultArea = document.getElementById('result-area');
  const resultText = document.getElementById('result-text');
  const resultStats = document.getElementById('result-stats');
  const playAgainBtn = document.getElementById('play-again');
  const closeResultBtn = document.getElementById('close-result');

  const leaderboardBody = document.getElementById('leaderboard-body');

  /* --- sample texts --- */
  const SAMPLE_TEXTS = [
    "The quick brown fox jumps over the lazy dog.",
    "I built a robot that moves pieces on a chessboard.",
    "Practice every day to improve speed and accuracy.",
    "Frontend engineering blends design with code and logic.",
    "Tiny daily improvements add up to massive skill gains."
  ];

  /* --- state --- */
  let playerName = localStorage.getItem('typerName') || "";
  let currentText = "";
  let startTime = null;
  let timerId = null;
  let finished = false;

  // firebase anonymous uid (set after sign-in)
  let firebaseUid = null;

  /* --- small helper: wait for auth to arrive (ms timeout) --- */
  function waitForAuth(timeoutMs = 1500) {
    return new Promise((resolve) => {
      if (firebaseUid) return resolve(true);
      const interval = 100;
      let waited = 0;
      const t = setInterval(() => {
        if (firebaseUid) {
          clearInterval(t);
          return resolve(true);
        }
        waited += interval;
        if (waited >= timeoutMs) {
          clearInterval(t);
          return resolve(false);
        }
      }, interval);
    });
  }

  /* --- Firestore helpers (use window.db if available) --- */
  async function addScoreOnline(scoreObj) {
    try {
      // require a valid firebaseUid (signed-in) before attempting online write
      if (!window.db || !window.db.collection || !firebaseUid) return false;
      await window.db.collection('scores').add(scoreObj);
      return true;
    } catch (err) {
      console.warn('addScoreOnline failed', err);
      return false;
    }
  }

  async function fetchTop5Online() {
    try {
      if (!window.db || !window.db.collection) return null;
      const q = window.db.collection('scores').orderBy('wpm', 'desc').orderBy('when', 'desc').limit(5);
      const snap = await q.get();
      const arr = snap.docs.map(d => d.data());
      return arr;
    } catch (err) {
      console.warn('fetchTop5Online failed', err);
      return null;
    }
  }

  /* --- helpers: leaderboard storage (robust) --- */
  function getScores() {
    try {
      const raw = localStorage.getItem('typerScores');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      localStorage.removeItem('typerScores');
      return [];
    }
  }
  function saveScores(scores) {
    try {
      localStorage.setItem('typerScores', JSON.stringify(scores));
    } catch (e) {
      console.warn('Could not save scores to localStorage', e);
    }
  }

  function addScoreLocal(obj) {
    const scores = getScores();
    scores.push(obj);
    scores.sort((a,b) => (b.wpm - a.wpm) || (new Date(b.when) - new Date(a.when)));
    const top = scores.slice(0, 5);
    saveScores(top);
    return top;
  }

  function renderLeaderboardFromArray(scores) {
    leaderboardBody.innerHTML = "";
    if (!scores || scores.length === 0) {
      leaderboardBody.innerHTML = `<tr><td colspan="5" style="color:var(--muted)">No scores yet</td></tr>`;
      return;
    }
    scores.forEach((s, idx) => {
      const when = s.when ? new Date(s.when) : new Date();
      const whenStr = when.toLocaleString();
      const row = document.createElement('tr');
      row.innerHTML = `<td>${idx+1}</td><td>${escapeHtml(s.name)}</td><td>${s.wpm}</td><td>${s.accuracy}%</td><td style="font-size:.78rem;color:var(--muted)">${whenStr}</td>`;
      leaderboardBody.appendChild(row);
    });
  }

  function renderLeaderboard() {
    // try online first (non-blocking)
    fetchTop5Online().then(online => {
      if (online && Array.isArray(online) && online.length > 0) {
        renderLeaderboardFromArray(online);
      } else {
        const scores = getScores();
        if (!scores || scores.length === 0) {
          leaderboardBody.innerHTML = `<tr><td colspan="5" style="color:var(--muted)">No scores yet</td></tr>`;
          return;
        }
        renderLeaderboardFromArray(scores);
      }
    }).catch(() => {
      const scores = getScores();
      renderLeaderboardFromArray(scores);
    });
  }

  /* --- escape helper for safety in table output --- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  }

  /* --- auth setup: anonymous sign-in --- */
  if (window.firebase && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        firebaseUid = user.uid;
        // console.log('Signed in anonymously, uid:', firebaseUid);
      } else {
        firebase.auth().signInAnonymously().catch(err => {
          console.warn('Anonymous sign-in failed', err);
        });
      }
    });
  } else {
    console.warn('firebase.auth not available; ensure you included firebase-auth.js in HTML');
  }

  /* --- name handling --- */
  function showNameUI() {
    if (playerName) {
      const hint = nameSection.querySelector('.hint');
      if (hint) hint.textContent = `Playing as: ${playerName}`;
      nameInput.value = playerName;
      nameInput.style.display = 'none';
      saveNameBtn.style.display = 'none';
      editNameBtn.style.display = 'inline-block';
      startGameUI();
    } else {
      const hint = nameSection.querySelector('.hint');
      if (hint) hint.textContent = 'Your name is stored in your browser. No login required.';
      nameInput.style.display = '';
      saveNameBtn.style.display = '';
      editNameBtn.style.display = 'none';
      gameArea.hidden = true;
    }
  }

  saveNameBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (!val) {
      alert('Please enter a name (or a short nickname).');
      nameInput.focus();
      return;
    }
    playerName = val;
    localStorage.setItem('typerName', playerName);
    showNameUI();
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveNameBtn.click();
    }
  });

  editNameBtn.addEventListener('click', () => {
    nameInput.style.display = '';
    saveNameBtn.style.display = '';
    editNameBtn.style.display = 'none';
    gameArea.hidden = true;
    nameInput.focus();
  });

  /* --- start UI/game show --- */
  function startGameUI() {
    nameSection.style.display = '';
    gameArea.hidden = false;
    pickNewSentence();
    renderLeaderboard();
  }

  /* --- pick and render target text as char spans --- */
  function pickNewSentence() {
    currentText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    renderTarget(currentText);
    resetInput();
  }

  function renderTarget(text) {
    targetContainer.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'char';
      span.dataset.index = i;
      span.dataset.char = text[i];
      span.textContent = text[i] === ' ' ? '␣' : text[i];
      if (text[i] === ' ') span.title = 'space';
      targetContainer.appendChild(span);
    }
    markCurrent(0);
  }

  function markCurrent(idx) {
    const chars = targetContainer.querySelectorAll('.char');
    chars.forEach(c => c.classList.remove('current'));
    if (chars[idx]) chars[idx].classList.add('current');
  }

  function resetInput() {
    typeInput.value = '';
    startTime = null;
    finished = false;
    timeEl.textContent = '0.0s';
    wpmEl.textContent = '0';
    accuracyEl.textContent = '0%';
    progressEl.textContent = '0%';
    targetContainer.querySelectorAll('.char').forEach(c => { c.classList.remove('correct','incorrect','current'); });
    markCurrent(0);
    clearInterval(timerId);
    timerId = null;
    typeInput.disabled = false;
    setTimeout(() => typeInput.focus(), 50);
  }

  /* --- typing handling & metrics --- */
  function countCorrect(typed, target) {
    const n = Math.min(typed.length, target.length);
    let correct = 0;
    for (let i = 0; i < n; i++) {
      if (typed[i] === target[i]) correct++;
    }
    return correct;
  }

  function updateUIFromInput() {
    const typed = typeInput.value;
    if (typed.length > currentText.length) {
      typeInput.value = typed.slice(0, currentText.length);
      return;
    }
    const typedNow = typeInput.value;
    const chars = targetContainer.querySelectorAll('.char');
    for (let i = 0; i < chars.length; i++) {
      chars[i].classList.remove('correct','incorrect');
      const expected = currentText[i];
      const got = typedNow[i];
      if (typeof got === 'undefined') { }
      else if (got === expected) chars[i].classList.add('correct');
      else chars[i].classList.add('incorrect');
    }
    markCurrent(typedNow.length);

    const correctChars = countCorrect(typedNow, currentText);
    const typedLen = typedNow.length;
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0.001;
    const wpm = Math.max(0, Math.round((correctChars * 60) / (5 * Math.max(0.001, elapsed))));
    const accuracy = typedLen > 0 ? Math.round((correctChars / typedLen) * 100) : 100;
    const progress = Math.round((correctChars / currentText.length) * 100);

    timeEl.textContent = elapsed.toFixed(1) + 's';
    wpmEl.textContent = wpm;
    accuracyEl.textContent = accuracy + '%';
    progressEl.textContent = progress + '%';

    // automatic finish when all characters typed AND all correct
    if (!finished && typedNow.length === currentText.length) {
      if (correctChars === currentText.length) {
        finished = true;
        if (!startTime) startTime = Date.now();
        setTimeout(() => finalizeRun({ forced: false }), 50);
      }
    }
  }

  /* finalize: either exact finish or submit-as-is */
  async function finalizeRun({ forced }) {
    clearInterval(timerId);
    timerId = null;
    typeInput.disabled = true;

    const typed = typeInput.value;
    const correctChars = countCorrect(typed, currentText);
    const elapsed = Math.max(0.001, (startTime ? (Date.now() - startTime) / 1000 : 0.001));
    const finalWpm = Math.round((correctChars * 60) / (5 * elapsed));
    const finalAccuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 0;

    if (typed.length < 3) {
      resultText.textContent = "You typed too little — try again.";
      resultStats.innerHTML = `<div>WPM: ${finalWpm}</div><div>Accuracy: ${finalAccuracy}%</div>`;
      resultArea.hidden = false;
      return;
    }

    // include typedLen and elapsed for future server-side/heuristic checks
    const typedLen = typed.length;
    const elapsedSecs = elapsed;

    const scoreObj = {
      uid: firebaseUid || null,
      name: playerName || 'Anonymous',
      wpm: finalWpm,
      accuracy: finalAccuracy,
      when: new Date().toISOString(),
      device: (/Mobi|Android/i.test(navigator.userAgent)) ? 'mobile' : 'desktop',
      userAgent: navigator.userAgent,
      typedLen,
      elapsed: elapsedSecs
    };

    // Try online first but wait briefly for auth if needed (so we don't miss quick sign-in)
    let savedOnline = false;
    try {
      const authReady = await waitForAuth(1500); // wait up to 1.5s for auth to complete
      if (authReady && firebaseUid) {
        savedOnline = await addScoreOnline(scoreObj);
      } else {
        savedOnline = false;
      }
    } catch (e) {
      savedOnline = false;
    }

    if (savedOnline) {
      const onlineTop = await fetchTop5Online();
      if (onlineTop && onlineTop.length > 0) {
        renderLeaderboardFromArray(onlineTop);
      } else {
        addScoreLocal(scoreObj);
        renderLeaderboard();
      }
    } else {
      const newTop = addScoreLocal(scoreObj);
      renderLeaderboard();
    }

    const newTop = getScores();
    const rank = newTop.findIndex(s => s.when === scoreObj.when) + 1;
    const finishedText = forced ? 'Submitted (as-is)' : 'Finished!';
    resultText.textContent = `${finishedText} — Well done, ${playerName || 'Player'}!`;
    resultStats.innerHTML = `<div><strong>WPM:</strong> ${finalWpm}</div><div><strong>Accuracy:</strong> ${finalAccuracy}%</div>${rank ? `<div style="margin-left:8px"><strong>Rank:</strong> #${rank} (Top 5)</div>` : ''}`;
    resultArea.hidden = false;

    setTimeout(() => {
      const btn = resultArea.querySelector('#play-again');
      if (btn) btn.focus();
    }, 80);
  }

  /* --- input events --- */
  typeInput.addEventListener('input', () => {
    if (!startTime) {
      startTime = Date.now();
      timerId = setInterval(() => {
        updateUIFromInput();
      }, 150);
    }
    updateUIFromInput();
  });

  // prevent paste to discourage cheating
  typeInput.addEventListener('paste', (e) => {
    e.preventDefault();
  });

  submitAsIsBtn.addEventListener('click', () => {
    if (!startTime) {
      alert('Type something first.');
      return;
    }
    finished = true;
    finalizeRun({ forced: true });
  });

  newRoundBtn.addEventListener('click', () => {
    pickNewSentence();
    typeInput.focus();
  });

  clearInputBtn.addEventListener('click', () => {
    typeInput.value = '';
    updateUIFromInput();
    typeInput.focus();
  });

  // result actions
  playAgainBtn.addEventListener('click', () => {
    resultArea.hidden = true;
    pickNewSentence();
    typeInput.focus();
  });
  closeResultBtn.addEventListener('click', () => {
    resultArea.hidden = true;
  });

  /* init on page load */
  function init() {
    if (playerName) {
      showNameUI();
    } else {
      nameSection.style.display = '';
      gameArea.hidden = true;
      nameInput.focus();
    }
    renderLeaderboard();
  }

  init();

}); // DOMContentLoaded end
