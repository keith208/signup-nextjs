import { useEffect } from "react";
import styles from "./Alert.module.css";

export type AlertType = "error" | "success" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
  onDismiss?: () => void;
  dismissAfter?: number;
}

const iconMap: Record<AlertType, string> = {
  error: "✕",
  success: "✓",
  info: "ℹ",
};

export function Alert({
  type,
  message,
  onDismiss,
  dismissAfter,
}: AlertProps) {
  useEffect(() => {
    if (dismissAfter && onDismiss) {
      const timer = setTimeout(onDismiss, dismissAfter);
      return () => clearTimeout(timer);
    }
  }, [dismissAfter, onDismiss]);

  const alertTypeClass = styles[`alert-${type}`];

  return (
    <div className={`${styles.alert} ${alertTypeClass}`}>
      <span className={styles.icon}>{iconMap[type]}</span>
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
