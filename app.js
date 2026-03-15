
document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = !!tg;

  const state = { mode: "court" };

  const payloadEl = document.getElementById("payload");
  const statusEl = document.getElementById("status");
  const previewCard = document.getElementById("previewCard");
  const copyBtn = document.getElementById("copyBtn");
  const sendBtn = document.getElementById("sendBtn");

  const modeButtons = document.querySelectorAll("[data-mode]");
  const modeCards = document.querySelectorAll("[data-mode-card]");
  const actionButtons = document.querySelectorAll("[data-action]");

  const fields = {
    courtDate: document.getElementById("court-date"),
    courtTime: document.getElementById("court-time"),
    courtCase: document.getElementById("court-case"),
    courtName: document.getElementById("court-name"),
    courtAddress: document.getElementById("court-address"),
    courtTitle: document.getElementById("court-title"),
    outingNumber: document.getElementById("outing-number"),
    outingDate: document.getElementById("outing-date"),
    outingTime: document.getElementById("outing-time"),
    outingExpert: document.getElementById("outing-expert"),
    outingGoes: document.getElementById("outing-goes"),
    outingDrove: document.getElementById("outing-drove"),
    outingPrice: document.getElementById("outing-price"),
    outingTripPrice: document.getElementById("outing-trip-price"),
    outingAddress: document.getElementById("outing-address"),
    outingTitle: document.getElementById("outing-title"),
  };

  function setStatus(text, type = "") {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.classList.remove("is-success", "is-error");
    if (type === "success") statusEl.classList.add("is-success");
    if (type === "error") statusEl.classList.add("is-error");
  }

  function formatDate(value) {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}.${m}.${y}`;
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setMode(mode) {
    state.mode = mode;
    modeCards.forEach((card) => card.classList.toggle("active", card.dataset.modeCard === mode));
    modeButtons.forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("active", active);
      btn.textContent = active ? "Активно" : "Сделать активным";
    });
    updatePreview();
  }

  function fillTodayDefaults() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return { date, time };
  }

  function fillCourtTemplate() {
    const { date, time } = fillTodayDefaults();
    fields.courtDate.value = date;
    fields.courtTime.value = time;
    fields.courtCase.value = "A21-025/2026";
    fields.courtName.value = "Московский районный суд";
    fields.courtAddress.value = "г. Калининград, ул. Примерная, д. 1";
    fields.courtTitle.value = "суд по делу №A21-025/2026";
    setMode("court");
    setStatus("Шаблон суда подставлен.", "success");
  }

  function fillOutingTemplate() {
    const { date, time } = fillTodayDefaults();
    fields.outingNumber.value = "0734К-2026";
    fields.outingDate.value = date;
    fields.outingTime.value = time;
    fields.outingExpert.value = "Иванов";
    fields.outingGoes.value = "Петров";
    fields.outingDrove.value = "Lada";
    fields.outingPrice.value = "15000";
    fields.outingTripPrice.value = "3000";
    fields.outingAddress.value = "г. Калининград, ул. Красная, д. 7, кв. 10";
    fields.outingTitle.value = "залитие потолка";
    setMode("outing");
    setStatus("Шаблон выезда подставлен.", "success");
  }

  function buildCourtPayload() {
    const date = formatDate(fields.courtDate.value);
    const time = fields.courtTime.value;
    const caseNumber = fields.courtCase.value.trim();
    const courtName = fields.courtName.value.trim();
    const address = fields.courtAddress.value.trim();
    const title = fields.courtTitle.value.trim();

    if (!date || !time || !title) return "";

    const lines = [`${date} ${time} ${title}`];
    if (courtName) lines.push(`суд: ${courtName}`);
    if (address) lines.push(`адрес: ${address}`);
    if (caseNumber && !title.includes(caseNumber)) lines.push(`дело №${caseNumber}`);
    return lines.join("\n");
  }

  function buildOutingPayload() {
    const number = fields.outingNumber.value.trim();
    const date = formatDate(fields.outingDate.value);
    const time = fields.outingTime.value;
    const expert = fields.outingExpert.value.trim();
    const goes = fields.outingGoes.value.trim();
    const drove = fields.outingDrove.value.trim();
    const price = fields.outingPrice.value.trim();
    const tripPrice = fields.outingTripPrice.value.trim();
    const address = fields.outingAddress.value.trim();
    const title = fields.outingTitle.value.trim();

    if (!number || !date || !time || !address || !title) return "";

    const parts = [`${number} ${time} ${date} ${address} ${title}`];
    if (expert) parts.push(`эксперт: ${expert}`);
    if (goes) parts.push(`кто едет: ${goes}`);
    if (drove) parts.push(`кто вёз: ${drove}`);
    if (price) parts.push(`стоимость экспертизы: ${price}`);
    if (tripPrice) parts.push(`стоимость выезда: ${tripPrice}`);
    return parts.join(" ");
  }

  function getPayload() {
    return state.mode === "court" ? buildCourtPayload() : buildOutingPayload();
  }

  function previewCourt() {
    return [
      ["Дата", formatDate(fields.courtDate.value) || "—"],
      ["Время", fields.courtTime.value || "—"],
      ["Номер дела", fields.courtCase.value.trim() || "—"],
      ["Суд", fields.courtName.value.trim() || "—"],
      ["Адрес", fields.courtAddress.value.trim() || "—"],
      ["Описание", fields.courtTitle.value.trim() || "—"],
    ];
  }

  function previewOuting() {
    return [
      ["Экспертиза", fields.outingNumber.value.trim() || "—"],
      ["Дата", formatDate(fields.outingDate.value) || "—"],
      ["Время", fields.outingTime.value || "—"],
      ["Адрес", fields.outingAddress.value.trim() || "—"],
      ["Описание", fields.outingTitle.value.trim() || "—"],
      ["Эксперт", fields.outingExpert.value.trim() || "—"],
      ["Кто едет", fields.outingGoes.value.trim() || "—"],
      ["Кто вёз", fields.outingDrove.value.trim() || "—"],
      ["Стоимость экспертизы", fields.outingPrice.value.trim() || "—"],
      ["Стоимость выезда", fields.outingTripPrice.value.trim() || "—"],
    ];
  }

  function updatePreview() {
    const payload = getPayload();
    payloadEl.value = payload;
    const lines = state.mode === "court" ? previewCourt() : previewOuting();

    previewCard.classList.remove("empty");
    previewCard.innerHTML = lines
      .map(([label, value]) => `<div class="preview-line"><span class="preview-label">${escapeHtml(label)}:</span><strong>${escapeHtml(value)}</strong></div>`)
      .join("");

    const hasPayload = Boolean(payload);
    sendBtn.disabled = !hasPayload;
    copyBtn.disabled = !hasPayload;

    if (isTelegram && tg.MainButton && tg.SecondaryButton) {
      tg.MainButton.setText("Отправить в бота");
      tg.SecondaryButton.setText("Скопировать");
      if (hasPayload) {
        tg.MainButton.show();
        tg.SecondaryButton.show();
      } else {
        tg.MainButton.hide();
        tg.SecondaryButton.hide();
      }
    }
  }

  async function copyPayload() {
    const payload = getPayload();
    if (!payload) {
      setStatus("Сначала заполните обязательные поля.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setStatus("Текст скопирован.", "success");
    } catch (error) {
      setStatus("Не удалось скопировать текст.", "error");
    }
  }

  function sendToBot(payload = null) {
    const text = (payload || getPayload()).trim();
    if (!text) {
      setStatus("Сначала заполните обязательные поля.", "error");
      return;
    }

    if (!isTelegram) {
      payloadEl.value = text;
      setStatus("В обычном браузере отправка не работает. Откройте Mini App внутри Telegram.", "error");
      return;
    }

    try {
      tg.sendData(text);
      setStatus(`Отправлено в бота: ${text.startsWith("/") ? text : "форма"}.`, "success");
    } catch (error) {
      console.error(error);
      setStatus("Ошибка при отправке в бота.", "error");
    }
  }

  function quickCommand(command) {
    if (isTelegram) {
      sendToBot(command);
    } else {
      payloadEl.value = command;
      setStatus(`Команда ${command} подготовлена. Отправка доступна внутри Telegram.`, "error");
    }
  }

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "today") quickCommand("/today");
      if (action === "week") quickCommand("/week");
      if (action === "court-template") fillCourtTemplate();
      if (action === "outing-template") fillOutingTemplate();
      updatePreview();
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  Object.values(fields).forEach((field) => {
    field?.addEventListener("input", updatePreview);
  });

  copyBtn?.addEventListener("click", copyPayload);
  sendBtn?.addEventListener("click", () => sendToBot());

  if (isTelegram) {
    tg.ready();
    tg.expand();
    tg.MainButton?.offClick(sendToBot);
    tg.MainButton?.onClick(() => sendToBot());
    tg.SecondaryButton?.offClick(copyPayload);
    tg.SecondaryButton?.onClick(copyPayload);
    setStatus("Mini App подключен. Быстрые команды и формы готовы к отправке.", "success");
  } else {
    setStatus("Открыт обычный браузер. Здесь можно заполнить форму и проверить предпросмотр.", "");
  }

  fillCourtTemplate();
  updatePreview();
});
