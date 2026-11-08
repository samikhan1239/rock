"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Loader2,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  IndianRupee,
  Settings2,
  GraduationCap,
  Users,
  CreditCard,
  Percent,
  Wallet,
  Check,
  Star,
  ChevronRight,
  Info,
  CircleDollarSign,
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function PricingField({
  label,
  value,
  onChange,
  description,
  disabled,
  min = 0,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  disabled?: boolean;
  min?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700">
        {label}
      </Label>

      <div className="relative">
        <Input
          type="number"
          min={min}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`h-10 rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-800 shadow-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 ${
            suffix ? "pr-12" : ""
          }`}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] leading-5 text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default function SuperAdminPricingPage() {
  const [settings, setSettings] = useState<PricingSettings>(
    createDefaultSettings
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);

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

      toast.success("Pricing settings loaded");
    } catch (error) {
      console.error("Pricing settings fetch error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load pricing settings."
      );
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

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
      creditPacks: prev.creditPacks.map((pack) =>
        pack.id === id
          ? {
              ...pack,
              [field]: value,
            }
          : pack
      ),
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

    toast.success("New credit pack added");
  };

  const removePack = (id: string) => {
    if (settings.creditPacks.length <= 1) {
      toast.error("At least one credit pack is required.");
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

    toast.success("Credit pack removed");
  };

  const validateSettings = () => {
    if (!settings.creditPacks.length) {
      toast.error("Add at least one credit pack.");
      return false;
    }

    for (const pack of settings.creditPacks) {
      if (!pack.label.trim()) {
        toast.error("Every credit pack must have a name.");
        return false;
      }

      if (
        pack.credits.trim() === "" ||
        !Number.isFinite(Number(pack.credits)) ||
        toNum(pack.credits) < 1
      ) {
        toast.error(
          `Enter valid credits for the ${pack.label || "unnamed"} pack.`
        );
        return false;
      }

      if (
        pack.amount.trim() === "" ||
        !Number.isFinite(Number(pack.amount)) ||
        toNum(pack.amount) < 1
      ) {
        toast.error(
          `Enter a valid price for the ${pack.label || "unnamed"} pack.`
        );
        return false;
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

    if (
      numericFields.some(
        (value) =>
          value.trim() === "" || !Number.isFinite(Number(value))
      )
    ) {
      toast.error("Please enter valid numbers in all pricing fields.");
      return false;
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
      toast.error(
        "Check your pricing values. Commission must be between 0 and 100."
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) return;

    const confirmed = window.confirm(
      "Publish these pricing changes?\n\nUpdated prices and credit packs may affect all platform users."
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
        throw new Error(
          data.error || "Failed to save pricing settings."
        );
      }

      toast.success("Platform pricing updated successfully.");
    } catch (error) {
      console.error("Pricing save error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving pricing."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalPacks = settings.creditPacks.length;

  const popularPack = settings.creditPacks.find(
    (pack) => pack.popular
  );

  if (loading && !hasLoaded) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">
            Loading pricing configuration
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Retrieving platform settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-10">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Settings2 className="h-4 w-4" />
            Super Admin / Configuration
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pricing & Monetization
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Control platform fees, subscriptions, credits and revenue
            settings.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchSettings()}
          disabled={loading || saving}
          className="h-9 gap-2 border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh settings
        </Button>
      </div>

      {/* SUMMARY OVERVIEW */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Teacher registration
            </span>
            <GraduationCap className="h-4 w-4 text-indigo-500" />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-900">
            {formatCurrency(
              toNum(settings.teacherRegistrationFee)
            )}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            One-time fee
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Client registration
            </span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-900">
            {formatCurrency(
              toNum(settings.clientRegistrationFee)
            )}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            One-time fee
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Credit packages
            </span>
            <Wallet className="h-4 w-4 text-violet-500" />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-900">
            {totalPacks}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Active configured packages
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Platform commission
            </span>
            <Percent className="h-4 w-4 text-emerald-600" />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-900">
            {settings.platformCommissionPercent}%
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Current commission rate
          </p>
        </div>
      </div>

      {/* REGISTRATION FEES */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <SectionHeading
            number="01"
            title="Registration fees"
            description="Configure one-time registration charges for each account type."
          />
          <GraduationCap className="hidden h-5 w-5 text-slate-300 sm:block" />
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <PricingField
            label="Teacher registration fee"
            value={settings.teacherRegistrationFee}
            onChange={(value) =>
              handleChange("teacherRegistrationFee", value)
            }
            description="One-time payment required for teacher registration. Set 0 for free registration."
            disabled={saving}
          />

          <PricingField
            label="Client registration fee"
            value={settings.clientRegistrationFee}
            onChange={(value) =>
              handleChange("clientRegistrationFee", value)
            }
            description="One-time payment required for client registration. Set 0 for free registration."
            disabled={saving}
          />
        </div>
      </section>

      {/* CREDIT PACKAGES */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <SectionHeading
            number="02"
            title="Credit packages"
            description="Create and manage the credit packages users can purchase."
          />

          <Button
            type="button"
            onClick={addPack}
            disabled={saving}
            size="sm"
            className="h-9 gap-1.5 bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add package
          </Button>
        </div>

        <div className="p-5">
          {/* Package info */}
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <p className="text-xs leading-5 text-indigo-800">
              Set the credit quantity and purchase price for each package.
              The Popular badge highlights a package in the user-facing
              purchase interface.
            </p>
          </div>

          <div className="space-y-3">
            {settings.creditPacks.map((pack, index) => {
              const credits = toNum(pack.credits);
              const amount = toNum(pack.amount);

              const perCredit =
                credits > 0 ? amount / credits : 0;

              return (
                <div
                  key={pack.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    pack.popular
                      ? "border-indigo-200 bg-indigo-50/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Pack header */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {pack.label || `Package ${index + 1}`}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          Credit package
                        </p>
                      </div>

                      {pack.popular && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">
                          <Star className="h-3 w-3 fill-current" />
                          POPULAR
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePack(pack.id)}
                      disabled={
                        saving || settings.creditPacks.length <= 1
                      }
                      className="h-8 gap-1.5 px-2 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </div>

                  {/* Pack fields */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">
                        Package name
                      </Label>

                      <Input
                        value={pack.label}
                        onChange={(e) =>
                          updatePack(
                            pack.id,
                            "label",
                            e.target.value
                          )
                        }
                        placeholder="Starter"
                        disabled={saving}
                        className="h-10 border-slate-200 bg-white text-sm shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">
                        Number of credits
                      </Label>

                      <Input
                        type="number"
                        min={1}
                        value={pack.credits}
                        onChange={(e) =>
                          updatePack(
                            pack.id,
                            "credits",
                            e.target.value
                          )
                        }
                        placeholder="15"
                        disabled={saving}
                        className="h-10 border-slate-200 bg-white text-sm shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">
                        Package price
                      </Label>

                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                        <Input
                          type="number"
                          min={1}
                          value={pack.amount}
                          onChange={(e) =>
                            updatePack(
                              pack.id,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="249"
                          disabled={saving}
                          className="h-10 border-slate-200 bg-white pl-8 text-sm shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Package footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        updatePack(
                          pack.id,
                          "popular",
                          !pack.popular
                        )
                      }
                      disabled={saving}
                      aria-pressed={Boolean(pack.popular)}
                      className={`inline-flex items-center gap-2 text-xs font-medium transition-colors ${
                        pack.popular
                          ? "text-indigo-700"
                          : "text-slate-500 hover:text-indigo-600"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          pack.popular
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {pack.popular && (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                      Mark as popular package
                    </button>

                    <div className="text-xs text-slate-500">
                      Price per credit:{" "}
                      <span className="font-bold text-slate-800">
                        {formatCurrency(perCredit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Package summary */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Package configuration
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {totalPacks} packages configured
                {popularPack
                  ? ` · ${popularPack.label} marked as popular`
                  : " · No popular package selected"}
              </p>
            </div>

            <span className="text-xs font-semibold text-indigo-600">
              {settings.creditPacks.reduce(
                (sum, pack) => sum + toNum(pack.credits),
                0
              )}{" "}
              total package credits
            </span>
          </div>
        </div>
      </section>

      {/* CREDIT & SUBSCRIPTION SETTINGS */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeading
            number="03"
            title="Credits & subscriptions"
            description="Manage connection request credit consumption and monthly membership prices."
          />
        </div>

        <div className="grid gap-x-8 gap-y-6 p-5 md:grid-cols-2">
          <PricingField
            label="Credits per connection request"
            value={settings.connectionCreditPrice}
            onChange={(value) =>
              handleChange("connectionCreditPrice", value)
            }
            description="Credits consumed when a user submits a connection request."
            min={1}
            disabled={saving}
          />

          <PricingField
            label="Free credits on signup"
            value={settings.freeCreditsOnSignup}
            onChange={(value) =>
              handleChange("freeCreditsOnSignup", value)
            }
            description="Initial free credits granted to newly registered users."
            disabled={saving}
          />

          <PricingField
            label="Teacher monthly subscription"
            value={settings.teacherSubscriptionMonthly}
            onChange={(value) =>
              handleChange("teacherSubscriptionMonthly", value)
            }
            description="Monthly subscription price for teachers."
            disabled={saving}
          />

          <PricingField
            label="Client monthly subscription"
            value={settings.clientSubscriptionMonthly}
            onChange={(value) =>
              handleChange("clientSubscriptionMonthly", value)
            }
            description="Monthly subscription price for clients."
            disabled={saving}
          />
        </div>
      </section>

      {/* PLATFORM COMMISSION */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHeading
            number="04"
            title="Platform commission"
            description="Configure the percentage retained by TutorSathi on applicable transactions."
          />
        </div>

        <div className="p-5">
          <div className="max-w-md">
            <PricingField
              label="Commission percentage"
              value={settings.platformCommissionPercent}
              onChange={(value) =>
                handleChange(
                  "platformCommissionPercent",
                  value
                )
              }
              suffix="%"
              description="Enter a value between 0 and 100."
              disabled={saving}
            />

            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">
                <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <p className="text-xs font-semibold text-blue-900">
                    Commission preview
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    For every ₹1,000 of applicable transaction value,
                    TutorSathi retains{" "}
                    <strong>
                      {formatCurrency(
                        1000 *
                          (toNum(
                            settings.platformCommissionPercent
                          ) /
                            100)
                      )}
                    </strong>{" "}
                    at the current commission rate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAVE SETTINGS */}
      <div className="sticky bottom-0 z-20 -mx-2 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Ready to publish your pricing?
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Changes will apply after successfully saving the configuration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchSettings()}
              disabled={saving || loading}
              className="h-10 border-slate-200 text-xs font-semibold"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Reset from server
            </Button>

            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="h-10 gap-2 bg-indigo-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save & Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}