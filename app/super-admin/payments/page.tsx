"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CreditCard } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
}

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/payments");
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  if (!hasLoaded && !loading) {
    fetchPayments();
  }

  const totalSuccess = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusColor: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Payments</h2>
          <p className="text-slate-600 mt-1">Complete transaction history</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Successful</p>
            <p className="text-2xl font-bold text-green-600">₹{totalSuccess}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Transactions</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Successful Count</p>
            <p className="text-2xl font-bold">
              {payments.filter((p) => p.status === "SUCCESS").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !hasLoaded ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center py-10 text-slate-500">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div>
                    <p className="font-medium">
                      {payment.user.firstName} {payment.user.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{payment.user.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {payment.purpose} • {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">₹{payment.amount}</span>
                    <Badge className={statusColor[payment.status] || ""}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}