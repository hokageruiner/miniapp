document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = !!tg;

  const draftEl = document.getElementById("payload");
  const statusEl = document.getElementById("status");
  const htmlActions = document.getElementById("htmlActions");
  const copyBtn = document.getElementById("copyBtn");
  const sendBtn = document.getElementById("sendBtn");

  const actionMap = {
    "court-template": () => setDraft(
      "14.03.2026 14:00 суд по делу №A21-025/2026
" +
      "суд: Московский районный суд
" +
      "адрес: г. Калининград, ул. Примерная, д. 1
" +
      "эксперт: Иванов"
    ),
    "outing-template": () => setDraft(
      "0734К-2026 14:00 14.03.2026 город Калининград, улица Красная, дом 7, квартира 10 " +
      "Залитие потолка эксперт: Иванов кто едет: Петров кто вёз: Lada " +
      "стоимость экспертизы: 15000 стоимость выезда: 3000"
    ),
    "today": () => quickCommand("/today"),
    "week": () => quickCommand("/week"),
    "upcoming": () => quickCommand("/upcoming"),
    "courts": () => quickCommand("/courts"),
    "trips": () => quickCommand("/trips"),
    "base": () => quickCommand("/base"),
  };

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#ff6b6b" : "";
  }

  function getDraft() {
    return (draftEl?.value || "").trim();
  }

  function setDraft(text) {
    if (!draftEl) return;
    draftEl.value = text;
    updateButtons();
    showStatus("Черновик обновлён.");
  }

  function updateButtons() {
    const hasText = !!getDraft();
    if (sendBtn) sendBtn.disabled = !hasText;
    if (copyBtn) copyBtn.disabled = !hasText;

    if (isTelegram && tg.MainButton && tg.SecondaryButton) {
      tg.MainButton.setText("Отправить в бота");
      hasText ? tg.MainButton.show() : tg.MainButton.hide();
      tg.SecondaryButton.setText("Скопировать");
      hasText ? tg.SecondaryButton.show() : tg.SecondaryButton.hide();
    }
  }

  async function copyDraft() {
    const text = getDraft();
    if (!text) return showStatus("Нечего копировать.", true);
    try {
      await navigator.clipboard.writeText(text);
      showStatus("Скопировано.");
    } catch {
      showStatus("Не удалось скопировать.", true);
    }
  }

  function sendToBot(payload = null) {
    const text = (payload || getDraft()).trim();
    if (!text) return showStatus("Поле пустое.", true);
    if (!isTelegram) {
      setDraft(text);
      return showStatus("В обычном браузере отправка в бота недоступна.", true);
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
    if (isTelegram) return sendToBot(command);
    setDraft(command);
    showStatus(`Команда ${command} подставлена в поле.`);
  }

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const handler = actionMap[action];
      if (handler) handler();
      else showStatus(`Неизвестное действие: ${action}`, true);
    });
  });

  if (copyBtn) copyBtn.addEventListener("click", copyDraft);
  if (sendBtn) sendBtn.addEventListener("click", () => sendToBot());
  if (draftEl) draftEl.addEventListener("input", updateButtons);

  if (isTelegram) {
    tg.ready();
    tg.expand();
    if (htmlActions) htmlActions.style.display = "none";
    if (tg.MainButton) {
      tg.MainButton.onClick(() => sendToBot());
    }
    if (tg.SecondaryButton) {
      tg.SecondaryButton.onClick(copyDraft);
    }
    showStatus("Mini App подключен. Быстрые кнопки активны.");
  } else {
    if (htmlActions) htmlActions.style.display = "flex";
    showStatus("Открыт обычный браузер. Можно собрать текст и скопировать его.");
  }

  updateButtons();
});
