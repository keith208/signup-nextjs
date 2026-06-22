```typescript
import React from "react";
import styles from "./AccountTypeSelector.module.css";

export type AccountType = "personal" | "personal_plus" | "business";

interface AccountTypeSelectorProps {
  value: AccountType;
  onChange: (type: AccountType) => void;
}

const types: Array<{
  id: AccountType;
  icon: string;
  name: string;
  description: string;
  badge: string;
}> = [
  {
    id: "personal",
    icon: "👤",
    name: "Personal",
    description: "Individual",
    badge: "1 seat",
  },
  {
    id: "personal_plus",
    icon: "👨‍👩‍👧",
    name: "Personal+",
    description: "Family / friends",
    badge: "5 seats",
  },
  {
    id: "business",
    icon: "🏢",
    name: "Business",
    description: "Org / multi-user",
    badge: "Team",
  },
];

export function AccountTypeSelector({
  value,
  onChange,
}: AccountTypeSelectorProps) {
  return (
    <div className={styles.grid}>
      {types.map((type) => (
        <button
          key={type.id}
          className={`${styles.button} ${styles[`selected-${value === type.id ? type.id : ""}`]}`}
          onClick={() => onChange(type.id)}
          data-selected={value === type.id}
        >
          <span className={styles.badge} data-type={type.id}>
            {type.badge}
          </span>
          <span className={styles.icon}>{type.icon}</span>
          <span className={styles.name}>{type.name}</span>
          <span className={styles.description}>{type.description}</span>
        </button>
      ))}
    </div>
  );
}
```
