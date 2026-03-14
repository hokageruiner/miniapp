const tg = window.Telegram?.WebApp;
const payload = document.getElementById('payload');
const copyBtn = document.getElementById('copyBtn');
const sendBtn = document.getElementById('sendBtn');
const browserActions = document.getElementById('browserActions');
const browserHint = document.getElementById('browserHint');
const statusText = document.getElementById('statusText');

const isTelegram = Boolean(tg && typeof tg.sendData === 'function');

function setStatus(text) {
  if (statusText) {
    statusText.textContent = text || '';
  }
}

function fillPayload(action) {
  if (action === 'court-template') {
    payload.value = '14 марта 2026 вызов Петра в Московский суд в 14:00 по делу №A21-025/2026 экспертиза №0734К-2026';
  }
  if (action === 'outing-template') {
    payload.value = '0734К-2026 14:00 14.03.2026 город Калининград, улица Красная, дом 7, квартира 10 Залитие потолка эксперт: Иванов кто едет: Петров кто вёз: Lada стоимость экспертизы: 15000 стоимость выезда: 3000';
  }
  if (action === 'today') {
    payload.value = '/today';
  }
  if (action === 'week') {
    payload.value = '/week';
  }
  tg?.HapticFeedback?.impactOccurred('light');
  setStatus('');
}

function copyPayload() {
  const text = payload.value.trim();
  if (!text) {
    setStatus('Сначала заполните текст.');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    setStatus('Текст скопирован.');
    tg?.showAlert?.('Текст скопирован');
  }).catch(() => {
    setStatus('Не удалось скопировать текст.');
  });
}

function sendPayload() {
  const text = payload.value.trim();
  if (!text) {
    setStatus('Сначала заполните текст.');
    return;
  }
  if (!isTelegram) {
    setStatus('Отправка в бота работает только внутри Telegram Mini App.');
    return;
  }
  try {
    tg.sendData(text);
    setStatus('Команда отправлена в бота.');
  } catch (error) {
    console.error(error);
    setStatus('Не удалось отправить данные в бота.');
  }
}

if (isTelegram) {
  tg.ready();
  try {
    tg.expand();
    tg.enableClosingConfirmation();
  } catch (error) {
    console.warn(error);
  }

  if (browserActions) {
    browserActions.hidden = true;
  }
  if (browserHint) {
    browserHint.textContent = 'Внизу Telegram показаны встроенные кнопки «Скопировать» и «Отправить в бота».';
  }

  if (tg.MainButton) {
    tg.MainButton.setParams({
      text: 'Отправить в бота',
      is_visible: true,
      is_active: true,
      has_shine_effect: true,
    });
    tg.MainButton.onClick(sendPayload);
  }

  if (tg.SecondaryButton) {
    tg.SecondaryButton.setParams({
      text: 'Скопировать',
      is_visible: true,
      is_active: true,
      position: 'left',
    });
    tg.SecondaryButton.onClick(copyPayload);
  }
} else {
  setStatus('Открыт обычный браузерный режим. Для отправки в бота откройте Mini App из Telegram.');
}

document.querySelectorAll('.feature-card').forEach((btn) => {
  btn.addEventListener('click', () => fillPayload(btn.dataset.action));
});

copyBtn?.addEventListener('click', copyPayload);
sendBtn?.addEventListener('click', sendPayload);
