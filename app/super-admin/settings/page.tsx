"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RefreshCw } from "lucide-react";

interface PlatformSettings {
  enableTeacherRegistration: boolean;
  enableClientRegistration: boolean;
  enableAIInterview: boolean;
  enableSubscriptions: boolean;
  maintenanceMode: boolean;
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    enableTeacherRegistration: true,
    enableClientRegistration: true,
    enableAIInterview: true,
    enableSubscriptions: true,
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  if (!hasLoaded && !loading) {
    fetchSettings();
  }

  const toggle = (field: keyof PlatformSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-slate-600 mt-1">Enable or disable major features</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "enableTeacherRegistration", label: "Teacher Registration" },
            { key: "enableClientRegistration", label: "Client Registration" },
            { key: "enableAIInterview", label: "AI Interview" },
            { key: "enableSubscriptions", label: "Subscriptions" },
            { key: "maintenanceMode", label: "Maintenance Mode" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <Label className="text-base">{item.label}</Label>
              <button
                onClick={() => toggle(item.key as keyof PlatformSettings)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[item.key as keyof PlatformSettings]
                    ? "bg-rose-600"
                    : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[item.key as keyof PlatformSettings]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </Button>
    </div>
  );
}