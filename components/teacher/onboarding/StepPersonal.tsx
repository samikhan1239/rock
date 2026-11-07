"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  User,
  MapPin,
  Phone,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ========================================
// TYPES
// ========================================

export interface PersonalData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  address: string;
}

interface Props {
  data: PersonalData;
  onChange: (data: PersonalData) => void;

  // Allows the parent onboarding page to display
  // validation errors after the user clicks Continue.
  showValidationErrors?: boolean;
}

// ========================================
// VALIDATION
// ========================================

type FieldErrors = Partial<
  Record<keyof PersonalData, string>
>;

const validateField = (
  field: keyof PersonalData,
  value: string
): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    const labels: Record<keyof PersonalData, string> = {
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone number",
      dateOfBirth: "Date of birth",
      city: "City",
      address: "Full address",
    };

    return `${labels[field]} is required.`;
  }

  if (field === "firstName" || field === "lastName") {
    if (trimmedValue.length < 2) {
      return "Please enter at least 2 characters.";
    }

    if (!/^[\p{L}\p{M}\s.'-]+$/u.test(trimmedValue)) {
      return "Please enter a valid name.";
    }
  }

  if (field === "phone") {
    const digits = trimmedValue.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      return "Enter a valid phone number with 10–15 digits.";
    }

    if (!/^[+\d\s()-]+$/.test(trimmedValue)) {
      return "Please enter a valid phone number.";
    }
  }

  if (field === "dateOfBirth") {
    const selectedDate = new Date(`${trimmedValue}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime())) {
      return "Please enter a valid date of birth.";
    }

    if (selectedDate > today) {
      return "Date of birth cannot be in the future.";
    }
  }

  if (field === "city" && trimmedValue.length < 2) {
    return "Please enter a valid city name.";
  }

  if (field === "address" && trimmedValue.length < 10) {
    return "Please enter a more complete address.";
  }

  return "";
};

// ========================================
// COMPONENT
// ========================================

export default function StepPersonal({
  data,
  onChange,
  showValidationErrors = false,
}: Props) {
  const [touched, setTouched] = useState<
    Partial<Record<keyof PersonalData, boolean>>
  >({});

  const fields: {
    key: keyof PersonalData;
    label: string;
  }[] = [
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
    { key: "phone", label: "Phone number" },
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "city", label: "City" },
    { key: "address", label: "Full address" },
  ];

  const errors: FieldErrors = {};

  fields.forEach(({ key }) => {
    const shouldValidate =
      touched[key] || showValidationErrors;

    if (shouldValidate) {
      const error = validateField(key, data[key]);

      if (error) {
        errors[key] = error;
      }
    }
  });

  const handleChange = (
    field: keyof PersonalData,
    value: string
  ) => {
    onChange({
      ...data,
      [field]: value,
    });

    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));
  };

  const handleBlur = (field: keyof PersonalData) => {
    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));
  };

  // ========================================
  // FIELD COMPONENT
  // ========================================

  const renderError = (field: keyof PersonalData) => {
    if (!errors[field]) return null;

    return (
      <p
        id={`${field}-error`}
        className="flex items-center gap-1.5 text-xs font-medium text-red-600"
        role="alert"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {errors[field]}
      </p>
    );
  };

  const inputClass = (field: keyof PersonalData) => {
    const hasError = Boolean(errors[field]);

    return `h-11 rounded-lg bg-white text-sm shadow-none transition-all placeholder:text-slate-400 ${
      hasError
        ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-100"
        : "border-slate-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
    }`;
  };

  const labelClass = "text-sm font-semibold text-slate-700";

  // ========================================
  // UI
  // ========================================

  return (
    <div className="w-full space-y-9">

      {/* SECTION INTRODUCTION */}

      <div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-600" />

          <span className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
            Personal details
          </span>
        </div>

        <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
          Let&apos;s get to know you
        </h3>

        <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
          Enter your personal information accurately. These details
          will help us verify your identity and create your teacher profile.
        </p>
      </div>

      {/* NAME */}

      <section className="space-y-5">

        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Your name
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Enter your name as it appears on your official documents.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* FIRST NAME */}

          <div className="space-y-2">
            <Label htmlFor="firstName" className={labelClass}>
              First name <span className="text-red-500">*</span>
            </Label>

            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={data.firstName}
              onChange={(e) =>
                handleChange("firstName", e.target.value)
              }
              onBlur={() => handleBlur("firstName")}
              placeholder="e.g. Rahul"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName ? "firstName-error" : undefined
              }
              className={inputClass("firstName")}
            />

            {renderError("firstName")}
          </div>

          {/* LAST NAME */}

          <div className="space-y-2">
            <Label htmlFor="lastName" className={labelClass}>
              Last name <span className="text-red-500">*</span>
            </Label>

            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={data.lastName}
              onChange={(e) =>
                handleChange("lastName", e.target.value)
              }
              onBlur={() => handleBlur("lastName")}
              placeholder="e.g. Sharma"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={
                errors.lastName ? "lastName-error" : undefined
              }
              className={inputClass("lastName")}
            />

            {renderError("lastName")}
          </div>
        </div>
      </section>

      {/* CONTACT INFORMATION */}

      <section className="space-y-5 border-t border-slate-100 pt-7">

        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Contact information
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Provide your active contact details.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* PHONE */}

          <div className="space-y-2">
            <Label htmlFor="phone" className={labelClass}>
              Phone number <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={data.phone}
                onChange={(e) =>
                  handleChange("phone", e.target.value)
                }
                onBlur={() => handleBlur("phone")}
                placeholder="+91 98765 43210"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "phone-error" : undefined
                }
                className={`pl-10 ${inputClass("phone")}`}
              />
            </div>

            {renderError("phone")}

            <p className="text-xs text-slate-400">
              Include your country code if applicable.
            </p>
          </div>

          {/* DATE OF BIRTH */}

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className={labelClass}>
              Date of birth <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                autoComplete="bday"
                value={data.dateOfBirth}
                onChange={(e) =>
                  handleChange("dateOfBirth", e.target.value)
                }
                onBlur={() => handleBlur("dateOfBirth")}
                aria-invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={
                  errors.dateOfBirth
                    ? "dateOfBirth-error"
                    : undefined
                }
                className={`pl-10 ${inputClass("dateOfBirth")}`}
              />
            </div>

            {renderError("dateOfBirth")}
          </div>
        </div>
      </section>

      {/* LOCATION */}

      <section className="space-y-5 border-t border-slate-100 pt-7">

        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-indigo-600" />

            <h4 className="text-sm font-bold text-slate-900">
              Location details
            </h4>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Let students know where you are based.
          </p>
        </div>

        {/* CITY */}

        <div className="space-y-2">
          <Label htmlFor="city" className={labelClass}>
            City <span className="text-red-500">*</span>
          </Label>

          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={data.city}
            onChange={(e) =>
              handleChange("city", e.target.value)
            }
            onBlur={() => handleBlur("city")}
            placeholder="e.g. Indore"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={
              errors.city ? "city-error" : undefined
            }
            className={inputClass("city")}
          />

          {renderError("city")}
        </div>

        {/* FULL ADDRESS */}

        <div className="space-y-2">
          <Label htmlFor="address" className={labelClass}>
            Full address <span className="text-red-500">*</span>
          </Label>

          <Textarea
            id="address"
            name="address"
            autoComplete="street-address"
            value={data.address}
            onChange={(e) =>
              handleChange("address", e.target.value)
            }
            onBlur={() => handleBlur("address")}
            placeholder="House / Flat number, Street, Area, Landmark..."
            rows={4}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={
              errors.address ? "address-error" : undefined
            }
            className={`min-h-[110px] resize-y rounded-lg bg-white text-sm shadow-none transition-all placeholder:text-slate-400 ${
              errors.address
                ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-100"
                : "border-slate-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
            }`}
          />

          <div className="flex items-center justify-between gap-3">
            {renderError("address")}

            <span className="ml-auto text-xs text-slate-400">
              {data.address.length}/300
            </span>
          </div>
        </div>
      </section>

      {/* PRIVACY NOTE */}

      <div className="flex items-start gap-3 border-t border-slate-100 pt-6">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <CheckCircle2 className="h-4 w-4 text-indigo-600" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your information stays protected
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Your personal details are used for profile verification
            and relevant registration activities. They are not
            displayed publicly as part of your tutor listing.
          </p>
        </div>
      </div>
    </div>
  );
}