document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp || null;
  const isTelegram = !!tg;
  const state = { type: "court" };

  const els = {
    status: document.getElementById("status"),
    preview: document.getElementById("preview"),
    htmlActions: document.getElementById("htmlActions"),
    copyBtn: document.getElementById("copyBtn"),
    sendBtn: document.getElementById("sendBtn"),
    courtFields: document.getElementById("courtFields"),
    outingFields: document.getElementById("outingFields"),
    switchBtns: Array.from(document.querySelectorAll(".switch-btn")),
    inputs: Array.from(document.querySelectorAll("input")),
  };

  const templates = {
    court: {
      date: "2026-03-14",
      time: "14:00",
      chat_alias: "",
      court_title: "Суд по делу о залитии",
      case_number: "A21-025/2026",
      court_expertise_number: "0734К-2026",
      court_name: "Московский районный суд",
      court_address: "г. Калининград, ул. Примерная, д. 1",
      assigned_person: "Иванов",
    },
    outing: {
      date: "2026-03-14",
      time: "14:00",
      chat_alias: "",
      outing_title: "Залитие потолка",
      outing_expertise_number: "0734К-2026",
      outing_address: "г. Калининград, ул. Красная, д. 7, кв. 10",
      expert_name: "Иванов",
      who_goes: "Петров",
      who_drove: "Lada",
      expertise_price: "15000",
      trip_price: "3000",
    },
  };

  function setStatus(text, mode = "info") {
    if (!els.status) return;
    els.status.textContent = text;
    els.status.className = `status is-${mode}`;
  }

  function input(id) {
    return document.getElementById(id);
  }

  function getCommonData() {
    return {
      date: input("date")?.value || "",
      time: input("time")?.value || "",
      chat_alias: input("chat_alias")?.value.trim() || "",
    };
  }

  function getCourtData() {
    return {
      ...getCommonData(),
      title: input("court_title")?.value.trim() || "",
      case_number: input("case_number")?.value.trim() || "",
      expertise_number: input("court_expertise_number")?.value.trim() || "",
      court_name: input("court_name")?.value.trim() || "",
      address: input("court_address")?.value.trim() || "",
      assigned_person: input("assigned_person")?.value.trim() || "",
    };
  }

  function getOutingData() {
    return {
      ...getCommonData(),
      title: input("outing_title")?.value.trim() || "",
      expertise_number: input("outing_expertise_number")?.value.trim() || "",
      address: input("outing_address")?.value.trim() || "",
      expert_name: input("expert_name")?.value.trim() || "",
      who_goes: input("who_goes")?.value.trim() || "",
      who_drove: input("who_drove")?.value.trim() || "",
      expertise_price: input("expertise_price")?.value.trim() || "",
      trip_price: input("trip_price")?.value.trim() || "",
    };
  }

  function buildPreview(type = state.type) {
    const data = type === "outing" ? getOutingData() : getCourtData();
    const lines = [];
    lines.push(type === "outing" ? "ВЫЕЗД" : "СУД");
    lines.push(`Дата: ${data.date || "—"}`);
    lines.push(`Время: ${data.time || "—"}`);
    if (data.chat_alias) lines.push(`Алиас чата: ${data.chat_alias}`);

    if (type === "outing") {
      lines.push(`Событие: ${data.title || "—"}`);
      lines.push(`Номер экспертизы: ${data.expertise_number || "—"}`);
      lines.push(`Адрес: ${data.address || "—"}`);
      lines.push(`Эксперт: ${data.expert_name || "—"}`);
      lines.push(`Кто едет: ${data.who_goes || "—"}`);
      lines.push(`Кто вёз: ${data.who_drove || "—"}`);
      lines.push(`Стоимость экспертизы: ${data.expertise_price || "—"}`);
      lines.push(`Стоимость выезда: ${data.trip_price || "—"}`);
    } else {
      lines.push(`Событие: ${data.title || "—"}`);
      lines.push(`Номер дела: ${data.case_number || "—"}`);
      lines.push(`Номер экспертизы: ${data.expertise_number || "—"}`);
      lines.push(`Суд: ${data.court_name || "—"}`);
      lines.push(`Адрес: ${data.address || "—"}`);
      lines.push(`Участник: ${data.assigned_person || "—"}`);
    }
    return lines.join("
");
  }

  function currentCreatePayload() {
    const data = state.type === "outing" ? getOutingData() : getCourtData();
    return {
      kind: "create",
      reminder_type: state.type,
      data,
      source_text: buildPreview(state.type),
    };
  }

  function updatePreview() {
    const preview = buildPreview(state.type);
    if (els.preview) els.preview.textContent = preview;
    const hasRequired = Boolean(getCommonData().date && getCommonData().time);
    if (els.sendBtn) els.sendBtn.disabled = !hasRequired;
    if (els.copyBtn) els.copyBtn.disabled = false;
    if (isTelegram && tg.MainButton && tg.SecondaryButton) {
      tg.MainButton.setText("Отправить в бота");
      hasRequired ? tg.MainButton.show() : tg.MainButton.hide();
      tg.SecondaryButton.setText("Скопировать");
      tg.SecondaryButton.show();
    }
  }

  function switchType(type) {
    state.type = type;
    els.switchBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.type === type));
    els.courtFields?.classList.toggle("is-hidden", type !== "court");
    els.outingFields?.classList.toggle("is-hidden", type !== "outing");
    updatePreview();
  }

  function applyTemplate(type) {
    const template = templates[type];
    if (!template) return;
    switchType(type);
    Object.entries(template).forEach(([key, value]) => {
      const el = input(key);
      if (el) el.value = value;
    });
    updatePreview();
    setStatus(type === "court" ? "Шаблон суда подставлен." : "Шаблон выезда подставлен.", "success");
  }

  async function copyPreview() {
    const text = buildPreview(state.type);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Черновик скопирован.", "success");
    } catch {
      setStatus("Не удалось скопировать черновик.", "error");
    }
  }

  function sendPayload(rawPayload) {
    if (!isTelegram) {
      setStatus("В обычном браузере отправка в бота недоступна. Используйте копирование.", "error");
      return;
    }
    try {
      tg.sendData(JSON.stringify(rawPayload));
      setStatus("Форма отправлена в бота.", "success");
    } catch (error) {
      console.error(error);
      setStatus("Ошибка при отправке формы в бота.", "error");
    }
  }

  function sendCurrentForm() {
    const common = getCommonData();
    if (!common.date || !common.time) {
      setStatus("Укажите дату и время.", "error");
      return;
    }
    sendPayload(currentCreatePayload());
  }

  function sendCommand(command) {
    const payload = { kind: "command", command };
    if (!isTelegram) {
      if (els.preview) els.preview.textContent = `/${command}`;
      setStatus(`Команда /${command} подготовлена. В браузере её можно только скопировать.`, "info");
      return;
    }
    sendPayload(payload);
  }

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "court-template") return applyTemplate("court");
      if (action === "outing-template") return applyTemplate("outing");
      if (action === "today") return sendCommand("today");
      if (action === "week") return sendCommand("week");
    });
  });

  els.switchBtns.forEach((button) => {
    button.addEventListener("click", () => switchType(button.dataset.type));
  });

  els.inputs.forEach((field) => {
    field.addEventListener("input", updatePreview);
  });

  els.copyBtn?.addEventListener("click", copyPreview);
  els.sendBtn?.addEventListener("click", sendCurrentForm);

  if (isTelegram) {
    document.body.classList.add("is-telegram");
    tg.ready();
    tg.expand();
    tg.MainButton.onClick(sendCurrentForm);
    tg.SecondaryButton.onClick(copyPreview);
    if (els.htmlActions) els.htmlActions.style.display = "none";
    setStatus("Mini App подключен. Формы и быстрые команды активны.", "success");
  } else {
    setStatus("Открыт браузер. Здесь доступны шаблоны, предпросмотр и копирование.", "info");
  }

  const now = new Date();
  const dateValue = now.toISOString().slice(0, 10);
  const timeValue = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (input("date") && !input("date").value) input("date").value = dateValue;
  if (input("time") && !input("time").value) input("time").value = timeValue;

  switchType("court");
  updatePreview();
});
