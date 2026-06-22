import styles from "./BrandLogo.module.css";

interface BrandLogoProps {
  appName?: string;
}

export function BrandLogo({ appName = "Platform" }: BrandLogoProps) {
  return (
    <div className={styles.brand}>
      <div className={styles.icon}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className={styles.name}>{appName}</span>
    </div>
  );
}
