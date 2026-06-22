```typescript
import React, { useEffect } from "react";
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
  dismissAfter = 5000,
}: AlertProps) {
  useEffect(() => {
    if (dismissAfter && onDismiss) {
      const timer = setTimeout(onDismiss, dismissAfter);
      return () => clearTimeout(timer);
    }
  }, [dismissAfter, onDismiss]);

  return (
    <div className={`${styles.alert} ${styles[`alert-${type}`]}`}>
      <span className={styles.icon}>{iconMap[type]}</span>
      <span>{message}</span>
    </div>
  );
}
```
