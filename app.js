document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = !!tg;

  const draftEl = document.getElementById("payload");
  const statusEl = document.getElementById("status");
  const copyBtn = document.getElementById("copyBtn");
  const sendBtn = document.getElementById("sendBtn");

  const templates = {
    court: [
      "14.03.2026 14:00 суд по делу №A21-025/2026",
      "суд: Московский районный суд",
      "адрес: г. Калининград, ул. Примерная, д. 1",
      "эксперт: Иванов",
    ].join("\n"),
    outing: [
      "0734К-2026 14:00 14.03.2026",
      "адрес: г. Калининград, ул. Красная, д. 7, кв. 10",
      "описание: залитие потолка",
      "эксперт: Иванов",
      "кто едет: Петров",
      "кто вёз: Lada",
      "стоимость экспертизы: 15000",
      "стоимость выезда: 3000",
    ].join("\n"),
  };

  function showStatus(text, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove("is-success", "is-error");
    if (type === "success") statusEl.classList.add("is-success");
    if (type === "error") statusEl.classList.add("is-error");
  }

  function getDraft() {
    return (draftEl?.value || "").trim();
  }

  function setDraft(text) {
    if (!draftEl) return;
    draftEl.value = text;
    updateButtons();
  }

  function updateButtons() {
    const hasText = !!getDraft();
    if (copyBtn) copyBtn.disabled = !hasText;
    if (sendBtn) sendBtn.disabled = !hasText;
  }

  async function copyDraft() {
    const text = getDraft();
    if (!text) {
      showStatus("Нечего копировать.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showStatus("Черновик скопирован.", "success");
    } catch (error) {
      showStatus("Не удалось скопировать текст.", "error");
    }
  }

  function sendToBot(payload = null) {
    const text = (payload || getDraft()).trim();
    if (!text) {
      showStatus("Сначала заполните черновик.", "error");
      return;
    }

    if (!isTelegram) {
      setDraft(text);
      showStatus("Открыто вне Telegram: команда только подставлена в черновик.", "error");
      return;
    }

    try {
      tg.sendData(text);
      showStatus(`Отправлено в бота: ${text}`, "success");
    } catch (error) {
      console.error(error);
      showStatus("Ошибка при отправке в бота.", "error");
    }
  }

  function quickCommand(command) {
    setDraft(command);
    sendToBot(command);
  }

  function applyTemplate(kind) {
    if (kind === "court") {
      setDraft(templates.court);
      showStatus("Шаблон суда подставлен.", "success");
      return;
    }
    if (kind === "outing") {
      setDraft(templates.outing);
      showStatus("Шаблон выезда подставлен.", "success");
    }
  }

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "today") return quickCommand("/today");
      if (action === "week") return quickCommand("/week");
      if (action === "court-template") return applyTemplate("court");
      if (action === "outing-template") return applyTemplate("outing");
    });
  });

  if (copyBtn) copyBtn.addEventListener("click", copyDraft);
  if (sendBtn) sendBtn.addEventListener("click", () => sendToBot());
  if (draftEl) draftEl.addEventListener("input", updateButtons);

  if (isTelegram) {
    tg.ready();
    tg.expand();
    document.body.classList.add("is-telegram");
    showStatus("Mini App подключен. Быстрые команды и кнопка отправки работают внутри Telegram.");
  } else {
    showStatus("Открыт обычный браузер. Шаблоны и копирование работают локально.");
  }

  updateButtons();
});
