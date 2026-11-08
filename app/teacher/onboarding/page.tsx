"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  GraduationCap,
  User,
  GraduationCap as EducationIcon,
  BookOpen,
  Video,
  Brain,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";

import { toast } from "sonner";

import StepPersonal, {
  PersonalData,
} from "@/components/teacher/onboarding/StepPersonal";

import StepEducation, {
  EducationData,
} from "@/components/teacher/onboarding/StepEducation";

import StepSubjects, {
  SubjectItem,
  TeachingInfo,
} from "@/components/teacher/onboarding/StepSubjects";

import StepVideos, {
  VideosData,
  FileField,
  MediaUploadStatus,
  MediaUploadingState,
  MediaUploadProgress,
  MediaUploadErrors,
} from "@/components/teacher/onboarding/StepVideos";

import StepAIInterview from "@/components/teacher/onboarding/StepAIInterview";

import StepRegistrationFee from "@/components/teacher/onboarding/StepRegistrationFee";

import StepReview from "@/components/teacher/onboarding/StepReview";

import { uploadTeacherAsset } from "@/lib/cloudinary-upload";

// ========================================
// CONSTANTS
// ========================================

const STORAGE_KEY = "teacher-onboarding-data";
const STEP4_KEY = "teacher-onboarding-step4-completed";
const INTERVIEW_KEY = "teacher-ai-interview-completed";

const steps = [
  {
    id: 1,
    title: "Personal Information",
    description: "Enter your personal and contact information.",
    icon: User,
    shortTitle: "Personal",
  },
  {
    id: 2,
    title: "Education Details",
    description: "Tell us about your academic background.",
    icon: EducationIcon,
    shortTitle: "Education",
  },
  {
    id: 3,
    title: "Teaching Subjects",
    description: "Add the subjects and classes you can teach.",
    icon: BookOpen,
    shortTitle: "Subjects",
  },
  {
    id: 4,
    title: "Teaching Videos",
    description: "Upload videos to demonstrate your teaching skills.",
    icon: Video,
    shortTitle: "Videos",
  },
  {
    id: 5,
    title: "AI Interview",
    description: "Complete your teaching assessment.",
    icon: Brain,
    shortTitle: "Interview",
  },
  {
    id: 6,
    title: "Registration Fee",
    description: "Complete your registration payment.",
    icon: CreditCard,
    shortTitle: "Payment",
  },
  {
    id: 7,
    title: "Review & Submit",
    description: "Review your details before submitting your profile.",
    icon: CheckCircle2,
    shortTitle: "Review",
  },
];

// ========================================
// TYPES
// ========================================

type SavedFormData = {
  personal: PersonalData;
  education: EducationData;
  subjects: SubjectItem[];
  teachingInfo: TeachingInfo;
  isFeePaid: boolean;
};

type SaveStatus = "saved" | "saving" | "error";

type PricingSettings = {
  teacherRegistrationFee: number;
  clientRegistrationFee: number;
  freeCreditsOnSignup: number;
  connectionCreditPrice: number;
  creditPacks: unknown[];
};

// ========================================
// INITIAL DATA
// ========================================

const initialPersonal: PersonalData = {
  firstName: "",
  lastName: "",
  phone: "",
  dateOfBirth: "",
  city: "",
  address: "",
};

const initialEducation: EducationData = {
  college: "",
  degree: "",
  currentYear: "",
  branch: "",
  qualifications: "",
};

const initialTeachingInfo: TeachingInfo = {
  experienceYears: "",
  preferredMode: "",
  availability: "",
  expectedSalary: "",
  preferredLocation: "",
  languages: "",
};

// ========================================
// PRICING VALIDATION
// ========================================

