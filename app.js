(function () {
  const tg = window.Telegram?.WebApp;
  const isTelegram = !!tg;

  const draftEl = document.getElementById('payload');
  const statusEl = document.getElementById('status');
  const actionsEl = document.getElementById('html-actions');
  const copyBtn = document.getElementById('copyBtn');
  const sendBtn = document.getElementById('sendBtn');

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('error', !!isError);
  }

  function getPayload() {
    return (draftEl?.value || '').trim();
  }

  function setPayload(value) {
    if (!draftEl) return;
    draftEl.value = value;
    updateButtons();
  }

  function updateButtons() {
    const hasText = !!getPayload();
    if (sendBtn) sendBtn.disabled = !hasText;
    if (copyBtn) copyBtn.disabled = !hasText;

    if (isTelegram && tg.MainButton) {
      tg.MainButton.setText('Отправить в бота');
      hasText ? tg.MainButton.show() : tg.MainButton.hide();
    }
    if (isTelegram && tg.SecondaryButton) {
      tg.SecondaryButton.setText('Скопировать');
      hasText ? tg.SecondaryButton.show() : tg.SecondaryButton.hide();
    }
  }

  function applyTemplate(action) {
    if (action === 'court-template') {
      setPayload('14 марта 2026 вызов Петра в Московский суд в 14:00 по делу №A21-025/2026 экспертиза №0734К-2026');
      showStatus('Шаблон суда подставлен.');
      return;
    }
    if (action === 'outing-template') {
      setPayload('0734К-2026 14:00 14.03.2026 город Калининград, улица Красная, дом 7, квартира 10 Залитие потолка эксперт: Иванов кто едет: Петров кто вёз: Lada стоимость экспертизы: 15000 стоимость выезда: 3000');
      showStatus('Шаблон выезда подставлен.');
      return;
    }
    if (action === 'today') {
      setPayload('/today');
      showStatus('Команда на сегодня готова.');
      return;
    }
    if (action === 'week') {
      setPayload('/week');
      showStatus('Команда на неделю готова.');
      return;
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
    } catch (error) {
      console.error(error);
      showStatus('Не удалось скопировать.', true);
    }
  }

  function sendPayload() {
    const text = getPayload();
    if (!text) {
      showStatus('Поле пустое.', true);
      return;
    }
    if (!isTelegram) {
      showStatus('Отправка в бота работает только внутри Telegram.', true);
      return;
    }
    try {
      tg.sendData(text);
      showStatus('Команда отправлена в бота. Окно остаётся открытым.');
    } catch (error) {
      console.error(error);
      showStatus('Ошибка при отправке в бота.', true);
    }
  }

  document.querySelectorAll('.feature-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTemplate(btn.dataset.action);
      tg?.HapticFeedback?.impactOccurred('light');
    });
  });

  draftEl?.addEventListener('input', updateButtons);
  copyBtn?.addEventListener('click', copyPayload);
  sendBtn?.addEventListener('click', sendPayload);

  if (isTelegram) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();

    if (actionsEl) {
      actionsEl.style.display = 'none';
    }

    tg.MainButton?.offClick(sendPayload);
    tg.SecondaryButton?.offClick(copyPayload);
    tg.MainButton?.onClick(sendPayload);
    tg.SecondaryButton?.onClick(copyPayload);

    showStatus('Внутри Telegram используйте нижние кнопки «Скопировать» и «Отправить в бота».');
  } else {
    showStatus('В браузере можно готовить текст и копировать его. Отправка в бота работает только внутри Telegram.');
  }

  updateButtons();
})();
