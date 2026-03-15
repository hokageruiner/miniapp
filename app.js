document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const isTelegram = Boolean(tg && typeof tg.sendData === "function");

  const draftEl = document.getElementById("payload");
  const statusEl = document.getElementById("status");
  const htmlActions = document.getElementById("htmlActions");
  const copyBtn = document.getElementById("copyBtn");
  const sendBtn = document.getElementById("sendBtn");

  const templates = {
    "court-template": `14.03.2026 14:00 суд по делу №A21-025/2026
суд: Московский районный суд
адрес: г. Калининград, ул. Примерная, д. 1
эксперт: Иванов`,
    "outing-template": `0734К-2026 14:00 14.03.2026 город Калининград, улица Красная, дом 7, квартира 10
Залитие потолка
эксперт: Иванов
кто едет: Петров
кто вёз: Lada
стоимость экспертизы: 15000
стоимость выезда: 3000`,
  };

  const actionMap = {
    "court-template": () => setDraft(templates["court-template"]),
    "outing-template": () => setDraft(templates["outing-template"]),
    today: () => quickCommand("/today"),
    week: () => quickCommand("/week"),
    upcoming: () => quickCommand("/upcoming"),
    courts: () => quickCommand("/courts"),
    trips: () => quickCommand("/trips"),
    base: () => quickCommand("/base"),
  };

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#ff6b6b" : "";
  }

  function getDraft() {
    return (draftEl && draftEl.value ? draftEl.value : "").trim();
  }

  function setDraft(text) {
    if (!draftEl) return;
    draftEl.value = text;
    updateButtons();
    showStatus("Черновик обновлён.");
  }

  function updateButtons() {
    const hasText = Boolean(getDraft());
    if (sendBtn) sendBtn.disabled = !hasText;
    if (copyBtn) copyBtn.disabled = !hasText;

    if (isTelegram && tg.MainButton && tg.SecondaryButton) {
      tg.MainButton.setText("Отправить в бота");
      tg.SecondaryButton.setText("Скопировать");
      if (hasText) {
        tg.MainButton.show();
        tg.SecondaryButton.show();
      } else {
        tg.MainButton.hide();
        tg.SecondaryButton.hide();
      }
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

  function sendToBot(payload) {
    const text = (payload || getDraft()).trim();
    if (!text) {
      showStatus("Поле пустое.", true);
      return;
    }

    if (!isTelegram) {
      setDraft(text);
      showStatus("В обычном браузере отправка в бота недоступна.", true);
      return;
    }

    try {
      tg.sendData(text);
      showStatus(`Отправлено: ${text}`);
    } catch (error) {
      console.error(error);
      showStatus("Ошибка при отправке в бота.", true);
    }
  }

  function quickCommand(command) {
    if (isTelegram) {
      sendToBot(command);
      return;
    }
    setDraft(command);
    showStatus(`Команда ${command} подставлена в поле.`);
  }

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-action");
      const handler = actionMap[action];
      if (handler) {
        handler();
      } else {
        showStatus(`Неизвестное действие: ${action}`, true);
      }
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", copyDraft);
  }
  if (sendBtn) {
    sendBtn.addEventListener("click", () => sendToBot());
  }
  if (draftEl) {
    draftEl.addEventListener("input", updateButtons);
  }

  if (isTelegram) {
    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
    } catch (error) {
      console.error(error);
    }

    if (htmlActions) {
      htmlActions.style.display = "none";
    }

    if (tg.MainButton) {
      tg.MainButton.onClick(() => sendToBot());
    }
    if (tg.SecondaryButton) {
      tg.SecondaryButton.onClick(copyDraft);
    }

    showStatus("Mini App подключен. Быстрые кнопки активны.");
  } else {
    if (htmlActions) {
      htmlActions.style.display = "flex";
    }
    showStatus("Открыт обычный браузер. Можно собрать текст и скопировать его.");
  }

  updateButtons();
});
