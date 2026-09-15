type NotificationType = "info" | "success" | "warning" | "danger";

interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

const MAX_NOTIFICATION = 5;
const FLASH_KEY = "finwall:flash-notification";

export function useNotification() {
  const notifications = useState<Notification[]>("notifications", () => []);

  function notify(notification: Omit<Notification, "id">) {
    const id = crypto.randomUUID();

    notifications.value.unshift({
      id,
      duration: 5000,
      dismissible: true,
      ...notification,
    });

    if (notifications.value.length > MAX_NOTIFICATION) {
      notifications.value.pop();
    }
  }

  /** Simpen notif sebelum full navigation, biar kebaca lagi setelah reload. */
  function notifyAfterReload(notification: Omit<Notification, "id">) {
    if (import.meta.client) {
      sessionStorage.setItem(FLASH_KEY, JSON.stringify(notification));
    }
  }

  /** Panggil ini sekali di app.vue / plugin client, buat "ambil" flash notif. */
  function consumeFlashNotification() {
    if (!import.meta.client) return;
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FLASH_KEY);
    try {
      notify(JSON.parse(raw));
    } catch {
      // ignore corrupt payload
    }
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter(
      (notification) => notification.id !== id,
    );
  }

  function clear() {
    notifications.value = [];
  }

  return {
    notifications,
    notifyAfterReload,
    consumeFlashNotification,
    notify,
    dismiss,
    clear,
  };
}
