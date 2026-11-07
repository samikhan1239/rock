"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Loader2,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Settings2,
} from "lucide-react";

interface CreditPack {
  id: string;
  credits: string;
  amount: string;
  label: string;
  popular?: boolean;
}

interface PricingSettings {
  teacherRegistrationFee: string;
  clientRegistrationFee: string;
  connectionCreditPrice: string;
  teacherSubscriptionMonthly: string;
  clientSubscriptionMonthly: string;
  freeCreditsOnSignup: string;
  platformCommissionPercent: string;
  creditPacks: CreditPack[];
}

interface ApiCreditPack {
  credits: number;
  amount: number;
  label: string;
  popular?: boolean;
}

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createDefaultSettings = (): PricingSettings => ({
  teacherRegistrationFee: "0",
  clientRegistrationFee: "0",
  connectionCreditPrice: "1",
  teacherSubscriptionMonthly: "299",
  clientSubscriptionMonthly: "199",
  freeCreditsOnSignup: "5",
  platformCommissionPercent: "10",
  creditPacks: [
    {
      id: makeId(),
      credits: "5",
      amount: "99",
      label: "Starter",
      popular: false,
    },
    {
      id: makeId(),
      credits: "15",
      amount: "249",
      label: "Popular",
      popular: true,
    },
    {
      id: makeId(),
      credits: "40",
      amount: "599",
      label: "Pro",
      popular: false,
    },
  ],
});

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function SuperAdminPricingPage() {
  const [settings, setSettings] = useState<PricingSettings>(
    createDefaultSettings
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Fetch pricing settings.
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/super-admin/pricing", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load pricing settings."
        );
      }

      if (data.settings) {
        const s = data.settings;

        setSettings({
          teacherRegistrationFee: String(
            s.teacherRegistrationFee ?? 0
          ),

          clientRegistrationFee: String(
            s.clientRegistrationFee ?? 0
          ),

          connectionCreditPrice: String(
            s.connectionCreditPrice ?? 1
          ),

          teacherSubscriptionMonthly: String(
            s.teacherSubscriptionMonthly ?? 299
          ),

          clientSubscriptionMonthly: String(
            s.clientSubscriptionMonthly ?? 199
          ),

          freeCreditsOnSignup: String(
            s.freeCreditsOnSignup ?? 5
          ),

          platformCommissionPercent: String(
            s.platformCommissionPercent ?? 10
          ),

          creditPacks:
            Array.isArray(s.creditPacks) &&
            s.creditPacks.length > 0
              ? (s.creditPacks as ApiCreditPack[]).map((p) => ({
                  id: makeId(),
                  credits: String(p.credits ?? 0),
                  amount: String(p.amount ?? 0),
                  label: p.label || "",
                  popular: Boolean(p.popular),
                }))
              : createDefaultSettings().creditPacks,
        });
      }
    } catch (error) {
      console.error("Pricing settings fetch error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load pricing settings."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // IMPORTANT: Initial API request happens after mounting,
  // not during component rendering.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSettings();
  }, [fetchSettings]);

  const handleChange = (
    field: keyof Omit<PricingSettings, "creditPacks">,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePack = (
    id: string,
    field: keyof CreditPack,
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      creditPacks: prev.creditPacks.map((pack) => {
        if (pack.id !== id) return pack;

        if (field === "popular") {
          return { ...pack, popular: Boolean(value) };
        }

        if (field === "label") {
          return { ...pack, label: String(value) };
        }

        if (field === "credits") {
          return { ...pack, credits: String(value) };
        }

        if (field === "amount") {
          return { ...pack, amount: String(value) };
        }

        return pack;
      }),
    }));
  };

  const addPack = () => {
    setSettings((prev) => ({
      ...prev,
      creditPacks: [
        ...prev.creditPacks,
        {
          id: makeId(),
          credits: "10",
          amount: "149",
          label: "Custom",
          popular: false,
        },
      ],
    }));

    setMessage("");
  };

  const removePack = (id: string) => {
    if (settings.creditPacks.length <= 1) {
      setMessage("At least one credit pack is required.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this credit pack?"
    );

    if (!confirmed) return;

    setSettings((prev) => ({
      ...prev,
      creditPacks: prev.creditPacks.filter(
        (pack) => pack.id !== id
      ),
    }));

    setMessage("");
  };

  // Save pricing settings.
  const handleSave = async () => {
    setMessage("");

    if (!settings.creditPacks.length) {
      setMessage("Add at least one credit pack.");
      setMessageType("error");
      return;
    }

    for (const pack of settings.creditPacks) {
      if (!pack.label.trim()) {
        setMessage("Every credit pack must have a label.");
        setMessageType("error");
        return;
      }

      if (toNum(pack.credits) < 1) {
        setMessage("Credit pack credits must be greater than 0.");
        setMessageType("error");
        return;
      }

      if (toNum(pack.amount) < 1) {
        setMessage("Credit pack price must be greater than 0.");
        setMessageType("error");
        return;
      }
    }

    const numericFields = [
      settings.teacherRegistrationFee,
      settings.clientRegistrationFee,
      settings.connectionCreditPrice,
      settings.teacherSubscriptionMonthly,
      settings.clientSubscriptionMonthly,
      settings.freeCreditsOnSignup,
      settings.platformCommissionPercent,
    ];

    if (numericFields.some((value) => value.trim() === "" || !Number.isFinite(Number(value)))) {
      setMessage("Please enter valid numbers in all pricing fields.");
      setMessageType("error");
      return;
    }

    if (
      toNum(settings.teacherRegistrationFee) < 0 ||
      toNum(settings.clientRegistrationFee) < 0 ||
      toNum(settings.connectionCreditPrice) < 1 ||
      toNum(settings.teacherSubscriptionMonthly) < 0 ||
      toNum(settings.clientSubscriptionMonthly) < 0 ||
      toNum(settings.freeCreditsOnSignup) < 0 ||
      toNum(settings.platformCommissionPercent) < 0 ||
      toNum(settings.platformCommissionPercent) > 100
    ) {
      setMessage(
        "Check your pricing values. Commission must be between 0 and 100."
      );
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to update platform pricing?\n\nThis will change credit packs, fees and subscription prices for all users."
    );

    if (!confirmed) return;

    const payload = {
      teacherRegistrationFee: toNum(
        settings.teacherRegistrationFee
      ),

      clientRegistrationFee: toNum(
        settings.clientRegistrationFee
      ),

      connectionCreditPrice: toNum(
        settings.connectionCreditPrice
      ),

      teacherSubscriptionMonthly: toNum(
        settings.teacherSubscriptionMonthly
      ),

      clientSubscriptionMonthly: toNum(
        settings.clientSubscriptionMonthly
      ),

      freeCreditsOnSignup: toNum(
        settings.freeCreditsOnSignup
      ),

      platformCommissionPercent: toNum(
        settings.platformCommissionPercent
      ),

      creditPacks: settings.creditPacks.map((pack) => ({
        label: pack.label.trim(),
        credits: toNum(pack.credits),
        amount: toNum(pack.amount),
        popular: Boolean(pack.popular),
      })),
    };

    setSaving(true);

    try {
      const res = await fetch("/api/super-admin/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save pricing settings.");
      }

      setMessage("Pricing and credit packs saved successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Pricing save error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving pricing."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // Initial loading state.
  if (loading && !hasLoaded) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>

        <p className="text-sm font-semibold text-slate-800">
          Loading pricing settings...
        </p>

        <p className="text-xs text-slate-500">
          Fetching your latest platform configuration
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-600" />

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Platform Configuration
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Dynamic Pricing
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage registration fees, subscriptions and Razorpay credit packs.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchSettings()}
          disabled={loading || saving}
          className="border-slate-200 bg-white"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <p>{message}</p>
        </div>
      )}

      {/* Registration Fees */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Registration Fees
          </CardTitle>

          <p className="text-xs text-slate-500">
            Configure the one-time registration charges for platform users.
          </p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Teacher Registration Fee (₹)</Label>

            <Input
              type="number"
              min={0}
              value={settings.teacherRegistrationFee}
              onChange={(e) =>
                handleChange(
                  "teacherRegistrationFee",
                  e.target.value
                )
              }
            />

            <p className="text-xs text-slate-500">
              Set 0 for free teacher registration.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Client Registration Fee (₹)</Label>

            <Input
              type="number"
              min={0}
              value={settings.clientRegistrationFee}
              onChange={(e) =>
                handleChange(
                  "clientRegistrationFee",
                  e.target.value
                )
              }
            />

            <p className="text-xs text-slate-500">
              Set 0 for free client registration.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packs */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Credit Packs
            </CardTitle>

            <p className="mt-1 text-xs text-slate-500">
              Manage the credit packages available for Razorpay purchases.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPack}
            disabled={saving}
            className="shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Pack
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          {settings.creditPacks.map((pack, index) => (
            <div
              key={pack.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                    {index + 1}
                  </span>

                  <p className="text-sm font-semibold text-slate-800">
                    Credit Pack {index + 1}
                  </p>

                  {pack.popular && (
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                      POPULAR
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removePack(pack.id)}
                  disabled={saving || settings.creditPacks.length <= 1}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Pack Name</Label>

                  <Input
                    value={pack.label}
                    onChange={(e) =>
                      updatePack(pack.id, "label", e.target.value)
                    }
                    placeholder="Starter"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Credits</Label>

                  <Input
                    type="number"
                    min={1}
                    value={pack.credits}
                    onChange={(e) =>
                      updatePack(pack.id, "credits", e.target.value)
                    }
                    placeholder="5"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Price (₹)</Label>

                  <Input
                    type="number"
                    min={1}
                    value={pack.amount}
                    onChange={(e) =>
                      updatePack(pack.id, "amount", e.target.value)
                    }
                    placeholder="99"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Popular Badge</Label>

                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={pack.popular ? "yes" : "no"}
                    onChange={(e) =>
                      updatePack(
                        pack.id,
                        "popular",
                        e.target.value === "yes"
                      )
                    }
                    disabled={saving}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  Price per credit
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  ₹
                  {toNum(pack.credits) > 0
                    ? (
                        toNum(pack.amount) /
                        toNum(pack.credits)
                      ).toFixed(2)
                    : "0.00"}{" "}
                  / credit
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Credits & Subscriptions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Credits & Subscriptions
          </CardTitle>

          <p className="text-xs text-slate-500">
            Configure credit consumption and monthly subscription pricing.
          </p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Credits Per Connection Request</Label>

            <Input
              type="number"
              min={1}
              value={settings.connectionCreditPrice}
              onChange={(e) =>
                handleChange(
                  "connectionCreditPrice",
                  e.target.value
                )
              }
              disabled={saving}
            />

            <p className="text-xs text-slate-500">
              Number of credits deducted for each request.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Free Credits on Signup</Label>

            <Input
              type="number"
              min={0}
              value={settings.freeCreditsOnSignup}
              onChange={(e) =>
                handleChange("freeCreditsOnSignup", e.target.value)
              }
              disabled={saving}
            />

            <p className="text-xs text-slate-500">
              Free credits granted to newly registered users.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Teacher Subscription (Monthly ₹)</Label>

            <Input
              type="number"
              min={0}
              value={settings.teacherSubscriptionMonthly}
              onChange={(e) =>
                handleChange(
                  "teacherSubscriptionMonthly",
                  e.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Client Subscription (Monthly ₹)</Label>

            <Input
              type="number"
              min={0}
              value={settings.clientSubscriptionMonthly}
              onChange={(e) =>
                handleChange(
                  "clientSubscriptionMonthly",
                  e.target.value
                )
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Commission */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Platform Commission
          </CardTitle>

          <p className="text-xs text-slate-500">
            Set the commission percentage charged on successful hiring fees.
          </p>
        </CardHeader>

        <CardContent className="p-5">
          <div className="max-w-sm space-y-2">
            <Label>Commission Percentage (%)</Label>

            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.platformCommissionPercent}
                onChange={(e) =>
                  handleChange(
                    "platformCommissionPercent",
                    e.target.value
                  )
                }
                className="pr-10"
                disabled={saving}
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                %
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Must be between 0% and 100%.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Changes will apply to platform pricing after saving.
        </p>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="h-10 gap-2 bg-indigo-600 px-6 text-white hover:bg-indigo-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Pricing
            </>
          )}
        </Button>
      </div>
    </div>
  );
}