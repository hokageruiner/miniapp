document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = Boolean(tg);

  const form = document.getElementById('eventForm');
  const typeEl = document.getElementById('eventType');
  const titleEl = document.getElementById('title');
  const datetimeEl = document.getElementById('eventDateTime');
  const numberEl = document.getElementById('number');
  const courtEl = document.getElementById('courtName');
  const expertEl = document.getElementById('expertName');
  const addressEl = document.getElementById('address');
  const whoEl = document.getElementById('whoGoes');
  const driverEl = document.getElementById('driver');
  const expPriceEl = document.getElementById('expertisePrice');
  const tripPriceEl = document.getElementById('tripPrice');
  const previewEl = document.getElementById('preview');
  const statusEl = document.getElementById('status');
  const htmlActions = document.getElementById('htmlActions');
  const copyBtn = document.getElementById('copyBtn');
  const sendBtn = document.getElementById('sendBtn');
  const fields = Array.from(document.querySelectorAll('[data-field]'));
  const cards = Array.from(document.querySelectorAll('[data-action]'));

  const companyLogo = document.getElementById('companyLogo');
  if (companyLogo) {
    companyLogo.addEventListener('error', () => {
      companyLogo.style.display = 'none';
    });
  }

  function setStatus(text, kind = 'info') {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = `status is-${kind}`;
  }

  function formatDateForInput(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function nowPlus(hours) {
    const date = new Date();
    date.setHours(date.getHours() + hours, 0, 0, 0);
    return formatDateForInput(date);
  }

  function currentType() {
    return (typeEl?.value || 'court').trim();
  }

  function setType(nextType) {
    if (!typeEl) return;
    typeEl.value = nextType;
    document.body.dataset.type = nextType;
    renderPreview();
  }

  function courtTemplate() {
    setType('court');
    titleEl.value = 'Судебное заседание';
    datetimeEl.value = nowPlus(24);
    numberEl.value = 'A21-025/2026';
    courtEl.value = 'Московский районный суд';
    expertEl.value = 'Иванов';
    addressEl.value = 'г. Калининград, ул. Примерная, д. 1';
    whoEl.value = '';
    driverEl.value = '';
    expPriceEl.value = '';
    tripPriceEl.value = '';
    renderPreview();
    setStatus('Шаблон суда подставлен.', 'success');
  }

  function outingTemplate() {
    setType('outing');
    titleEl.value = 'Выезд на объект';
    datetimeEl.value = nowPlus(6);
    numberEl.value = '0734К-2026';
    courtEl.value = '';
    expertEl.value = 'Иванов';
    addressEl.value = 'г. Калининград, ул. Красная, д. 7, кв. 10';
    whoEl.value = 'Петров';
    driverEl.value = 'Lada';
    expPriceEl.value = '15000';
    tripPriceEl.value = '3000';
    renderPreview();
    setStatus('Шаблон выезда подставлен.', 'success');
  }

  function payloadFromForm() {
    const type = currentType();
    const title = titleEl.value.trim();
    const dt = datetimeEl.value.trim();
    const num = numberEl.value.trim();
    const court = courtEl.value.trim();
    const expert = expertEl.value.trim();
    const address = addressEl.value.trim();
    const who = whoEl.value.trim();
    const driver = driverEl.value.trim();
    const expertisePrice = expPriceEl.value.trim();
    const tripPrice = tripPriceEl.value.trim();

    if (!title || !dt || !num || !address) {
      return '';
    }

    const [datePart, timePart] = dt.split('T');
    const [yyyy, mm, dd] = datePart.split('-');
    const prettyDate = dd && mm && yyyy ? `${dd}.${mm}.${yyyy}` : datePart;

    if (type === 'court') {
      const lines = [
        `${prettyDate} ${timePart || '09:00'} суд по делу №${num}`,
        court ? `суд: ${court}` : '',
        `адрес: ${address}`,
        expert ? `эксперт: ${expert}` : '',
      ].filter(Boolean);
      return lines.join('\n');
    }

    const chunks = [
      `${num} ${timePart || '09:00'} ${prettyDate}`,
      address,
      title,
      expert ? `эксперт: ${expert}` : '',
      who ? `кто едет: ${who}` : '',
      driver ? `кто вёз: ${driver}` : '',
      expertisePrice ? `стоимость экспертизы: ${expertisePrice}` : '',
      tripPrice ? `стоимость выезда: ${tripPrice}` : '',
    ].filter(Boolean);
    return chunks.join(' ');
  }

  function previewLines() {
    const lines = [];
    const typeLabel = currentType() === 'court' ? '⚖️ Суд' : '🚗 Выезд';
    lines.push(typeLabel);
    if (titleEl.value.trim()) lines.push(`• Событие: ${titleEl.value.trim()}`);
    if (datetimeEl.value.trim()) lines.push(`• Дата и время: ${datetimeEl.value.trim().replace('T', ' ')}`);
    if (numberEl.value.trim()) lines.push(`• Номер: ${numberEl.value.trim()}`);
    if (courtEl.value.trim()) lines.push(`• Суд: ${courtEl.value.trim()}`);
    if (addressEl.value.trim()) lines.push(`• Адрес: ${addressEl.value.trim()}`);
    if (expertEl.value.trim()) lines.push(`• Эксперт: ${expertEl.value.trim()}`);
    if (whoEl.value.trim()) lines.push(`• Кто едет: ${whoEl.value.trim()}`);
    if (driverEl.value.trim()) lines.push(`• Кто вёз: ${driverEl.value.trim()}`);
    if (expPriceEl.value.trim()) lines.push(`• Стоимость экспертизы: ${expPriceEl.value.trim()}`);
    if (tripPriceEl.value.trim()) lines.push(`• Стоимость выезда: ${tripPriceEl.value.trim()}`);
    return lines;
  }

  function renderPreview() {
    const lines = previewLines();
    previewEl.textContent = lines.join('\n') || 'Заполните поля — здесь появится аккуратный предпросмотр.';
    const hasPayload = Boolean(payloadFromForm());
    if (sendBtn) sendBtn.disabled = !hasPayload;
    if (copyBtn) copyBtn.disabled = !hasPayload;
  }

  async function copyPayload() {
    const payload = payloadFromForm();
    if (!payload) {
      setStatus('Заполните обязательные поля перед копированием.', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setStatus('Текст скопирован.', 'success');
    } catch {
      setStatus('Не удалось скопировать текст.', 'error');
    }
  }

  function sendToBot(customPayload = null) {
    const payload = (customPayload || payloadFromForm()).trim();
    if (!payload) {
      setStatus('Не хватает обязательных полей.', 'error');
      return;
    }
    if (!isTelegram) {
      setStatus('Отправка работает внутри Telegram Mini App. В браузере можно только копировать.', 'error');
      return;
    }
    try {
      tg.sendData(payload);
      setStatus('Форма отправлена в бота.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Ошибка при отправке в бота.', 'error');
    }
  }

  function quickCommand(command) {
    if (isTelegram) {
      sendToBot(command);
      return;
    }
    setStatus(`Команда ${command} доступна внутри Telegram.`, 'info');
  }

  function handleAction(action) {
    switch (action) {
      case 'court-template':
        courtTemplate();
        break;
      case 'outing-template':
        outingTemplate();
        break;
      case 'today':
        quickCommand('/today');
        break;
      case 'week':
        quickCommand('/week');
        break;
      default:
        setStatus('Неизвестное действие.', 'error');
    }
  }

  cards.forEach((card) => {
    card.addEventListener('click', () => handleAction(card.dataset.action));
  });

  fields.forEach((field) => {
    field.addEventListener('input', renderPreview);
    field.addEventListener('change', renderPreview);
  });

  typeEl?.addEventListener('change', () => setType(typeEl.value));
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendToBot();
  });
  copyBtn?.addEventListener('click', copyPayload);
  sendBtn?.addEventListener('click', () => sendToBot());

  if (isTelegram) {
    document.body.classList.add('is-telegram');
    tg.ready();
    tg.expand();
    if (htmlActions) htmlActions.style.display = 'none';
    setStatus('Mini App подключён. Быстрые кнопки отправляют команды в бота.', 'success');
  } else {
    if (htmlActions) htmlActions.style.display = 'flex';
    setStatus('Открыт обычный браузер. Доступны шаблоны, предпросмотр и копирование.', 'info');
  }

  setType(currentType());
  courtTemplate();
});
