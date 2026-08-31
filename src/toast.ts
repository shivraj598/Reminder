/**
 * Must stay self-contained: Chrome serializes this function into the page.
 * Do not reference imports or outer-scope bindings.
 */
export function showWaterReminderToast(message: string): void {
  const hostId = "water-reminder-toast-host";
  document.getElementById(hostId)?.remove();

  const host = document.createElement("div");
  host.id = hostId;
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .card {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 32px));
      box-sizing: border-box;
      padding: 12px 14px 12px 12px;
      display: grid;
      grid-template-columns: 36px 1fr auto;
      gap: 12px;
      align-items: start;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #eef7f6;
      background: #0d1b1b;
      border: 1px solid #2b5551;
      border-radius: 14px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(105, 230, 209, 0.05);
      animation: slide-in 220ms cubic-bezier(.2,.8,.2,1);
    }
    @keyframes slide-in {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .icon {
      width: 36px;
      height: 36px;
      border-radius: 11px;
      background: #69e6d1;
      color: #06201d;
      display: grid;
      place-items: center;
      font-size: 18px;
      line-height: 1;
    }
    .title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .body {
      margin: 4px 0 0;
      font-size: 13px;
      line-height: 1.4;
      color: #b5cbca;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .close {
      appearance: none;
      border: 0;
      background: transparent;
      color: #8da4a3;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 0 2px;
    }
    .close:hover { color: #eef7f6; }
  `;

  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");

  const icon = document.createElement("div");
  icon.className = "icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "💧";

  const copy = document.createElement("div");
  const title = document.createElement("p");
  title.className = "title";
  title.textContent = "Water Reminder";
  const body = document.createElement("p");
  body.className = "body";
  body.textContent = message;
  copy.append(title, body);

  const close = document.createElement("button");
  close.className = "close";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss");
  close.textContent = "×";

  wrap.append(icon, copy, close);
  shadow.append(style, wrap);
  document.documentElement.append(host);

  const remove = () => host.remove();
  close.addEventListener("click", remove);
  window.setTimeout(remove, 6000);
}
