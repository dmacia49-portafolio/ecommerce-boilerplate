"use client";

import { useState } from "react";

import type { PaymentMethod } from "../core/payment.types";

import { SquareAchAuthorization } from "../methods/ach/providers/square/SquareAchAuthorization";

type Props = {
  orderNumber: string;
  amount: string;
};

export function PaymentMethodSelector({ orderNumber, amount }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "">("");

  return (
    <section>
      <h2>Select payment method</h2>

      <fieldset>
        <legend>How would you like to pay?</legend>

        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="ACH"
            checked={selectedMethod === "ACH"}
            onChange={() => setSelectedMethod("ACH")}
          />
          ACH Direct Debit
        </label>

        <br />

        <label>
          <input type="radio" name="paymentMethod" value="CARD" disabled />
          Credit / Debit Card
          {" — "}
          Coming later
        </label>

        <br />

        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="GOOGLE_PAY"
            disabled
          />
          Google Pay
          {" — "}
          Coming later
        </label>

        <br />

        <label>
          <input type="radio" name="paymentMethod" value="APPLE_PAY" disabled />
          Apple Pay
          {" — "}
          Coming later
        </label>

        <br />

        <label>
          <input type="radio" name="paymentMethod" value="PAYPAL" disabled />
          PayPal
          {" — "}
          Coming later
        </label>

        <br />

        <label>
          <input type="radio" name="paymentMethod" value="VENMO" disabled />
          Venmo
          {" — "}
          Coming later
        </label>
      </fieldset>

      {selectedMethod === "ACH" && (
        <SquareAchAuthorization orderNumber={orderNumber} amount={amount} />
      )}

      {!selectedMethod && <p>Select a payment method to continue.</p>}
    </section>
  );
}
