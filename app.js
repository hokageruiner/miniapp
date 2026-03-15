document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = Boolean(tg);

  const payloadEl = document.getElementById("payload");
  const statusEl = document.getElementById("status");
  const htmlActionsEl = document.getElementById("htmlActions");
  const copyBtn = document.getElementById("copyBtn");
  const sendBtn = document.getElementById("sendBtn");
  const actionButtons = document.querySelectorAll("[data-action]");

  function setStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#ff6b6b" : "";
  }

  function getPayload() {
    return (payloadEl?.value || "").trim();
  }

  function setPayload(text) {
    if (!payloadEl) return;
    payloadEl.value = text;
    syncButtons();
  }

  function syncButtons() {
    const hasText = Boolean(getPayload());
    if (copyBtn) copyBtn.disabled = !hasText;
    if (sendBtn) sendBtn.disabled = !hasText;

    if (!isTelegram) return;

    if (tg.MainButton) {
      tg.MainButton.setText("Отправить в бота");
      if (hasText) tg.MainButton.show();
      else tg.MainButton.hide();
    }

    if (tg.SecondaryButton) {
      tg.SecondaryButton.setText("Скопировать");
      if (hasText) tg.SecondaryButton.show();
      else tg.SecondaryButton.hide();
    }
  }

  async function copyPayload() {
    const text = getPayload();
    if (!text) {
      setStatus("Нечего копировать.", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Скопировано.");
    } catch (error) {
      console.error(error);
      setStatus("Не удалось скопировать.", true);
    }
  }

  function sendToBot(text = null) {
    const payload = (text || getPayload()).trim();
    if (!payload) {
      setStatus("Поле пустое.", true);
      return;
    }

    if (!isTelegram) {
      setPayload(payload);
      setStatus("В браузере команда только подставлена. Отправка работает внутри Telegram.", true);
      return;
    }

    try {
      tg.sendData(payload);
      setStatus(`Отправлено: ${payload}`);
    } catch (error) {
      console.error(error);
      setStatus("Ошибка при отправке в бота.", true);
    }
  }

  function fillTemplate(type) {
    if (type === "court-template") {
      setPayload(
        [
          "14.03.2026 14:00 суд по делу №A21-025/2026",
          "суд: Московский районный суд",
          "адрес: г. Калининград, ул. Примерная, д. 1",
          "эксперт: Иванов",
        ].join("\n")
      );
      setStatus("Шаблон суда подставлен.");
      return;
    }

    if (type === "outing-template") {
      setPayload(
        [
          "0734К-2026 14:00 14.03.2026",
          "город Калининград, улица Красная, дом 7, квартира 10",
          "Залитие потолка",
          "эксперт: Иванов",
          "кто едет: Петров",
          "кто вёз: Lada",
          "стоимость экспертизы: 15000",
          "стоимость выезда: 3000",
        ].join("\n")
      );
      setStatus("Шаблон выезда подставлен.");
    }
  }

  function handleAction(action) {
    switch (action) {
      case "today":
        sendToBot("/today");
        break;
      case "week":
        sendToBot("/week");
        break;
      case "upcoming":
        sendToBot("/upcoming");
        break;
      case "courts":
        sendToBot("/courts");
        break;
      case "trips":
        sendToBot("/trips");
        break;
      case "base":
        sendToBot("/base");
        break;
      case "court-template":
      case "outing-template":
        fillTemplate(action);
        break;
      default:
        setStatus(`Неизвестное действие: ${action}`, true);
    }
  }

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action) handleAction(action);
    });
  });

  if (payloadEl) payloadEl.addEventListener("input", syncButtons);
  if (copyBtn) copyBtn.addEventListener("click", copyPayload);
  if (sendBtn) sendBtn.addEventListener("click", () => sendToBot());

  if (isTelegram) {
    tg.ready();
    tg.expand();

    if (htmlActionsEl) htmlActionsEl.style.display = "none";

    if (tg.MainButton) {
      tg.MainButton.offClick(sendToBot);
      tg.MainButton.onClick(() => sendToBot());
    }

    if (tg.SecondaryButton) {
      tg.SecondaryButton.offClick(copyPayload);
      tg.SecondaryButton.onClick(copyPayload);
    }

    setStatus("Mini App подключен.");
  } else {
    if (htmlActionsEl) htmlActionsEl.style.display = "flex";
    setStatus("Открыт обычный браузер. Команды подставляются в поле.");
  }

  syncButtons();
});
