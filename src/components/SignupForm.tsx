"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { isPersonalEmail, isValidEmail } from "@/lib/emailValidation";
import { AccountTypeSelector, type AccountType } from "./AccountTypeSelector";
import { PasswordInput } from "./PasswordInput";
import { Alert, type AlertType } from "./Alert";
import styles from "./SignupForm.module.css";

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !==
    "https://yourproject.supabase.co";

interface FormState {
  orgName: string;
  email: string;
  password: string;
  promoCode: string;
}

interface AlertState {
  type: AlertType;
  message: string;
}

interface PromoGrant {
  valid: boolean;
  duration_days: number;
  applies_to_all_apps: boolean;
}

export function SignupForm() {
  const [form, setForm] = useState<FormState>({
    orgName: "",
    email: "",
    password: "",
    promoCode: "",
  });

  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [promoValidated, setPromoValidated] = useState(false);
  const [promoGrant, setPromoGrant] = useState<PromoGrant | null>(null);
  const [showRedirectNotice, setShowRedirectNotice] = useState(false);

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    setAlert(null);
    setShowRedirectNotice(false);

    if (type === "personal_plus" && form.email) {
      handleAccountTypeSelection(type, form.email);
    }
  };

  const handleAccountTypeSelection = (
    selectedType: AccountType,
    email: string
  ) => {
    if (selectedType === "personal_plus" && !isPersonalEmail(email)) {
      setAccountType("business");
      setShowRedirectNotice(true);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    setForm((prev) => ({ ...prev, email }));

    if (email && accountType === "personal_plus") {
      handleAccountTypeSelection("personal_plus", email);
    }
  };

  const showError = (message: string) => {
    setAlert({ type: "error", message });
  };

  const showSuccess = (message: string) => {
    setAlert({ type: "success", message });
  };

  const showInfo = (message: string) => {
    setAlert({ type: "info", message });
  };

  const validate = (): boolean => {
    if (!form.orgName.trim()) {
      showError("Please enter your name or organization name.");
      return false;
    }
    if (!form.email.trim() || !isValidEmail(form.email)) {
      showError("Please enter a valid email address.");
      return false;
    }
    if (form.password.length < 8) {
      showError("Password must be at least 8 characters.");
      return false;
    }
    return true;
  };

  const handleApplyPromo = async () => {
    const code = form.promoCode.trim().toUpperCase();
    if (!code) {
      showError("Please enter a promo code.");
      return;
    }

    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setPromoGrant({
          valid: true,
          duration_days: 30,
          applies_to_all_apps: true,
        });
        setPromoValidated(true);
        setForm((prev) => ({
          ...prev,
          promoCode: code,
        }));
        showSuccess("✓ Promo applied — 30-day trial, all apps.");
      } else {
        const response = await fetch("/api/validate-promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();
        if (!data.valid) {
          showError("Invalid or expired promo code.");
          return;
        }

        setPromoGrant(data);
        setPromoValidated(true);
        showSuccess(
          `✓ Promo applied — ${data.duration_days}-day trial.`
        );
      }
    } catch (error) {
      showError("Could not validate promo code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!validate()) return;

    if (
      accountType === "personal_plus" &&
      !isPersonalEmail(form.email)
    ) {
      setAccountType("business");
      showInfo("Work email detected — switched to Business signup.");
      return;
    }

    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showSuccess(
          `Demo mode: Account created for ${form.email}. Connect Supabase to enable real sign-up.`
        );
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

      if (authError) {
        showError(authError.message);
        return;
      }

      const user = authData.user;
      if (!user) {
        showError("Failed to create user.");
        return;
      }

      const seatLimits: Record<AccountType, number | null> = {
        personal: 1,
        personal_plus: 5,
        business: null,
      };

  // Call Edge Function to create org + member (bypasses RLS)
const signupFunctionUrl = "https://owgovplzxyosovctmafe.supabase.co/functions/v1/signup-ts";
// Replace YOUR_PROJECT_ID with your actual Supabase project ID

const promoExpires = promoGrant
  ? new Date(Date.now() + promoGrant.duration_days * 86400000)
  : null;

const { data: orgData, error: orgError } = await (async () => {
  try {
    const response = await fetch(signupFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgName: form.orgName,
        accountType: accountType,
        promoCode: form.promoCode || null,
        promoExpires: promoExpires,
        seatLimit: seatLimits[accountType],
        userId: user.id,
        promoStatus: promoGrant ? "trialing" : "inactive",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { data: null, error: { message: error.error || "Unknown error" } };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Request failed" },
    };
  }
})();

if (orgError) {
  showError("Failed to create organization: " + orgError.message);
  return;
}

if (!orgData || !orgData.org_id) {
  showError("Failed to create organization.");
  return;
}

// Continue with promo app access if applicable
const org = { id: orgData.org_id };

      if (promoGrant?.applies_to_all_apps) {
        const { data: apps } = await supabase
          .from("apps")
          .select("id");

        if (apps && apps.length > 0) {
          await supabase.from("org_app_access").insert(
            apps.map((app: any) => ({
              org_id: org.id,
              app_id: app.id,
              granted_by: "promo",
              expires_at: org.promo_expires_at,
            }))
          );
        }
      }

      showSuccess(
        "Account created! Check your email for a confirmation link."
      );
      setForm({ orgName: "", email: "", password: "", promoCode: "" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const orgLabel =
    accountType === "personal" || accountType === "personal_plus"
      ? "Your name"
      : "Organization name";

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {!isSupabaseConfigured && (
        <div className={styles.configWarning}>
          <span>⚠️</span>
          <span>
            Supabase is not configured. Replace{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your .env.local to enable real
            sign-up. In demo mode, the form validates and simulates success.
          </span>
        </div>
      )}

      {showRedirectNotice && (
        <div className={styles.redirectNotice}>
          <span>💼</span>
          <span>
            Work email detected — switched to <strong>Business</strong> signup.
          </span>
        </div>
      )}

      <div className={styles.divider}>Account type</div>

      <AccountTypeSelector
        value={accountType}
        onChange={handleAccountTypeChange}
      />

      {accountType === "personal_plus" && (
        <div className={styles.notice}>
          Personal+ requires a personal email (Gmail, Outlook, iCloud, etc.).
          Work emails will be automatically redirected to Business.
        </div>
      )}

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert(null)}
          dismissAfter={alert.type === "success" ? 5000 : undefined}
        />
      )}

      <div className={styles.divider}>Account details</div>

      <div className={styles.field}>
        <label htmlFor="orgName">
          {orgLabel}
          <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="orgName"
          placeholder={
            accountType === "personal" || accountType === "personal_plus"
              ? "Jane Smith"
              : "Acme Corporation"
          }
          value={form.orgName}
          onChange={(e) => setForm((prev) => ({ ...prev, orgName: e.target.value }))}
          autoComplete="organization"
          disabled={isLoading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="email">
          Email address
          <span className={styles.required}>*</span>
        </label>
        <input
          type="email"
          id="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleEmailChange}
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">
          Password
          <span className={styles.required}>*</span>
        </label>
        <PasswordInput
          value={form.password}
          onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
          disabled={isLoading}
          placeholder="At least 8 characters"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="promoCode">
          Promo code
          <span className={styles.optional}>(optional)</span>
        </label>
        <div className={styles.promoRow}>
          <input
            type="text"
            id="promoCode"
            placeholder="YOURCODE"
            value={form.promoCode}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                promoCode: e.target.value.toUpperCase(),
              }))
            }
            disabled={isLoading || promoValidated}
            style={{ textTransform: "uppercase" }}
          />
          <button
            type="button"
            className={styles.promoBtn}
            onClick={handleApplyPromo}
            disabled={isLoading || promoValidated || !form.promoCode}
          >
            {promoValidated ? "Applied ✓" : "Apply"}
          </button>
        </div>
        {promoValidated && promoGrant && (
          <div className={styles.promoHint} style={{ color: "var(--success)" }}>
            ✓ Promo applied — {promoGrant.duration_days}-day trial,{" "}
            {promoGrant.applies_to_all_apps ? "all apps" : "selected apps"}.
          </div>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <div className={styles.footer}>
        Already have an account?{" "}
        <a href="/login">Sign in</a>
      </div>
    </form>
  );
}
