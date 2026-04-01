document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = Boolean(tg);

  const payloadEl = document.getElementById('payload');
  const statusEl = document.getElementById('status');
  const htmlActionsEl = document.getElementById('htmlActions');
  const copyBtn = document.getElementById('copyBtn');
  const sendBtn = document.getElementById('sendBtn');
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const panels = Array.from(document.querySelectorAll('.tab-panel'));
  const actionButtons = Array.from(document.querySelectorAll('[data-action]'));

  const courtFields = {
    date: document.getElementById('courtDate'),
    time: document.getElementById('courtTime'),
    caseNumber: document.getElementById('courtCase'),
    expertise: document.getElementById('courtExpertise'),
    courtName: document.getElementById('courtName'),
    address: document.getElementById('courtAddress'),
    person: document.getElementById('courtPerson'),
    title: document.getElementById('courtTitle'),
  };

  const outingFields = {
    date: document.getElementById('outingDate'),
    time: document.getElementById('outingTime'),
    expertise: document.getElementById('outingExpertise'),
    expert: document.getElementById('outingExpert'),
    address: document.getElementById('outingAddress'),
    title: document.getElementById('outingTitle'),
    whoGoes: document.getElementById('outingWhoGoes'),
    whoDrove: document.getElementById('outingWhoDrove'),
    expertisePrice: document.getElementById('outingExpertisePrice'),
    tripPrice: document.getElementById('outingTripPrice'),
  };

  function setStatus(text, type = 'info') {
    statusEl.textContent = text || '';
    statusEl.className = `status is-${type}`;
  }

  function getDraft() {
    return (payloadEl.value || '').trim();
  }

  function setDraft(text) {
    payloadEl.value = text || '';
    updateButtons();
  }

  function updateButtons() {
    const hasDraft = Boolean(getDraft());
    if (copyBtn) copyBtn.disabled = !hasDraft;
    if (sendBtn) {
      sendBtn.disabled = !hasDraft;
      sendBtn.textContent = isTelegram ? 'Отправить в бота' : 'Отправить в бота';
    }

    if (isTelegram && tg.MainButton) {
      tg.MainButton.setText('Отправить в бота');
      hasDraft ? tg.MainButton.show() : tg.MainButton.hide();
    }
    if (isTelegram && tg.SecondaryButton) {
      tg.SecondaryButton.setText('Скопировать');
      hasDraft ? tg.SecondaryButton.show() : tg.SecondaryButton.hide();
    }
  }

  function switchTab(tabName) {
    tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tabName));
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tabName));
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatDateForText(value) {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}`;
  }

  function ensureDefaults() {
    const now = new Date();
    const dateValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeValue = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    [courtFields.date, outingFields.date].forEach((el) => {
      if (el && !el.value) el.value = dateValue;
    });
    [courtFields.time, outingFields.time].forEach((el) => {
      if (el && !el.value) el.value = timeValue;
    });
  }

  function fillCourtTemplate() {
    ensureDefaults();
    courtFields.caseNumber.value = 'A21-025/2026';
    courtFields.expertise.value = '0734К-2026';
    courtFields.courtName.value = 'Московский районный суд';
    courtFields.address.value = 'г. Калининград, ул. Примерная, д. 1';
    courtFields.person.value = 'Иванов Иван';
    courtFields.title.value = 'суд по делу';
    switchTab('court');
    applyCourt();
    setStatus('Шаблон суда подставлен.', 'success');
  }

  function fillOutingTemplate() {
    ensureDefaults();
    outingFields.expertise.value = '0734К-2026';
    outingFields.expert.value = 'Иванов';
    outingFields.address.value = 'г. Калининград, ул. Красная, д. 7, кв. 10';
    outingFields.title.value = 'залитие потолка';
    outingFields.whoGoes.value = 'Петров';
    outingFields.whoDrove.value = 'Lada';
    outingFields.expertisePrice.value = '15000';
    outingFields.tripPrice.value = '3000';
    switchTab('outing');
    applyOuting();
    setStatus('Шаблон выезда подставлен.', 'success');
  }

  function applyCourt() {
    ensureDefaults();
    const parts = [];
    const dateText = formatDateForText(courtFields.date.value);
    const timeText = courtFields.time.value || '00:00';
    parts.push(`${dateText} ${timeText}`);
    if (courtFields.title.value.trim()) {
      parts.push(courtFields.title.value.trim());
    } else {
      parts.push('суд по делу');
    }
    if (courtFields.caseNumber.value.trim()) {
      parts.push(`№${courtFields.caseNumber.value.trim()}`);
    }
    if (courtFields.expertise.value.trim()) {
      parts.push(`экспертиза ${courtFields.expertise.value.trim()}`);
    }
    if (courtFields.courtName.value.trim()) {
      parts.push(`суд: ${courtFields.courtName.value.trim()}`);
    }
    if (courtFields.address.value.trim()) {
      parts.push(`адрес: ${courtFields.address.value.trim()}`);
    }
    if (courtFields.person.value.trim()) {
      parts.push(`явка ${courtFields.person.value.trim()}`);
    }
    setDraft(parts.join('\n'));
    setStatus('Черновик суда обновлён.', 'success');
  }

  function applyOuting() {
    ensureDefaults();
    const dateText = formatDateForText(outingFields.date.value);
    const timeText = outingFields.time.value || '00:00';
    const parts = [
      'тип: выезд',
      `номер экспертизы: ${outingFields.expertise.value.trim() || '0734К-2026'}`,
      `дата: ${dateText}`,
      `время: ${timeText}`,
    ];
    if (outingFields.address.value.trim()) parts.push(`адрес: ${outingFields.address.value.trim()}`);
    if (outingFields.title.value.trim()) parts.push(`событие: ${outingFields.title.value.trim()}`);
    if (outingFields.expert.value.trim()) parts.push(`эксперт: ${outingFields.expert.value.trim()}`);
    if (outingFields.whoGoes.value.trim()) parts.push(`кто едет: ${outingFields.whoGoes.value.trim()}`);
    if (outingFields.whoDrove.value.trim()) parts.push(`кто вёз: ${outingFields.whoDrove.value.trim()}`);
    if (outingFields.expertisePrice.value.trim()) parts.push(`стоимость экспертизы: ${outingFields.expertisePrice.value.trim()}`);
    if (outingFields.tripPrice.value.trim()) parts.push(`стоимость выезда: ${outingFields.tripPrice.value.trim()}`);
    setDraft(parts.join('\n'));
    setStatus('Черновик выезда обновлён.', 'success');
  }

  async function copyDraft() {
    const draft = getDraft();
    if (!draft) {
      setStatus('Сначала соберите черновик.', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(draft);
      setStatus('Черновик скопирован.', 'success');
    } catch (error) {
      setStatus('Не удалось скопировать текст.', 'error');
    }
  }

  function sendToBot(raw = null) {
    const payload = (raw || getDraft()).trim();
    if (!payload) {
      setStatus('Сначала соберите черновик.', 'error');
      return;
    }
    if (!isTelegram) {
      setStatus('Отправка работает внутри Telegram Mini App.', 'error');
      return;
    }
    try {
      tg.sendData(payload);
      setStatus('Форма отправлена в бота.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Не удалось отправить данные в бота.', 'error');
    }
  }

  function sendQuickCommand(command) {
    if (!isTelegram) {
      setDraft(command);
      setStatus(`Команда ${command} подготовлена.`, 'success');
      return;
    }
    sendToBot(command);
  }

  tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  actionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'today':
          sendQuickCommand('/today');
          break;
        case 'week':
          sendQuickCommand('/week');
          break;
        case 'court-template':
          fillCourtTemplate();
          break;
        case 'outing-template':
          fillOutingTemplate();
          break;
        case 'apply-court':
          applyCourt();
          break;
        case 'apply-outing':
          applyOuting();
          break;
        default:
          break;
      }
    });
  });

  copyBtn.addEventListener('click', copyDraft);
  sendBtn.addEventListener('click', () => sendToBot());

  ensureDefaults();
  switchTab('court');
  updateButtons();

  if (isTelegram) {
    document.body.classList.add('is-telegram');
    tg.ready();
    tg.expand();
    if (tg.MainButton) {
      tg.MainButton.offClick(sendToBot);
      tg.MainButton.onClick(() => sendToBot());
    }
    if (tg.SecondaryButton) {
      tg.SecondaryButton.offClick(copyDraft);
      tg.SecondaryButton.onClick(copyDraft);
    }
    if (htmlActionsEl) htmlActionsEl.style.display = 'flex';
    setStatus('Приложение BNEO подключено. Заполните форму и нажмите «Применить», затем «Отправить в бота».', 'success');
  } else {
    setStatus('Открыт режим браузера. Сборка черновика и копирование доступны.', 'info');
  }
});
