document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = !!tg;

  const draftEl = document.getElementById("draft");
  const statusEl = document.getElementById("status");
  const htmlActions = document.getElementById("html-actions");

  const btnToday = document.getElementById("btn-today");
  const btnWeek = document.getElementById("btn-week");
  const btnCourt = document.getElementById("btn-court");
  const btnTrip = document.getElementById("btn-trip");
  const btnUpcoming = document.getElementById("btn-upcoming");
  const btnCourts = document.getElementById("btn-courts");
  const btnTrips = document.getElementById("btn-trips");
  const btnBase = document.getElementById("btn-base");

  const copyBtn = document.getElementById("copy-btn");
  const sendBtn = document.getElementById("send-btn");

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
  }

  function updateButtons() {
    const hasText = !!getDraft();

    if (sendBtn) sendBtn.disabled = !hasText;
    if (copyBtn) copyBtn.disabled = !hasText;

    if (isTelegram && tg.MainButton && tg.SecondaryButton) {
      tg.MainButton.setText("Отправить в бота");
      if (hasText) tg.MainButton.show();
      else tg.MainButton.hide();

      tg.SecondaryButton.setText("Скопировать");
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
    } catch (e) {
      showStatus("Не удалось скопировать.", true);
    }
  }

  function sendToBot(payload = null) {
    const text = (payload || getDraft()).trim();

    if (!text) {
      showStatus("Поле пустое.", true);
      return;
    }

    if (!isTelegram) {
      setDraft(text);
      showStatus("В браузере команда только подставлена в поле. Отправка работает внутри Telegram.", true);
      return;
    }

    try {
      tg.sendData(text);
      showStatus(`Команда отправлена в бота: ${text}`);
    } catch (e) {
      console.error(e);
      showStatus("Ошибка при отправке в бота.", true);
    }
  }

  function quickCommand(command) {
    if (isTelegram) {
      sendToBot(command);
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

  if (btnToday) btnToday.addEventListener("click", () => quickCommand("/today"));
  if (btnWeek) btnWeek.addEventListener("click", () => quickCommand("/week"));
  if (btnUpcoming) btnUpcoming.addEventListener("click", () => quickCommand("/upcoming"));
  if (btnCourts) btnCourts.addEventListener("click", () => quickCommand("/courts"));
  if (btnTrips) btnTrips.addEventListener("click", () => quickCommand("/trips"));
  if (btnBase) btnBase.addEventListener("click", () => quickCommand("/base"));

  if (btnCourt) btnCourt.addEventListener("click", fillCourtTemplate);
  if (btnTrip) btnTrip.addEventListener("click", fillTripTemplate);

  if (copyBtn) copyBtn.addEventListener("click", copyDraft);
  if (sendBtn) sendBtn.addEventListener("click", () => sendToBot());

  if (draftEl) {
    draftEl.addEventListener("input", updateButtons);
  }

  if (isTelegram) {
    tg.ready();
    tg.expand();

    if (htmlActions) {
      htmlActions.style.display = "none";
    }

    if (tg.MainButton) {
      tg.MainButton.offClick(sendToBot);
      tg.MainButton.onClick(() => sendToBot());
    }

    if (tg.SecondaryButton) {
      tg.SecondaryButton.offClick(copyDraft);
      tg.SecondaryButton.onClick(copyDraft);
    }

    showStatus("Mini App подключен. Быстрые кнопки сразу отправляют команды в бота.");
  } else {
    if (htmlActions) {
      htmlActions.style.display = "flex";
    }
    showStatus("Открыт обычный браузер. Быстрые кнопки подставляют команды в поле.");
  }

  updateButtons();
});