function parsePricingSettings(
  value: unknown
): PricingSettings {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("Invalid pricing response.");
  }

  const settings = value as Record<string, unknown>;

  const fields = [
    "teacherRegistrationFee",
    "clientRegistrationFee",
    "freeCreditsOnSignup",
    "connectionCreditPrice",
  ] as const;

  const parsed: Record<string, number> = {};

  for (const field of fields) {
    const numberValue = Number(settings[field]);

    if (
      settings[field] === undefined ||
      settings[field] === null ||
      !Number.isFinite(numberValue) ||
      numberValue < 0
    ) {
      throw new Error(
        `Invalid pricing configuration: ${field}.`
      );
    }

    parsed[field] = numberValue;
  }

  if (!Array.isArray(settings.creditPacks)) {
    throw new Error("Invalid credit pack configuration.");
  }

  return {
    teacherRegistrationFee:
      parsed.teacherRegistrationFee,
    clientRegistrationFee:
      parsed.clientRegistrationFee,
    freeCreditsOnSignup:
      parsed.freeCreditsOnSignup,
    connectionCreditPrice:
      parsed.connectionCreditPrice,
    creditPacks: settings.creditPacks,
  };
}

// ========================================
// COMPACT REGISTRATION PROGRESS
// ========================================

type RegistrationProgressProps = {
  currentStep: number;
  totalSteps: number;
};

