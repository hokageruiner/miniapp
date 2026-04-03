(function () {
  const w = window;

  function parseParams() {
    const out = {};
    const sources = [w.location.search, w.location.hash];
    for (const src of sources) {
      const raw = (src || '').replace(/^[?#]/, '');
      if (!raw) continue;
      const params = new URLSearchParams(raw);
      for (const [key, value] of params.entries()) {
        if (!(key in out)) out[key] = value;
      }
    }
    return out;
  }

  function safeJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function postEvent(eventType, eventData) {
    const data = typeof eventData === 'string' ? eventData : JSON.stringify(eventData || {});

    try {
      if (w.TelegramWebviewProxy && typeof w.TelegramWebviewProxy.postEvent === 'function') {
        w.TelegramWebviewProxy.postEvent(eventType, data);
        return true;
      }
    } catch (_) {}

    try {
      if (w.external && typeof w.external.notify === 'function') {
        w.external.notify(JSON.stringify({ eventType, eventData: data }));
        return true;
      }
    } catch (_) {}

    try {
      if (w.parent && w.parent !== w && typeof w.parent.postMessage === 'function') {
        w.parent.postMessage(JSON.stringify({ eventType, eventData: data }), '*');
        return true;
      }
    } catch (_) {}

    return false;
  }

  function createButton() {
    let visible = false;
    let text = '';
    const handlers = new Set();
    return {
      setText(value) { text = String(value || ''); },
      getText() { return text; },
      show() { visible = true; },
      hide() { visible = false; },
      isVisible() { return visible; },
      onClick(fn) { if (typeof fn === 'function') handlers.add(fn); },
      offClick(fn) { if (typeof fn === 'function') handlers.delete(fn); else handlers.clear(); },
      _trigger() { handlers.forEach((fn) => { try { fn(); } catch (_) {} }); },
    };
  }

  const params = parseParams();
  const hasNativeBridge = !!(
    (w.Telegram && w.Telegram.WebApp) ||
    w.TelegramWebviewProxy ||
    (w.external && typeof w.external.notify === 'function') ||
    params.tgWebAppData || params.tgWebAppVersion || params.tgWebAppPlatform
  );

  w.__BNEO_TG_CONTEXT__ = {
    params,
    hasNativeBridge,
    source: w.TelegramWebviewProxy ? 'TelegramWebviewProxy' : ((w.external && typeof w.external.notify === 'function') ? 'window.external.notify' : (params.tgWebAppVersion ? 'tgWebApp URL params' : 'none')),
  };

  if (w.Telegram && w.Telegram.WebApp) {
    w.__BNEO_TG_WEBAPP__ = w.Telegram.WebApp;
    return;
  }

  if (!hasNativeBridge) {
    return;
  }

  const mainButton = createButton();
  const secondaryButton = createButton();
  const themeParams = safeJson(params.tgWebAppThemeParams, {});

  const webApp = {
    initData: params.tgWebAppData || '',
    initDataUnsafe: {},
    version: params.tgWebAppVersion || '0.0',
    platform: params.tgWebAppPlatform || 'unknown',
    colorScheme: params.tgWebAppThemeParams ? 'telegram' : 'unknown',
    themeParams,
    MainButton: mainButton,
    SecondaryButton: secondaryButton,
    ready() { postEvent('web_app_ready', {}); },
    expand() { postEvent('web_app_expand', {}); },
    close(options) { postEvent('web_app_close', options || {}); },
    sendData(data) {
      const text = String(data || '');
      if (!text) return;
      postEvent('web_app_data_send', { data: text });
    },
    onEvent(eventType, handler) {
      const normalized = String(eventType || '').toLowerCase();
      if (normalized === 'mainbuttonclicked') mainButton.onClick(handler);
      if (normalized === 'secondarybuttonclicked') secondaryButton.onClick(handler);
    },
    offEvent(eventType, handler) {
      const normalized = String(eventType || '').toLowerCase();
      if (normalized === 'mainbuttonclicked') mainButton.offClick(handler);
      if (normalized === 'secondarybuttonclicked') secondaryButton.offClick(handler);
    },
  };

  w.Telegram = w.Telegram || {};
  w.Telegram.WebApp = webApp;
  w.__BNEO_TG_WEBAPP__ = webApp;
})();
