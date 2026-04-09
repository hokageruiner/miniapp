document.addEventListener('DOMContentLoaded', () => {
  let tg = null;
  let isTelegram = false;
  let telegramBound = false;

  const STORAGE_KEYS = {
    draft: 'bneo.draft',
    courtLast: 'bneo.court.last',
    outingLast: 'bneo.outing.last',
    courtSaved: 'bneo.court.saved',
    outingSaved: 'bneo.outing.saved',
  };

  const payloadEl = document.getElementById('payload');
  const statusEl = document.getElementById('status');
  const htmlActionsEl = document.getElementById('htmlActions');
  const copyBtn = document.getElementById('copyBtn');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const restoreBtn = document.getElementById('restoreBtn');
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

  function markAppReady() {
    if (!document.body.classList.contains('is-ready')) {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-enhanced')));
    }
  }

  function setStatus(text, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = `status is-${type}`;
  }

  function storageGet(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function getDraft() {
    return (payloadEl?.value || '').trim();
  }

  function setDraft(text) {
    if (!payloadEl) return;
    payloadEl.value = text || '';
    storageSet(STORAGE_KEYS.draft, payloadEl.value);
    updateButtons();
  }

  function updateButtons() {
    const hasDraft = Boolean(getDraft());
    if (copyBtn) copyBtn.disabled = !hasDraft;
    if (sendBtn) sendBtn.disabled = !hasDraft;
    if (clearBtn) clearBtn.disabled = !hasDraft;
    if (restoreBtn) restoreBtn.disabled = !storageGet(STORAGE_KEYS.draft, '');

    if (isTelegram && tg?.MainButton) {
      tg.MainButton.setText('Отправить в бота');
      hasDraft ? tg.MainButton.show() : tg.MainButton.hide();
    }
    if (isTelegram && tg?.SecondaryButton) {
      tg.SecondaryButton.setText('Скопировать');
      hasDraft ? tg.SecondaryButton.show() : tg.SecondaryButton.hide();
    }
  }

  function switchTab(tabName) {
    tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tabName));
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tabName));
  }

  function pad(value) { return String(value).padStart(2, '0'); }

  function formatDateForText(value) {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return (!year || !month || !day) ? value : `${day}.${month}.${year}`;
  }

  function ensureDefaults() {
    const now = new Date();
    const dateValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeValue = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    [courtFields.date, outingFields.date].forEach((el) => { if (el && !el.value) el.value = dateValue; });
    [courtFields.time, outingFields.time].forEach((el) => { if (el && !el.value) el.value = timeValue; });
  }

  function readFields(fields) {
    const data = {};
    Object.entries(fields).forEach(([key, el]) => data[key] = el?.value || '');
    return data;
  }

  function fillFields(fields, values = {}) {
    Object.entries(fields).forEach(([key, el]) => { if (el) el.value = values[key] || ''; });
  }

  function saveCurrentState(key, fields) { storageSet(key, readFields(fields)); }

  function loadState(key, fields, successText) {
    const data = storageGet(key);
    if (!data) {
      setStatus('Данные не найдены.', 'error');
      return;
    }
    fillFields(fields, data);
    setStatus(successText, 'success');
  }

  function fillCourtTemplate() {
    ensureDefaults();
    courtFields.caseNumber.value = 'A21-025/2026';
    courtFields.expertise.value = '0734К-2026';
    courtFields.courtName.value = 'Московский районный суд';
    courtFields.address.value = 'г. Калининград, ул. Примерная, д. 1';
    courtFields.person.value = 'Иванов Иван';
    courtFields.title.value = 'Вызов в суд';
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
    const dateText = formatDateForText(courtFields.date.value);
    const timeText = courtFields.time.value || '00:00';
    const title = courtFields.title.value.trim() || 'Вызов в суд';
    const parts = ['тип: суд', `событие: ${title}`, `дата: ${dateText}`, `время: ${timeText}`];
    if (courtFields.caseNumber.value.trim()) parts.push(`номер дела: ${courtFields.caseNumber.value.trim()}`);
    if (courtFields.expertise.value.trim()) parts.push(`номер экспертизы: ${courtFields.expertise.value.trim()}`);
    if (courtFields.person.value.trim()) parts.push(`участник: ${courtFields.person.value.trim()}`);
    if (courtFields.courtName.value.trim()) parts.push(`суд: ${courtFields.courtName.value.trim()}`);
    if (courtFields.address.value.trim()) parts.push(`адрес: ${courtFields.address.value.trim()}`);
    setDraft(parts.join('\n'));
    saveCurrentState(STORAGE_KEYS.courtLast, courtFields);
    setStatus('Черновик суда обновлён.', 'success');
  }

  function applyOuting() {
    ensureDefaults();
    const dateText = formatDateForText(outingFields.date.value);
    const timeText = outingFields.time.value || '00:00';
    const parts = ['тип: выезд', `номер экспертизы: ${outingFields.expertise.value.trim() || '0734К-2026'}`, `дата: ${dateText}`, `время: ${timeText}`];
    if (outingFields.address.value.trim()) parts.push(`адрес: ${outingFields.address.value.trim()}`);
    if (outingFields.title.value.trim()) parts.push(`событие: ${outingFields.title.value.trim()}`);
    if (outingFields.expert.value.trim()) parts.push(`эксперт: ${outingFields.expert.value.trim()}`);
    if (outingFields.whoGoes.value.trim()) parts.push(`кто едет: ${outingFields.whoGoes.value.trim()}`);
    if (outingFields.whoDrove.value.trim()) parts.push(`кто вёз: ${outingFields.whoDrove.value.trim()}`);
    if (outingFields.expertisePrice.value.trim()) parts.push(`стоимость экспертизы: ${outingFields.expertisePrice.value.trim()}`);
    if (outingFields.tripPrice.value.trim()) parts.push(`стоимость выезда: ${outingFields.tripPrice.value.trim()}`);
    setDraft(parts.join('\n'));
    saveCurrentState(STORAGE_KEYS.outingLast, outingFields);
    setStatus('Черновик выезда обновлён.', 'success');
  }

  async function copyDraft() {
    const draft = getDraft();
    if (!draft) return setStatus('Сначала соберите черновик.', 'error');
    try {
      await navigator.clipboard.writeText(draft);
      setStatus('Черновик скопирован.', 'success');
    } catch {
      setStatus('Не удалось скопировать текст.', 'error');
    }
  }

  function clearDraftAndForm() {
    setDraft('');
    fillFields(courtFields, {});
    fillFields(outingFields, {});
    ensureDefaults();
    setStatus('Форма очищена.', 'success');
  }

  function restoreDraft() {
    const saved = storageGet(STORAGE_KEYS.draft, '');
    if (!saved) return setStatus('Сохранённого черновика нет.', 'error');
    setDraft(saved);
    setStatus('Черновик восстановлен.', 'success');
  }

  function sendToBot(raw = null) {
    const payload = (raw || getDraft()).trim();
    if (!payload) return setStatus('Сначала соберите черновик.', 'error');
    if (!isTelegram || !tg) return setStatus('Отправка работает внутри Telegram Mini App.', 'error');
    try {
      tg.sendData(payload);
      setStatus('Форма отправлена в бота.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Не удалось отправить данные в бота.', 'error');
    }
  }

  function sendQuickCommand(command) {
    if (!isTelegram || !tg) {
      setDraft(command);
      return setStatus(`Команда ${command} подготовлена.`, 'success');
    }
    sendToBot(command);
  }

  function attachAutoSave() {
    [...Object.values(courtFields), ...Object.values(outingFields)].forEach((el) => {
      el?.addEventListener('input', () => {
        saveCurrentState(STORAGE_KEYS.courtLast, courtFields);
        saveCurrentState(STORAGE_KEYS.outingLast, outingFields);
      });
    });
  }

  function attachBaseHandlers() {
    tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    actionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        switch (btn.dataset.action) {
          case 'today': return sendQuickCommand('/today');
          case 'week': return sendQuickCommand('/week');
          case 'court-template': return fillCourtTemplate();
          case 'outing-template': return fillOutingTemplate();
          case 'apply-court': return applyCourt();
          case 'apply-outing': return applyOuting();
          case 'save-court-template': storageSet(STORAGE_KEYS.courtSaved, readFields(courtFields)); return setStatus('Шаблон суда сохранён.', 'success');
          case 'save-outing-template': storageSet(STORAGE_KEYS.outingSaved, readFields(outingFields)); return setStatus('Шаблон выезда сохранён.', 'success');
          case 'load-last-court': switchTab('court'); return loadState(STORAGE_KEYS.courtLast, courtFields, 'Последний суд загружен.');
          case 'load-last-outing': switchTab('outing'); return loadState(STORAGE_KEYS.outingLast, outingFields, 'Последний выезд загружен.');
          case 'load-saved-court': switchTab('court'); return loadState(STORAGE_KEYS.courtSaved, courtFields, 'Сохранённый шаблон суда загружен.');
          case 'load-saved-outing': switchTab('outing'); return loadState(STORAGE_KEYS.outingSaved, outingFields, 'Сохранённый шаблон выезда загружен.');
          default: return;
        }
      });
    });

    copyBtn?.addEventListener('click', copyDraft);
    sendBtn?.addEventListener('click', () => sendToBot());
    clearBtn?.addEventListener('click', clearDraftAndForm);
    restoreBtn?.addEventListener('click', restoreDraft);
  }

  function bindTelegram() {
    const candidate = window.Telegram?.WebApp || null;
    if (!candidate || telegramBound) return false;
    tg = candidate;
    isTelegram = true;
    telegramBound = true;
    document.body.classList.add('is-telegram');

    try {
      tg.ready?.();
      tg.expand?.();
      if (tg.MainButton) {
        tg.MainButton.offClick(sendToBot);
        tg.MainButton.onClick(() => sendToBot());
      }
      if (tg.SecondaryButton) {
        tg.SecondaryButton.offClick(copyDraft);
        tg.SecondaryButton.onClick(copyDraft);
      }
      if (htmlActionsEl) htmlActionsEl.style.display = 'flex';
      updateButtons();
      setStatus('Приложение BNEO подключено. Заполните форму и нажмите «Применить», затем «Отправить в бота».', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Mini App открыт, но Telegram API инициализировался с ошибкой.', 'error');
    }
    return true;
  }

  ensureDefaults();
  attachBaseHandlers();
  attachAutoSave();
  bindTelegram();
  const savedDraft = storageGet(STORAGE_KEYS.draft, '');
  if (savedDraft) payloadEl.value = savedDraft;
  updateButtons();
  markAppReady();
});
