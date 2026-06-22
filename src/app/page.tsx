import React from "react";
import { Metadata } from "next";
import { BrandLogo } from "@/components/BrandLogo";
import { SignupForm } from "@/components/SignupForm";
import "@/styles/globals.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Create Account | Platform",
  description: "Sign up for Platform and get started in seconds.",
};

export default function SignupPage() {
  return (
    <main className={styles.main}>
      <div className={styles.pageWrap}>
        <div className={styles.header}>
          <BrandLogo appName={process.env.NEXT_PUBLIC_APP_NAME || "Platform"} />
        </div>
        <div className={styles.card}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Choose a plan and get started in seconds.</p>
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
