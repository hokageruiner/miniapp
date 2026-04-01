(function () {
  const TELEGRAM_WAIT_MS = 6000;
  const TELEGRAM_POLL_MS = 150;

  function getTelegramWebApp() {
    return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  }

  function withValue(el) {
    return el && typeof el.value === 'string' ? el.value.trim() : '';
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

  document.addEventListener('DOMContentLoaded', () => {
    const payloadEl = document.getElementById('payload');
    const statusEl = document.getElementById('status');
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

    let tg = null;
    let tgReady = false;
    let initFinished = false;

    function setStatus(text, type = 'info') {
      statusEl.textContent = text || '';
      statusEl.className = `status is-${type}`;
    }

    function getDraft() {
      return withValue(payloadEl);
    }

    function setDraft(text) {
      payloadEl.value = text || '';
      updateButtons();
    }

    function updateButtons() {
      const hasDraft = Boolean(getDraft());
      if (copyBtn) copyBtn.disabled = !hasDraft;
      if (sendBtn) sendBtn.disabled = !hasDraft;

      if (tgReady && tg && tg.MainButton) {
        tg.MainButton.setText('Отправить в бота');
        hasDraft ? tg.MainButton.show() : tg.MainButton.hide();
      }
      if (tgReady && tg && tg.SecondaryButton) {
        tg.SecondaryButton.setText('Скопировать');
        hasDraft ? tg.SecondaryButton.show() : tg.SecondaryButton.hide();
      }
    }

    function switchTab(tabName) {
      tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tabName));
      panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tabName));
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
      parts.push(withValue(courtFields.title) || 'суд по делу');
      if (withValue(courtFields.caseNumber)) parts.push(`№${withValue(courtFields.caseNumber)}`);
      if (withValue(courtFields.expertise)) parts.push(`экспертиза ${withValue(courtFields.expertise)}`);
      if (withValue(courtFields.courtName)) parts.push(`суд: ${withValue(courtFields.courtName)}`);
      if (withValue(courtFields.address)) parts.push(`адрес: ${withValue(courtFields.address)}`);
      if (withValue(courtFields.person)) parts.push(`явка ${withValue(courtFields.person)}`);
      setDraft(parts.join('\n'));
      setStatus('Черновик суда обновлён.', 'success');
    }

    function applyOuting() {
      ensureDefaults();
      const dateText = formatDateForText(outingFields.date.value);
      const timeText = outingFields.time.value || '00:00';
      const parts = [
        'тип: выезд',
        `номер экспертизы: ${withValue(outingFields.expertise) || '0734К-2026'}`,
        `дата: ${dateText}`,
        `время: ${timeText}`,
      ];
      if (withValue(outingFields.address)) parts.push(`адрес: ${withValue(outingFields.address)}`);
      if (withValue(outingFields.title)) parts.push(`событие: ${withValue(outingFields.title)}`);
      if (withValue(outingFields.expert)) parts.push(`эксперт: ${withValue(outingFields.expert)}`);
      if (withValue(outingFields.whoGoes)) parts.push(`кто едет: ${withValue(outingFields.whoGoes)}`);
      if (withValue(outingFields.whoDrove)) parts.push(`кто вёз: ${withValue(outingFields.whoDrove)}`);
      if (withValue(outingFields.expertisePrice)) parts.push(`стоимость экспертизы: ${withValue(outingFields.expertisePrice)}`);
      if (withValue(outingFields.tripPrice)) parts.push(`стоимость выезда: ${withValue(outingFields.tripPrice)}`);
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
      if (!tgReady || !tg) {
        setStatus('Telegram Mini App ещё не подключился. Подождите пару секунд или откройте приложение повторно из кнопки бота.', 'error');
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
      if (!tgReady || !tg) {
        setDraft(command);
        setStatus(`Команда ${command} подготовлена. После подключения Telegram нажмите «Отправить в бота».`, 'info');
        return;
      }
      sendToBot(command);
    }

    function bindTelegramUi(webApp) {
      if (!webApp || tgReady) return;
      tg = webApp;
      try {
        tg.ready();
        tg.expand();
      } catch (error) {
        console.warn('Telegram WebApp init warning', error);
      }

      if (tg.MainButton) {
        try { tg.MainButton.offClick(sendToBot); } catch (_) {}
        tg.MainButton.onClick(() => sendToBot());
      }
      if (tg.SecondaryButton) {
        try { tg.SecondaryButton.offClick(copyDraft); } catch (_) {}
        tg.SecondaryButton.onClick(copyDraft);
      }
      document.body.classList.add('is-telegram');
      tgReady = true;
      updateButtons();
      setStatus('Telegram Mini App подключён. Кнопки внизу страницы активны.', 'success');
    }

    function waitForTelegramBridge() {
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        const webApp = getTelegramWebApp();
        if (webApp) {
          window.clearInterval(timer);
          bindTelegramUi(webApp);
          return;
        }
        if (Date.now() - startedAt >= TELEGRAM_WAIT_MS) {
          window.clearInterval(timer);
          if (!tgReady) {
            setStatus('Telegram WebApp не подключился. Кнопки формы и копирование работают, а для отправки откройте приложение заново из private-чата бота.', 'info');
          }
        }
      }, TELEGRAM_POLL_MS);
    }

    tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    actionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        switch (btn.dataset.action) {
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

    if (copyBtn) copyBtn.addEventListener('click', copyDraft);
    if (sendBtn) sendBtn.addEventListener('click', () => sendToBot());

    ensureDefaults();
    switchTab('court');
    updateButtons();
    initFinished = true;

    const immediateTg = getTelegramWebApp();
    if (immediateTg) {
      bindTelegramUi(immediateTg);
    } else {
      setStatus('Подключаем Telegram Mini App… Кнопки формы уже доступны.', 'info');
      waitForTelegramBridge();
    }
  });
})();
