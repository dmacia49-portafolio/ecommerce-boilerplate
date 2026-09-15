"use client";
import { useRouter } from "next/navigation";

import { FormEvent, useEffect, useRef, useState } from "react";

type SquareConfig = {
  applicationId: string;
  locationId: string;
  environment: "sandbox" | "production";
};

type AchTokenResult = {
  status: string;
  token?: string;
};

type AchTokenizationEvent = {
  detail: {
    tokenResult: AchTokenResult;
    error?: unknown;
  };
};

type SquareAch = {
  addEventListener(
    eventName: "ontokenization",
    listener: (event: AchTokenizationEvent) => void,
  ): void;

  tokenize(options: {
    accountHolderName: string;
    intent: "CHARGE";
    amount: string;
    currency: "USD";
  }): Promise<unknown>;

  destroy(): Promise<boolean>;
};

type SquarePayments = {
  ach(options: {
    redirectURI: string;
    transactionId: string;
  }): Promise<SquareAch>;
};

type SquareBrowserSdk = {
  payments(applicationId: string, locationId: string): SquarePayments;
};

type SquareWindow = Window & {
  Square?: SquareBrowserSdk;
};

type PaymentApiResponse = {
  paymentId?: string;

  status?: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";

  error?: string;
};

type Props = {
  orderNumber: string;
  amount: string;
};

function getSquareScriptUrl(environment: "sandbox" | "production") {
  return environment === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";
}

function loadSquareScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const squareWindow = window as SquareWindow;

    if (squareWindow.Square) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-square-web-sdk="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), {
        once: true,
      });

      existing.addEventListener(
        "error",
        () => reject(new Error("Square Web Payments SDK failed to load.")),
        {
          once: true,
        },
      );

      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.async = true;

    script.setAttribute("data-square-web-sdk", "true");

    script.addEventListener("load", () => resolve(), {
      once: true,
    });

    script.addEventListener(
      "error",
      () => reject(new Error("Square Web Payments SDK failed to load.")),
      {
        once: true,
      },
    );

    document.head.appendChild(script);
  });
}

export function SquareAchAuthorization({ orderNumber, amount }: Props) {
  const achRef = useRef<SquareAch | null>(null);

  const router = useRouter();

  const [accountHolderName, setAccountHolderName] = useState("");

  const [ready, setReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [paymentAccepted, setPaymentAccepted] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    let achInstance: SquareAch | null = null;

    async function sendTokenToServer(sourceToken: string) {
      setMessage("Submitting ACH payment...");

      try {
        const response = await fetch("/api/payments/square/ach", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            orderNumber,
            sourceToken,
          }),
        });

        const result = (await response.json()) as PaymentApiResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to process ACH payment.");
        }

        if (result.status === "PROCESSING" || result.status === "PENDING") {
          if (!disposed) {
            setPaymentAccepted(true);

            router.push(`/checkout/${orderNumber}/processing`);
          }

          return;
        }

        if (result.status === "SUCCEEDED") {
          if (!disposed) {
            setPaymentAccepted(true);

            router.push(`/checkout/${orderNumber}/processing`);
          }

          return;
        }

        throw new Error("The ACH payment was not accepted.");
      } catch (error) {
        console.error("ACH payment submission failed:", error);

        if (!disposed) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to process ACH payment.",
          );
        }
      } finally {
        if (!disposed) {
          setSubmitting(false);
        }
      }
    }

    async function initialize() {
      try {
        const response = await fetch("/api/payments/square/config", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load Square configuration.");
        }

        const config = (await response.json()) as SquareConfig;

        await loadSquareScript(getSquareScriptUrl(config.environment));

        const squareWindow = window as SquareWindow;

        if (!squareWindow.Square) {
          throw new Error("Square Web Payments SDK is unavailable.");
        }

        const payments = squareWindow.Square.payments(
          config.applicationId,
          config.locationId,
        );

        achInstance = await payments.ach({
          transactionId: orderNumber,

          redirectURI: `${window.location.origin}/checkout/${orderNumber}`,
        });

        achInstance.addEventListener("ontokenization", (event) => {
          if (event.detail.error) {
            console.error(
              "Square ACH tokenization failed:",
              event.detail.error,
            );

            if (!disposed) {
              setSubmitting(false);

              setMessage("Bank authorization failed.");
            }

            return;
          }

          const tokenResult = event.detail.tokenResult;

          if (tokenResult.status === "OK" && tokenResult.token) {
            /*
             * Do not log or display
             * the Square payment token.
             *
             * Send it directly to
             * our server.
             */
            void sendTokenToServer(tokenResult.token);

            return;
          }

          if (!disposed) {
            setSubmitting(false);

            setMessage("Bank authorization was not completed.");
          }
        });

        if (!disposed) {
          achRef.current = achInstance;

          setReady(true);
        }
      } catch (error) {
        console.error("Square ACH initialization failed:", error);

        if (!disposed) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to initialize ACH payments.",
          );
        }
      }
    }

    void initialize();

    return () => {
      disposed = true;

      achRef.current = null;

      if (achInstance) {
        void achInstance.destroy();
      }
    };
  }, [orderNumber]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (paymentAccepted) {
      return;
    }

    setMessage(null);

    const name = accountHolderName.trim();

    if (!name) {
      setMessage("Enter the bank account holder's name.");

      return;
    }

    if (!achRef.current) {
      setMessage("ACH payment system is not ready.");

      return;
    }

    try {
      setSubmitting(true);

      setMessage("Opening bank authorization...");

      await achRef.current.tokenize({
        accountHolderName: name,

        intent: "CHARGE",

        amount,

        currency: "USD",
      });
    } catch (error) {
      console.error("Unable to start ACH authorization:", error);

      setSubmitting(false);

      setMessage("Unable to start bank authorization.");
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
        ACH Direct Debit
      </h3>

      <p className="mt-2 text-sm text-zinc-500">
        Securely connect your bank account through Square.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="ach-account-holder"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Account holder name
          </label>

          <input
            id="ach-account-holder"
            name="accountHolderName"
            type="text"
            autoComplete="name"
            value={accountHolderName}
            onChange={(event) => setAccountHolderName(event.target.value)}
            disabled={submitting || paymentAccepted}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={!ready || submitting || paymentAccepted}
          className="w-full rounded-lg bg-zinc-950 px-5 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {paymentAccepted
            ? "ACH Payment Submitted"
            : submitting
              ? "Processing..."
              : "Pay with Bank Account"}
        </button>
      </form>

      {message && (
        <p
          role="status"
          className="mt-4 text-sm text-zinc-600 dark:text-zinc-400"
        >
          {message}
        </p>
      )}
    </section>
  );
}
