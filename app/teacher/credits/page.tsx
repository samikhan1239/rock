"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Loader2,
  CreditCard,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: unknown) => void) => void;
    };
  }
}

type CreditPack = {
  credits: number;
  amount: number;
  label: string;
  popular?: boolean;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/* ---------------- RAZORPAY SCRIPT ---------------- */

let razorpayScriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

/* ---------------- PACKAGE SKELETON ---------------- */

function PackageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="h-4 w-20 rounded bg-slate-100" />
          <div className="mt-5 h-9 w-28 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
          <div className="mt-6 h-20 rounded-lg bg-slate-100" />

          <div className="mt-6 space-y-3">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>

          <div className="mt-6 h-10 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function BuyCreditsPage() {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadingPack, setLoadingPack] = useState<number | null>(null);

  /* ---------------- FETCH PACKAGES ---------------- */

  // This function only fetches data.
  // It does not update React state.
  const fetchPacks = useCallback(async (): Promise<CreditPack[]> => {
    const res = await fetch("/api/credits/packs", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to load credit packages.");
    }

    if (!Array.isArray(data.packs)) {
      throw new Error("Invalid credit package response.");
    }

    return data.packs as CreditPack[];
  }, []);

  /* ---------------- INITIAL FETCH ---------------- */

  useEffect(() => {
    let cancelled = false;

    const loadInitialPacks = async () => {
      try {
        const result = await fetchPacks();

        if (cancelled) return;

        setPacks(result);
        setLoadFailed(false);
      } catch (error) {
        if (cancelled) return;

        setPacks([]);
        setLoadFailed(true);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load credit packages."
        );
      } finally {
        if (!cancelled) {
          setPacksLoading(false);
        }
      }
    };

    void loadInitialPacks();

    return () => {
      cancelled = true;
    };
  }, [fetchPacks]);

  /* ---------------- MANUAL REFRESH ---------------- */

  const handleRefresh = async () => {
    if (refreshing || packsLoading) return;

    setRefreshing(true);

    try {
      const result = await fetchPacks();

      setPacks(result);
      setLoadFailed(false);

      toast.success("Credit packages refreshed.");
    } catch (error) {
      setLoadFailed(true);
      setPacks([]);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to refresh credit packages."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------------- BUY CREDITS ---------------- */

  const buyPack = async (credits: number, amount: number) => {
    if (loadingPack !== null) return;

    setLoadingPack(credits);

    const loadingToast = toast.loading("Preparing secure checkout...");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection."
        );
      }

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credits,
          amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not create payment order.");
      }

      if (!data.orderId || !data.key) {
        throw new Error("Invalid payment order response.");
      }

      toast.dismiss(loadingToast);

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "TutorSathi",
        description: `${credits} connection request credits`,
        order_id: data.orderId,

        handler: async (response: RazorpayResponse) => {
          const verifyToast = toast.loading("Verifying your payment...");

          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed."
              );
            }

            toast.success(
              verifyData.message ||
                `${credits} credits added successfully!`,
              { id: verifyToast }
            );
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support.",
              { id: verifyToast }
            );
          } finally {
            setLoadingPack(null);
          }
        },

        modal: {
          ondismiss: () => {
            setLoadingPack(null);
            toast.error("Payment was cancelled.");
          },
        },

        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: unknown) => {
        const failure = response as {
          error?: {
            description?: string;
          };
        };

        setLoadingPack(null);

        toast.error(
          failure.error?.description || "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
        { id: loadingToast }
      );

      setLoadingPack(null);
    }
  };

  /* ---------------- HELPERS ---------------- */

  const getPricePerCredit = (pack: CreditPack) => {
    if (!pack.credits || pack.credits <= 0) return "0.00";

    return (pack.amount / pack.credits).toFixed(2);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-10">

      {/* HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50">
            <Wallet className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Buy Credits
            </h1>

            <p className="text-sm text-slate-500">
              Purchase credits to connect with students.
            </p>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />

          <span className="text-xs font-medium text-emerald-700">
            Secure payments
          </span>
        </div>
      </div>

      {/* CREDIT INFORMATION */}

      <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              How credits work
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              1 credit = 1 connection request. Requests are sent to
              the admin for review.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-indigo-100 bg-white px-4 py-2 text-center">
          <p className="text-lg font-bold text-indigo-700">1 : 1</p>

          <p className="text-[10px] font-medium text-slate-500">
            Credit to request
          </p>
        </div>
      </div>

      {/* PACKAGE HEADING */}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Choose a credit package
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Select a package that suits your needs.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={packsLoading || refreshing}
          className="gap-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* INITIAL LOADING */}

      {packsLoading && <PackageSkeleton />}

      {/* FAILED LOADING */}

      {!packsLoading && loadFailed && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>

          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Unable to load packages
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Please check your connection and try again.
          </p>

          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Try again
          </Button>
        </div>
      )}

      {/* EMPTY PACKAGES */}

      {!packsLoading && !loadFailed && packs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-slate-300" />

          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            No packages available
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Credit packages are currently unavailable. Please check
            again later.
          </p>
        </div>
      )}

      {/* CREDIT PACKAGES */}

      {!packsLoading && !loadFailed && packs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <Card
              key={`${pack.label}-${pack.credits}-${pack.amount}`}
              className={`relative overflow-hidden rounded-xl bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                pack.popular
                  ? "border-indigo-300 shadow-sm ring-1 ring-indigo-100"
                  : "border-slate-200"
              }`}
            >
              {pack.popular && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-semibold text-white">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    POPULAR
                  </span>
                </div>
              )}

              <CardContent className="space-y-5 p-5">

                {/* PRICE */}

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {pack.label}
                  </p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      ₹{pack.amount}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    ₹{getPricePerCredit(pack)} per credit
                  </p>
                </div>

                {/* CREDITS */}

                <div
                  className={`rounded-lg border p-3 ${
                    pack.popular
                      ? "border-indigo-100 bg-indigo-50/70"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {pack.credits}
                      </p>

                      <p className="text-xs text-slate-500">
                        Available credits
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                </div>

                {/* BENEFITS */}

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    {pack.credits} connection requests
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    Credit addition after verification
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    Secure online payment
                  </div>
                </div>

                {/* BUY BUTTON */}

                <Button
                  className={`h-10 w-full gap-2 rounded-lg font-semibold transition-all duration-200 ${
                    pack.popular
                      ? "border border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:shadow-md"
                      : "border border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                  onClick={() => buyPack(pack.credits, pack.amount)}
                  disabled={loadingPack !== null}
                >
                  {loadingPack === pack.credits ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy credits
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PAYMENT INFORMATION */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Secure payment processing
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Payments are processed securely through Razorpay.
              Credits are added after successful payment verification.
              Connection requests remain subject to admin approval.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Need help with a payment? Contact TutorSathi support.
      </p>
    </div>
  );
}