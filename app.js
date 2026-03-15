document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = Boolean(tg);

  const payloadEl = document.getElementById('payload');
  const statusEl = document.getElementById('status');
  const htmlActions = document.getElementById('htmlActions');
  const copyBtn = document.getElementById('copyBtn');
  const sendBtn = document.getElementById('sendBtn');
  const actionButtons = Array.from(document.querySelectorAll('[data-action]'));

  const templates = {
    'court-template': [
      '14.03.2026 14:00 суд по делу №A21-025/2026',
      'суд: Московский районный суд',
      'адрес: г. Калининград, ул. Примерная, д. 1',
      'эксперт: Иванов',
    ].join('\n'),
    'outing-template': [
      '0734К-2026 14:00 14.03.2026',
      'адрес: г. Калининград, ул. Красная, д. 7, кв. 10',
      'описание: залитие потолка',
      'эксперт: Иванов',
      'кто едет: Петров',
      'кто вёз: Lada',
      'стоимость экспертизы: 15000',
      'стоимость выезда: 3000',
    ].join('\n'),
  };

  const quickCommands = {
    today: '/today',
    week: '/week',
  };

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#ff6b6b' : '';
  }

  function getPayload() {
    return (payloadEl?.value || '').trim();
  }

  function setPayload(text) {
    if (!payloadEl) return;
    payloadEl.value = text;
    refreshButtons();
  }

  function refreshButtons() {
    const hasText = Boolean(getPayload());
    if (copyBtn) copyBtn.disabled = !hasText;
    if (sendBtn) sendBtn.disabled = !hasText;

    if (isTelegram && tg.MainButton && tg.SecondaryButton) {
      tg.MainButton.setText('Отправить в бота');
      tg.SecondaryButton.setText('Скопировать');
      hasText ? tg.MainButton.show() : tg.MainButton.hide();
      hasText ? tg.SecondaryButton.show() : tg.SecondaryButton.hide();
    }
  }

  async function copyPayload() {
    const text = getPayload();
    if (!text) {
      showStatus('Нечего копировать.', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showStatus('Скопировано.');
    } catch {
      showStatus('Не удалось скопировать.', true);
    }
  }

  function sendToBot(text = null) {
    const payload = (text || getPayload()).trim();
    if (!payload) {
      showStatus('Поле пустое.', true);
      return;
    }
    if (!isTelegram) {
      setPayload(payload);
      showStatus('В браузере команда только подставлена. Отправка работает внутри Telegram.', true);
      return;
    }
    try {
      tg.sendData(payload);
      showStatus(`Отправлено: ${payload}`);
    } catch (error) {
      console.error(error);
      showStatus('Ошибка при отправке в бота.', true);
    }
  }

  function handleAction(action) {
    if (templates[action]) {
      setPayload(templates[action]);
      showStatus(action === 'court-template' ? 'Шаблон суда подставлен.' : 'Шаблон выезда подставлен.');
      return;
    }
    if (quickCommands[action]) {
      sendToBot(quickCommands[action]);
      return;
    }
    showStatus('Неизвестное действие.', true);
  }

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action || ''));
  });

  if (copyBtn) copyBtn.addEventListener('click', copyPayload);
  if (sendBtn) sendBtn.addEventListener('click', () => sendToBot());
  if (payloadEl) payloadEl.addEventListener('input', refreshButtons);

  if (isTelegram) {
    tg.ready();
    tg.expand();
    if (htmlActions) htmlActions.style.display = 'none';
    if (tg.MainButton) {
      tg.MainButton.onClick(() => sendToBot());
    }
    if (tg.SecondaryButton) {
      tg.SecondaryButton.onClick(copyPayload);
    }
    showStatus('Mini App подключен. Кнопки готовы.');
  } else {
    if (htmlActions) htmlActions.style.display = 'flex';
    showStatus('Открыт обычный браузер. Шаблоны и копирование работают локально.');
  }

  refreshButtons();
});