function RegistrationProgress({
  currentStep,
  totalSteps,
}: RegistrationProgressProps) {
  const progress = Math.round(
    (currentStep / totalSteps) * 100
  );

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-3 sm:px-8">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="shrink-0 font-semibold text-slate-900">
              Step {currentStep} of {totalSteps}
            </span>

            <span className="text-slate-300">/</span>

            <span className="truncate text-slate-500">
              {steps[currentStep - 1]?.title}
            </span>
          </div>

          <span className="shrink-0 text-xs font-semibold text-indigo-600">
            {progress}% complete
          </span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Registration progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-1">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div
                key={step.id}
                className="flex items-center gap-1.5"
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    isCompleted
                      ? "bg-indigo-600 text-white"
                      : isActive
                        ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.id
                  )}
                </span>

                <span
                  className={`hidden text-[10px] font-medium lg:block ${
                    isActive
                      ? "text-indigo-700"
                      : isCompleted
                        ? "text-slate-600"
                        : "text-slate-400"
                  }`}
                >
                  {step.shortTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function TeacherOnboardingPage() {
  const router = useRouter();

  // --------------------------------------
  // GENERAL STATE
  // --------------------------------------

  const [currentStep, setCurrentStep] = useState(1);

  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [saveStatus, setSaveStatus] =
    useState<SaveStatus>("saved");

  const [submitError, setSubmitError] = useState("");

  const [validationErrors, setValidationErrors] =
    useState<string[]>([]);

  const [paymentMessage, setPaymentMessage] = useState("");

  // --------------------------------------
  // CLOUDINARY UPLOAD STATE
  // --------------------------------------

  const [uploading, setUploading] =
    useState<MediaUploadingState>({});

  const [uploadProgress, setUploadProgress] =
    useState<MediaUploadProgress>({});

  const [uploadErrors, setUploadErrors] =
    useState<MediaUploadErrors>({});

  const [mediaUploadStatus, setMediaUploadStatus] =
    useState<MediaUploadStatus>({
      profileImage: false,
      introduction: false,
      demo: false,
    });

  const uploadIdsRef = useRef<Record<FileField, number>>({
    profileImage: 0,
    introduction: 0,
    demo: 0,
  });

  // --------------------------------------
  // FORM STATE
  // --------------------------------------

  const [personal, setPersonal] =
    useState<PersonalData>(initialPersonal);

  const [education, setEducation] =
    useState<EducationData>(initialEducation);

  const [subjects, setSubjects] = useState<SubjectItem[]>([
    {
      subject: "",
      classes: "",
    },
  ]);

  const [teachingInfo, setTeachingInfo] =
    useState<TeachingInfo>(initialTeachingInfo);

  const [videos, setVideos] = useState<VideosData>({
    introduction: null,
    demo: null,
    profileImage: null,
  });

  // --------------------------------------
  // REGISTRATION / PRICING STATE
  // --------------------------------------

  const [registrationFee, setRegistrationFee] =
    useState<number | null>(null);

  const [pricingSettings, setPricingSettings] =
    useState<PricingSettings | null>(null);

  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState("");

  const [isFeePaid, setIsFeePaid] = useState(false);

  const [interviewCompleted, setInterviewCompleted] =
    useState(false);

  const [step4Completed, setStep4Completed] =
    useState(false);

  const CurrentIcon = steps[currentStep - 1].icon;

  // ========================================
  // HELPERS
  // ========================================

  const isFilled = (value: unknown) =>
    typeof value === "string" && value.trim().length > 0;

  const clearMessages = () => {
    setValidationErrors([]);
    setSubmitError("");
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const showErrors = (errors: string[]) => {
    setValidationErrors(errors);

    window.setTimeout(() => {
      document
        .getElementById("validation-errors")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  };

  // ========================================
  // LOAD PRICING FROM BACKEND
  // ========================================

  const loadPricing = useCallback(async () => {
    setFeeLoading(true);
    setFeeError("");

    try {
      const response = await fetch("/api/pricing", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          "Unable to fetch pricing from platform settings."
        );
      }

      if (
        !data ||
        typeof data !== "object" ||
        !("settings" in data)
      ) {
        throw new Error("Invalid pricing API response.");
      }

      const settings = parsePricingSettings(
        (data as { settings: unknown }).settings
      );

      setPricingSettings(settings);
      setRegistrationFee(
        settings.teacherRegistrationFee
      );

      // Only free registration is automatically considered paid.
      if (settings.teacherRegistrationFee === 0) {
        setIsFeePaid(true);
      }

    } catch (error) {
      console.error("Pricing loading error:", error);

      setPricingSettings(null);
      setRegistrationFee(null);

      setFeeError(
        error instanceof Error
          ? error.message
          : "Unable to load registration pricing. Please try again."
      );

    } finally {
      setFeeLoading(false);
    }
  }, []);

  // ========================================
  // CLOUDINARY UPLOAD
  // ========================================

  const uploadMedia = useCallback(
    async (field: FileField, file: File) => {
      const requestId = ++uploadIdsRef.current[field];

      setMediaUploadStatus((prev) => ({
        ...prev,
        [field]: false,
      }));

      setUploading((prev) => ({
        ...prev,
        [field]: true,
      }));

      setUploadProgress((prev) => ({
        ...prev,
        [field]: 0,
      }));

      setUploadErrors((prev) => ({
        ...prev,
        [field]: "",
      }));

      try {
        await uploadTeacherAsset({
          file,
          assetType: field,

          onProgress: (percentage) => {
            if (
              uploadIdsRef.current[field] !== requestId
            ) {
              return;
            }

            setUploadProgress((prev) => ({
              ...prev,
              [field]: percentage,
            }));
          },
        });

        if (
          uploadIdsRef.current[field] !== requestId
        ) {
          return;
        }

        setMediaUploadStatus((prev) => ({
          ...prev,
          [field]: true,
        }));

        setUploading((prev) => ({
          ...prev,
          [field]: false,
        }));

        setUploadProgress((prev) => ({
          ...prev,
          [field]: 100,
        }));

        setUploadErrors((prev) => ({
          ...prev,
          [field]: "",
        }));

        const labels: Record<FileField, string> = {
          profileImage: "Profile photo",
          introduction: "Introduction video",
          demo: "Demo teaching video",
        };

        toast.success(
          `${labels[field]} uploaded successfully!`
        );

      } catch (error) {
        if (
          uploadIdsRef.current[field] !== requestId
        ) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong during upload.";

        setMediaUploadStatus((prev) => ({
          ...prev,
          [field]: false,
        }));

        setUploading((prev) => ({
          ...prev,
          [field]: false,
        }));

        setUploadErrors((prev) => ({
          ...prev,
          [field]: message,
        }));

        toast.error(`Upload failed: ${message}`);

        console.error(
          `Cloudinary upload failed for ${field}:`,
          error
        );
      }
    },
    []
  );

  // ========================================
  // HANDLE FILE SELECTION
  // ========================================

  const handleVideosChange = useCallback(
    (nextVideos: VideosData) => {
      const fields: FileField[] = [
        "profileImage",
        "introduction",
        "demo",
      ];

      fields.forEach((field) => {
        const previousFile = videos[field];
        const nextFile = nextVideos[field];

        if (previousFile === nextFile) {
          return;
        }

        uploadIdsRef.current[field] += 1;

        if (!nextFile) {
          setMediaUploadStatus((prev) => ({
            ...prev,
            [field]: false,
          }));

          setUploading((prev) => ({
            ...prev,
            [field]: false,
          }));

          setUploadProgress((prev) => ({
            ...prev,
            [field]: 0,
          }));

          setUploadErrors((prev) => ({
            ...prev,
            [field]: "",
          }));

          return;
        }

        void uploadMedia(field, nextFile);
      });

      setVideos(nextVideos);
    },
    [videos, uploadMedia]
  );

  // ========================================
  // RETRY FAILED UPLOAD
  // ========================================


  // ========================================
  // RESTORE SESSION DATA
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const restoreData = () => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(
            saved
          ) as Partial<SavedFormData>;

          if (parsed.personal) {
            setPersonal(parsed.personal);
          }

          if (parsed.education) {
            setEducation(parsed.education);
          }

          if (parsed.subjects) {
            setSubjects(parsed.subjects);
          }

          if (parsed.teachingInfo) {
            setTeachingInfo(parsed.teachingInfo);
          }

          // Restoring this flag is only for UI continuity.
          // The backend must verify actual payment on submission.
          if (typeof parsed.isFeePaid === "boolean") {
            setIsFeePaid(parsed.isFeePaid);
          }
        }

        setStep4Completed(
          sessionStorage.getItem(STEP4_KEY) === "true"
        );

        setInterviewCompleted(
          sessionStorage.getItem(INTERVIEW_KEY) === "true"
        );

        const params = new URLSearchParams(
          window.location.search
        );

        if (params.get("step") === "5") {
          setCurrentStep(5);
        }

      } catch (error) {
        console.error(
          "Unable to restore onboarding:",
          error
        );
      }

      if (!cancelled) {
        setIsHydrated(true);
      }
    };

    const frame = requestAnimationFrame(restoreData);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  // ========================================
  // FETCH PRICING AFTER HYDRATION
  // ========================================

  useEffect(() => {
    if (!isHydrated) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPricing();
  }, [isHydrated, loadPricing]);

  // ========================================
  // AUTO SAVE
  // ========================================

  useEffect(() => {
    if (!isHydrated) return;

    const data: SavedFormData = {
      personal,
      education,
      subjects,
      teachingInfo,
      isFeePaid,
    };

    const timeout = window.setTimeout(() => {
      try {
        setSaveStatus("saving");

        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data)
        );

        setSaveStatus("saved");

      } catch (error) {
        console.error(
          "Unable to save onboarding data:",
          error
        );

        setSaveStatus("error");
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    personal,
    education,
    subjects,
    teachingInfo,
    isFeePaid,
    isHydrated,
  ]);

  // ========================================
  // INTERVIEW COMPLETION
  // ========================================

  const handleInterviewCompleted = useCallback(() => {
    setInterviewCompleted(true);

    try {
      sessionStorage.setItem(INTERVIEW_KEY, "true");
    } catch (error) {
      console.error(
        "Unable to save interview status:",
        error
      );
    }

    setValidationErrors([]);
  }, []);

  // ========================================
  // STEP VALIDATION
  // ========================================

  const validatePersonal = () => {
    const errors: string[] = [];

    const fields: {
      key: keyof PersonalData;
      label: string;
    }[] = [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "phone", label: "Phone number" },
      { key: "dateOfBirth", label: "Date of birth" },
      { key: "city", label: "City" },
      { key: "address", label: "Address" },
    ];

    fields.forEach(({ key, label }) => {
      if (!isFilled(personal[key])) {
        errors.push(label);
      }
    });

    return errors;
  };

  const validateEducation = () => {
    const errors: string[] = [];

    const fields: {
      key: keyof EducationData;
      label: string;
    }[] = [
      { key: "college", label: "College / University" },
      { key: "degree", label: "Degree" },
      { key: "currentYear", label: "Current year" },
      { key: "branch", label: "Branch / Specialization" },
      { key: "qualifications", label: "Qualifications" },
    ];

    fields.forEach(({ key, label }) => {
      if (!isFilled(education[key])) {
        errors.push(label);
      }
    });

    return errors;
  };

  const validateSubjects = () => {
    const errors: string[] = [];

    if (subjects.length === 0) {
      errors.push("At least one teaching subject");
    }

    subjects.forEach((item, index) => {
      if (!isFilled(item.subject)) {
        errors.push(`Subject ${index + 1}`);
      }

      if (!isFilled(item.classes)) {
        errors.push(`Classes for subject ${index + 1}`);
      }
    });

    const fields: {
      key: keyof TeachingInfo;
      label: string;
    }[] = [
      {
        key: "experienceYears",
        label: "Teaching experience",
      },
      {
        key: "preferredMode",
        label: "Preferred teaching mode",
      },
      {
        key: "availability",
        label: "Availability",
      },
      {
        key: "expectedSalary",
        label: "Expected salary",
      },
      {
        key: "preferredLocation",
        label: "Preferred location",
      },
      {
        key: "languages",
        label: "Languages",
      },
    ];

    fields.forEach(({ key, label }) => {
      if (!isFilled(teachingInfo[key])) {
        errors.push(label);
      }
    });

    return errors;
  };

  // ========================================
  // VIDEO VALIDATION
  // ========================================

  const validateVideos = () => {
    const errors: string[] = [];

    if (!videos.introduction) {
      errors.push("Introduction video is required.");
    } else if (!mediaUploadStatus.introduction) {
      errors.push(
        uploading.introduction
          ? "Please wait for the introduction video upload to finish."
          : "Introduction video has not uploaded successfully. Please retry."
      );
    }

    if (!videos.demo) {
      errors.push("Teaching demo video is required.");
    } else if (!mediaUploadStatus.demo) {
      errors.push(
        uploading.demo
          ? "Please wait for the demo video upload to finish."
          : "Demo teaching video has not uploaded successfully. Please retry."
      );
    }

    if (
      videos.profileImage &&
      !mediaUploadStatus.profileImage
    ) {
      errors.push(
        uploading.profileImage
          ? "Please wait for your profile photo upload to finish."
          : "Your profile photo has not uploaded successfully. Please retry or remove it."
      );
    }

    return errors;
  };

  // ========================================
  // INTERVIEW VALIDATION
  // ========================================

  const validateInterview = () => {
    return interviewCompleted
      ? []
      : ["Complete your AI teaching interview"];
  };

  // ========================================
  // PAYMENT VALIDATION
  // ========================================

  const validatePayment = () => {
    if (feeLoading) {
      return ["Please wait while registration pricing is loading."];
    }

    if (feeError || registrationFee === null) {
      return [
        "Unable to verify the registration fee. Please retry loading pricing.",
      ];
    }

    if (registrationFee === 0 || isFeePaid) {
      return [];
    }

    return ["Complete your registration fee payment"];
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return validatePersonal();

      case 2:
        return validateEducation();

      case 3:
        return validateSubjects();

      case 4:
        return validateVideos();

      case 5:
        return validateInterview();

      case 6:
        return validatePayment();

      default:
        return [];
    }
  };

  // ========================================
  // NAVIGATION
  // ========================================

  const nextStep = () => {
    clearMessages();

    const errors = validateCurrentStep();

    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    if (currentStep === 4) {
      setStep4Completed(true);

      try {
        sessionStorage.setItem(STEP4_KEY, "true");
      } catch (error) {
        console.error(
          "Unable to save video completion:",
          error
        );
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
      scrollToTop();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      clearMessages();
      scrollToTop();
    }
  };

  // ========================================
  // PAYMENT SUCCESS
  // ========================================

  const handlePaymentSuccess = () => {
    if (registrationFee === null || registrationFee <= 0) {
      return;
    }

    setIsFeePaid(true);

    setPaymentMessage(
      "Your payment was completed successfully."
    );

    setValidationErrors([]);

    toast.success("Registration payment successful!");
  };

  // ========================================
  // FINAL VALIDATION
  // ========================================

  const validateAllSteps = () => {
    const validations = [
      { step: 1, errors: validatePersonal() },
      { step: 2, errors: validateEducation() },
      { step: 3, errors: validateSubjects() },
      { step: 4, errors: validateVideos() },
      { step: 5, errors: validateInterview() },
      { step: 6, errors: validatePayment() },
    ];

    const firstInvalid = validations.find(
      (item) => item.errors.length > 0
    );

    if (firstInvalid) {
      setCurrentStep(firstInvalid.step);
      setValidationErrors(firstInvalid.errors);
      setSubmitError("");
      scrollToTop();

      return false;
    }

    return true;
  };

  // ========================================
  // SUBMISSION
  // ========================================

  const handleSubmit = async () => {
    if (isSubmitting) return;

    clearMessages();

    if (!validateAllSteps()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          personal,
          education,
          subjects,
          teachingInfo,

          registrationFeePaid:
            registrationFee === 0 || isFeePaid,
        }),
      });

      let data: {
        error?: string;
        message?: string;
      } = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setSubmitError(
          data.error ||
            data.message ||
            (res.status === 401
              ? "Your session has expired. Please sign in again."
              : res.status === 403
                ? "You don't have permission to complete this registration."
                : res.status >= 500
                  ? "Our server is temporarily unavailable. Please try again in a moment."
                  : "We couldn't submit your profile. Please review your details and try again.")
        );

        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STEP4_KEY);
      sessionStorage.removeItem(INTERVIEW_KEY);

      router.push("/teacher");

    } catch (error) {
      console.error(
        "Profile submission error:",
        error
      );

      setSubmitError(
        "Unable to connect to the server. Please check your internet connection and try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // INITIAL LOADING
  // ========================================

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Tutor<span className="text-indigo-600">Sathi</span>
              </p>

              <p className="text-xs text-slate-500">
                Teacher registration
              </p>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Loading your registration
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Restoring your saved progress...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN PAGE
  // ========================================

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">
                Tutor<span className="text-indigo-600">Sathi</span>
              </h1>
            </div>

            <span className="ml-2 hidden border-l border-slate-200 pl-3 text-xs font-medium text-slate-500 sm:block">
              Teacher Registration
            </span>
          </div>

          {/* SAVE STATUS */}

          <div
            className="flex items-center gap-1.5"
            aria-live="polite"
          >
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-500">
                  Saving...
                </span>
              </>
            )}

            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs text-slate-500">
                  Saved
                </span>
              </>
            )}

            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs text-red-600">
                  Save failed
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* PROGRESS */}

      <div className="sticky top-14 z-30">
        <RegistrationProgress
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      </div>

      {/* MAIN CONTENT */}

      <main className="mx-auto max-w-5xl bg-white px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
        <section>
          {/* STEP HEADING */}

          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CurrentIcon className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                  {steps[currentStep - 1].title}
                </h3>

                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {currentStep} / {steps.length}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* VALIDATION ERRORS */}

          {validationErrors.length > 0 && (
            <div
              id="validation-errors"
              role="alert"
              aria-live="assertive"
              className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

              <div>
                <h4 className="text-sm font-semibold text-red-800">
                  Please complete the required information
                </h4>

                <ul className="mt-1.5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li
                      key={`${error}-${index}`}
                      className="text-xs text-red-700"
                    >
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* SUBMISSION ERROR */}

          {submitError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Profile submission failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {submitError}
                </p>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mt-2 text-xs font-semibold text-red-800 underline underline-offset-2 hover:text-red-950"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* PAYMENT SUCCESS */}

          {paymentMessage && currentStep === 6 && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

              <p className="text-sm font-medium text-emerald-800">
                {paymentMessage}
              </p>
            </div>
          )}

          {/* STEP COMPONENTS */}

          <div key={currentStep} className="min-w-0">
            {currentStep === 1 && (
              <StepPersonal
                data={personal}
                onChange={setPersonal}
              />
            )}

            {currentStep === 2 && (
              <StepEducation
                data={education}
                onChange={setEducation}
              />
            )}

            {currentStep === 3 && (
              <StepSubjects
                subjects={subjects}
                teachingInfo={teachingInfo}
                onSubjectsChange={setSubjects}
                onTeachingInfoChange={setTeachingInfo}
                showValidationErrors={
                  validationErrors.length > 0
                }
              />
            )}

            {currentStep === 4 && (
              <StepVideos
                videos={videos}
                onChange={handleVideosChange}
                uploadStatus={mediaUploadStatus}
                uploading={uploading}
                uploadProgress={uploadProgress}
                uploadErrors={uploadErrors}
              />
            )}

            {currentStep === 5 && (
              <StepAIInterview
                onCompleted={handleInterviewCompleted}
              />
            )}

            {/* REGISTRATION FEE */}

            {currentStep === 6 && (
              <>
                {feeLoading ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Loading registration fee...
                      </p>

                      <p className="text-xs text-slate-500">
                        Fetching the latest fee from platform settings.
                      </p>
                    </div>
                  </div>
                ) : feeError || registrationFee === null ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
                    <div className="flex items-start gap-2 text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          Unable to load registration fee
                        </p>

                        <p className="mt-1 text-sm">
                          {feeError ||
                            "Pricing information is currently unavailable."}
                        </p>

                        <button
                          type="button"
                          disabled={feeLoading}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold underline disabled:opacity-50"
                          onClick={() => {
                            void loadPricing();
                          }}
                        >
                          {feeLoading && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <StepRegistrationFee
                    feeAmount={registrationFee}
                    isPaid={
                      isFeePaid || registrationFee === 0
                    }
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                )}
              </>
            )}

            {currentStep === 7 && (
              <StepReview
                personal={personal}
                education={education}
                subjects={subjects}
              />
            )}
          </div>

          {/* NAVIGATION */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={
                currentStep === 1 || isSubmitting
              }
              className="h-10 gap-2 rounded-lg border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  isSubmitting ||
                  (currentStep === 4 &&
                    Object.values(uploading).some(Boolean)) ||
                  (currentStep === 6 &&
                    (feeLoading ||
                      Boolean(feeError) ||
                      registrationFee === null))
                }
                className="h-10 gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {currentStep === 4 &&
                Object.values(uploading).some(Boolean) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading media...
                  </>
                ) : currentStep === 6 && feeLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading pricing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for Verification
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* FOOTER NOTE */}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your information is handled securely
            </span>

            <span className="flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Changes are saved automatically
            </span>
          </div>
        </section>
      </main>

      {/* SUBMISSION OVERLAY */}

      {isSubmitting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 shrink-0 animate-spin text-indigo-600" />

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Submitting your profile
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Please wait while we submit your information
                  for verification. Do not close this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}