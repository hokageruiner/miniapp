const tg = window.Telegram.WebApp;
const payload = document.getElementById('payload');
const copyBtn = document.getElementById('copyBtn');
const sendBtn = document.getElementById('sendBtn');

tg.ready();
try {
  tg.expand();
  tg.enableClosingConfirmation();
  if (tg.MainButton) {
    tg.MainButton.setParams({
      text: 'Отправить в бота',
      is_visible: true,
      has_shine_effect: true,
    });
    tg.MainButton.onClick(() => sendPayload());
  }
  if (tg.SecondaryButton) {
    tg.SecondaryButton.setParams({
      text: 'Скопировать',
      is_visible: true,
      position: 'left',
    });
    tg.SecondaryButton.onClick(() => copyPayload());
  }
} catch (e) {
  console.warn(e);
}

document.querySelectorAll('.feature-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
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
    tg.HapticFeedback?.impactOccurred('light');
  });
});

copyBtn.addEventListener('click', copyPayload);
sendBtn.addEventListener('click', sendPayload);

function copyPayload() {
  const text = payload.value.trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    tg.showAlert?.('Текст скопирован');
  });
}

function sendPayload() {
  const text = payload.value.trim();
  if (!text) return;
  tg.sendData(text);
}
