import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Verify admin role directly from Clerk Public Metadata
async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const role = clerkUser.publicMetadata?.role;

  return role === "ADMIN" || role === "SUPER_ADMIN";
}

// GET: Fetch all connection requests
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const requests = await prisma.connectionRequest.findMany({
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedRequests = requests.map((request) => ({
      ...request,
      initiatedBy: request.adminNotes
        ?.toLowerCase()
        .includes("requested by client")
        ? "CLIENT"
        : "TEACHER",
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Admin requests GET error:", error);

    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject connection requests
export async function PATCH(req: Request) {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const { requestId, action } = await req.json();

    if (
      !requestId ||
      !["approve", "reject"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const connectionRequest =
      await prisma.connectionRequest.findUnique({
        where: { id: requestId },
      });

    if (!connectionRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (connectionRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be processed" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.connectionRequest.update({
      where: { id: requestId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Admin requests PATCH error:", error);

    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}