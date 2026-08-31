/**
 * Must stay fully self-contained: Chrome serializes this single function into
 * the page, so it cannot reference any other module, import, helper, or
 * outer-scope binding. Everything must live inside this function body.
 */
export function showReminderToast(
  title: string,
  message: string,
  icon: string,
  theme: "water" | "general",
): void {
  const hostId = "reminder-toast-host";
  document.getElementById(hostId)?.remove();

  const isWater = theme === "water";
  const host = document.createElement("div");
  host.id = hostId;
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  const accent = isWater ? "#0e9c8c" : "#e0932d";
  const accentFg = isWater ? "#0b3d38" : "#3a2406";
  const ink = "#2a2f42";
  style.textContent = `
    .sk-card {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 32px));
      box-sizing: border-box;
      padding: 12px 14px 12px 12px;
      display: grid;
      grid-template-columns: 38px 1fr auto;
      gap: 12px;
      align-items: start;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: ${ink};
      background: #fbf8ef;
      border: 2px solid ${ink};
      border-radius: 10px 16px 11px 17px;
      box-shadow: 4px 5px 0 ${ink};
      animation: sk-in 220ms cubic-bezier(.2,.8,.2,1);
    }
    @keyframes sk-in {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .sk-icon {
      width: 38px;
      height: 38px;
      border-radius: 9px;
      background: ${accent};
      color: ${accentFg};
      display: grid;
      place-items: center;
      font-size: 19px;
      line-height: 1;
      border: 2px solid ${ink};
      box-shadow: 2px 2px 0 ${ink};
    }
    .sk-title {
      margin: 0;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.01em;
      text-transform: uppercase;
    }
    .sk-body {
      margin: 4px 0 0;
      font-size: 13px;
      line-height: 1.4;
      color: #4a4f63;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .sk-close {
      appearance: none;
      border: 2px solid ${ink};
      background: #fff8ec;
      color: ${ink};
      width: 22px;
      height: 22px;
      border-radius: 7px;
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
    }
    .sk-close:hover { background: #eceae0; }
  `;

  const wrap = document.createElement("div");
  wrap.className = "sk-card";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");

  const iconEl = document.createElement("div");
  iconEl.className = "sk-icon";
  iconEl.setAttribute("aria-hidden", "true");
  iconEl.textContent = icon;

  const copy = document.createElement("div");
  const titleEl = document.createElement("p");
  titleEl.className = "sk-title";
  titleEl.textContent = title;
  const bodyEl = document.createElement("p");
  bodyEl.className = "sk-body";
  bodyEl.textContent = message;
  copy.append(titleEl, bodyEl);

  const close = document.createElement("button");
  close.className = "sk-close";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss");
  close.textContent = "×";

  wrap.append(iconEl, copy, close);
  shadow.append(style, wrap);
  document.documentElement.append(host);

  const remove = () => host.remove();
  close.addEventListener("click", remove);
  window.setTimeout(remove, 6000);
}
