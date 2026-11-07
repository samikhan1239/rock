"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Gift,
  LockKeyhole,
  ShieldCheck,
  Loader2,
  Receipt,
  Wallet,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: unknown) => void) => void;
    };
  }
}

interface Props {
  feeAmount: number;
  isPaid: boolean;
  onPaymentSuccess: () => void;
}

interface PaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });

      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });

      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function StepRegistrationFee({
  feeAmount,
  isPaid,
  onPaymentSuccess,
}: Props) {
  const [paying, setPaying] = useState(false);

  const isFree = feeAmount <= 0;

  const formattedAmount = feeAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  const handlePay = async () => {
    if (isFree || isPaid || paying) return;

    setPaying(true);

    const loadingToast = toast.loading("Preparing secure checkout...");

    try {
      // Load Razorpay
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load the payment gateway. Please try again."
        );
      }

      // Create payment order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: feeAmount,
          purpose: "teacher_registration",
          credits: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to create payment order.");
      }

      if (!data.orderId || !data.key || !data.amount) {
        throw new Error("Invalid payment order received. Please try again.");
      }

      toast.dismiss(loadingToast);

      // Razorpay configuration
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency || "INR",

        name: "TutorSathi",
        description: "Teacher Registration Fee",

        order_id: data.orderId,

        handler: async (response: PaymentResponse) => {
          const verifyToast = toast.loading("Verifying your payment...");

          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...response,
                purpose: "teacher_registration",
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed."
              );
            }

            toast.success("Payment successful! Registration fee paid.", {
              id: verifyToast,
              duration: 4000,
            });

            onPaymentSuccess();
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support.",
              { id: verifyToast }
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.error("Payment was cancelled.");
          },
        },

        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: unknown) => {
        const paymentError = response as {
          error?: {
            description?: string;
          };
        };

        toast.error(
          paymentError.error?.description || "Payment failed. Please try again."
        );

        setPaying(false);
      });

      razorpay.open();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
        { id: loadingToast }
      );

      setPaying(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Receipt className="h-4.5 w-4.5 text-indigo-600" />
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  Registration fee
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                {isPaid
                  ? "Payment completed"
                  : isFree
                    ? "No payment required"
                    : "Complete your payment"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isPaid
                  ? "Your registration payment has been received."
                  : isFree
                    ? "Your registration is free. You can continue without payment."
                    : "Pay the registration fee to proceed with your teacher application."}
              </p>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isPaid || isFree
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isPaid || isFree ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}

              {isPaid ? "Paid" : isFree ? "Free" : "Pending"}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-5 p-5 sm:p-7">
          {/* Amount summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {isFree ? "Registration amount" : "Amount payable"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  One-time registration charge
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  ₹{formattedAmount}
                </p>

                <p className="text-xs text-slate-500">
                  {isFree ? "No charges" : "INR"}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Registration fee</span>
                <span className="font-medium text-slate-800">
                  ₹{formattedAmount}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">
                  Total amount
                </span>

                <span className="font-bold text-slate-900">
                  ₹{formattedAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Paid state */}
          {isPaid && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Payment successfully received
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Your registration fee is paid. You can continue to the final
                  review of your teacher profile.
                </p>
              </div>
            </div>
          )}

          {/* Free state */}
          {isFree && !isPaid && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Gift className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  You&apos;re eligible for free registration
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  No payment details are required. Continue to the final review
                  to submit your application.
                </p>
              </div>
            </div>
          )}

          {/* Pending payment */}
          {!isFree && !isPaid && (
            <>
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800">
                  Payment method
                </p>

                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Wallet className="h-5 w-5 text-indigo-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Online payment
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        UPI, credit/debit cards and net banking
                      </p>
                    </div>

                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Security information */}
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600" />

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Secure payment processing
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your payment is processed securely through Razorpay.
                    TutorSathi does not store your card or UPI credentials.
                  </p>
                </div>
              </div>

              {/* Pay button */}
              <Button
                size="lg"
                onClick={handlePay}
                disabled={paying}
                className="h-12 w-full gap-2 rounded-lg bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4" />
                    Pay ₹{formattedAmount}
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {/* Footer information */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Secure checkout
            </span>

            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              {isFree ? "No payment needed" : "Powered by Razorpay"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}