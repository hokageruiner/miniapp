document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = !!tg;

  const draftEl = document.getElementById("payload");
  const statusEl = document.getElementById("status");
  const htmlActions = document.getElementById("htmlActions");
  const copyBtn = document.getElementById("copyBtn");
  const sendBtn = document.getElementById("sendBtn");

  const actionButtons = Array.from(document.querySelectorAll("[data-action]"));

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.state = isError ? "error" : "ok";
  }

  function getDraft() {
    return (draftEl?.value || "").trim();
  }

  function setDraft(text) {
    if (!draftEl) return;
    draftEl.value = text;
    updateButtons();
  }

  function applyTelegramTheme() {
    if (!isTelegram) return;
    const root = document.documentElement;
    const params = tg.themeParams || {};
    const map = {
      "--tg-bg": params.bg_color,
      "--tg-text": params.text_color,
      "--tg-hint": params.hint_color,
      "--tg-link": params.link_color,
      "--tg-button": params.button_color,
      "--tg-button-text": params.button_text_color,
      "--tg-secondary-bg": params.secondary_bg_color,
    };
    Object.entries(map).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });
  }

  function configureTelegramButtons() {
    if (!isTelegram) return;

    if (tg.MainButton) {
      tg.MainButton.setText("Отправить в бота");
      tg.MainButton.offClick(sendCurrentDraft);
      tg.MainButton.onClick(sendCurrentDraft);
    }

    if (tg.SecondaryButton) {
      tg.SecondaryButton.setText("Скопировать");
      if (typeof tg.SecondaryButton.setParams === "function") {
        tg.SecondaryButton.setParams({ position: "left" });
      }
      tg.SecondaryButton.offClick(copyDraft);
      tg.SecondaryButton.onClick(copyDraft);
    }
  }

  function updateButtons() {
    const hasText = !!getDraft();

    if (sendBtn) sendBtn.disabled = !hasText;
    if (copyBtn) copyBtn.disabled = !hasText;

    if (isTelegram && tg.MainButton) {
      if (hasText) tg.MainButton.show();
      else tg.MainButton.hide();
    }

    if (isTelegram && tg.SecondaryButton) {
      if (hasText) tg.SecondaryButton.show();
      else tg.SecondaryButton.hide();
    }
  }

  async function copyDraft() {
    const text = getDraft();
    if (!text) {
      showStatus("Нечего копировать.", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showStatus("Скопировано.");
    } catch (error) {
      console.error(error);
      showStatus("Не удалось скопировать.", true);
    }
  }

  function sendPayload(text) {
    const payload = (text || "").trim();

    if (!payload) {
      showStatus("Поле пустое.", true);
      return;
    }

    if (!isTelegram) {
      setDraft(payload);
      showStatus("В браузере команда только подставлена. Отправка работает внутри Telegram.", true);
      return;
    }

    try {
      tg.sendData(payload);
      showStatus(`Отправлено в бота: ${payload}`);
    } catch (error) {
      console.error(error);
      showStatus("Ошибка при отправке в бота.", true);
    }
  }

  function sendCurrentDraft() {
    sendPayload(getDraft());
  }

  function quickCommand(command) {
    if (isTelegram) {
      sendPayload(command);
    } else {
      setDraft(command);
      showStatus(`Команда ${command} подставлена в поле.`);
    }
  }

  function fillCourtTemplate() {
    setDraft(
      "14.03.2026 14:00 суд по делу №A21-025/2026\n" +
      "суд: Московский районный суд\n" +
      "адрес: г. Калининград, ул. Примерная, д. 1\n" +
      "эксперт: Иванов"
    );
    showStatus("Шаблон суда подставлен.");
  }

  function fillTripTemplate() {
    setDraft(
      "0734К-2026 14:00 14.03.2026 город Калининград, улица Красная, дом 7, квартира 10 " +
      "Залитие потолка эксперт: Иванов кто едет: Петров кто вёз: Lada " +
      "стоимость экспертизы: 15000 стоимость выезда: 3000"
    );
    showStatus("Шаблон выезда подставлен.");
  }

  const actionMap = {
    today: () => quickCommand("/today"),
    week: () => quickCommand("/week"),
    upcoming: () => quickCommand("/upcoming"),
    courts: () => quickCommand("/courts"),
    outings: () => quickCommand("/trips"),
    base: () => quickCommand("/base"),
    "court-template": fillCourtTemplate,
    "outing-template": fillTripTemplate,
  };

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const handler = actionMap[action];
      if (handler) handler();
    });
  });

  if (copyBtn) copyBtn.addEventListener("click", copyDraft);
  if (sendBtn) sendBtn.addEventListener("click", sendCurrentDraft);
  if (draftEl) draftEl.addEventListener("input", updateButtons);

  if (isTelegram) {
    tg.ready();
    tg.expand();
    applyTelegramTheme();
    configureTelegramButtons();

    if (htmlActions) htmlActions.style.display = "none";
    showStatus("Mini App подключен. Кнопки работают напрямую через Telegram.");
  } else {
    if (htmlActions) htmlActions.style.display = "flex";
    showStatus("Открыт обычный браузер. Кнопки подставляют команды и шаблоны в поле.");
  }

  updateButtons();
});
