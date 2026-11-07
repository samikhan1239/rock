"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ConnectionRequest {
  id: string;
  status: string;
  createdAt: string;
  teacher: {
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/client/requests");
        const data = await res.json();
        if (res.ok) {
          setRequests(data.requests || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-slate-100 text-slate-800",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Connection Requests</h2>
        <p className="text-slate-600 mt-1">Track all your requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No connection requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {req.teacher?.user?.firstName} {req.teacher?.user?.lastName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Sent on {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={statusColor[req.status] || ""}>
                  {req.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}