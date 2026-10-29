import * as Sentry from "@sentry/browser";

// DSN é um identificador público de ingestão, não um token administrativo.
// A integração fica desativada até VITE_SENTRY_DSN ser configurada.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE,
    defaultIntegrations: false,
    sendDefaultPii: false,
    beforeSend(event) {
      return {
        event_id: event.event_id, timestamp: event.timestamp, platform: "javascript",
        level: "error", message: "Unhandled browser error",
        release: import.meta.env.VITE_APP_RELEASE,
        tags: { component: "browser" },
      };
    },
  });
  window.addEventListener("error", () => Sentry.captureMessage("Unhandled browser error", "error"));
  window.addEventListener("unhandledrejection", () => Sentry.captureMessage("Unhandled promise rejection", "error"));
}
