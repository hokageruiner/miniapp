(function () {
  const tg = window.Telegram?.WebApp;
  const isTelegram = !!tg;

  const draftEl = document.getElementById("draft");
  const statusEl = document.getElementById("status");
  const btnToday = document.getElementById("btn-today");
  const btnWeek = document.getElementById("btn-week");
  const btnCourt = document.getElementById("btn-court");
  const btnTrip = document.getElementById("btn-trip");
  const copyBtn = document.getElementById("copy-btn");
  const sendBtn = document.getElementById("send-btn");
  const htmlActions = document.getElementById("html-actions");

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#ff7a7a" : "";
  }

  function getDraft() {
    return (draftEl?.value || "").trim();
  }

  function setDraft(text) {
    if (!draftEl) return;
    draftEl.value = text;
    updateButtons();
  }

  function appendDraft(text) {
    if (!draftEl) return;
    const current = draftEl.value.trim();
    draftEl.value = current ? `${current}\n${text}` : text;
    updateButtons();
  }

  function copyDraft() {
    const value = getDraft();
    if (!value) {
      showStatus("Нечего копировать.", true);
      return;
    }

    navigator.clipboard.writeText(value)
      .then(() => showStatus("Скопировано."))
      .catch(() => showStatus("Не удалось скопировать.", true));
  }

  function sendToBot() {
    const payload = getDraft();

    if (!payload) {
      showStatus("Поле пустое.", true);
      return;
    }

    if (!isTelegram) {
      showStatus("Отправка в бота работает только внутри Telegram.", true);
      return;
    }

    try {
      tg.sendData(payload);
      showStatus("Команда отправлена в бота.");
      // ВАЖНО: окно не закрываем автоматически
    } catch (error) {
      console.error(error);
      showStatus("Ошибка при отправке в бота.", true);
    }
  }

  function updateButtons() {
    const hasText = !!getDraft();

    if (isTelegram) {
      tg.MainButton.setText("Отправить в бота");
      tg.MainButton[hasText ? "show" : "hide"]();

      tg.SecondaryButton.setText("Скопировать");
      tg.SecondaryButton[hasText ? "show" : "hide"]();
    }

    if (sendBtn) sendBtn.disabled = !hasText;
    if (copyBtn) copyBtn.disabled = !hasText;
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

  function setTodayCommand() {
    setDraft("/today");
    showStatus("Команда на сегодня готова.");
  }

  function setWeekCommand() {
    setDraft("/week");
    showStatus("Команда на неделю готова.");
  }

  if (btnToday) btnToday.addEventListener("click", setTodayCommand);
  if (btnWeek) btnWeek.addEventListener("click", setWeekCommand);
  if (btnCourt) btnCourt.addEventListener("click", fillCourtTemplate);
  if (btnTrip) btnTrip.addEventListener("click", fillTripTemplate);
  if (copyBtn) copyBtn.addEventListener("click", copyDraft);
  if (sendBtn) sendBtn.addEventListener("click", sendToBot);
  if (draftEl) {
    draftEl.addEventListener("input", updateButtons);
  }

  if (isTelegram) {
    tg.ready();
    tg.expand();

    if (htmlActions) {
      htmlActions.style.display = "none";
    }

    tg.MainButton.offClick(sendToBot);
    tg.SecondaryButton.offClick(copyDraft);

    tg.MainButton.onClick(sendToBot);
    tg.SecondaryButton.onClick(copyDraft);

    showStatus("Внизу Telegram показаны встроенные кнопки «Скопировать» и «Отправить в бота».");
  } else {
    if (htmlActions) {
      htmlActions.style.display = "flex";
    }
    showStatus("В обычном браузере доступно копирование. Отправка в бота работает только внутри Telegram.");
  }

  updateButtons();
})();