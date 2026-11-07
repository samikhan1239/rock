import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Check if user already exists in our database
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
    include: {
      creditWallet: true,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // Get role from Clerk publicMetadata
  const roleFromMetadata = clerkUser.publicMetadata?.role as string | undefined;
  const role = (roleFromMetadata as Role) || "TEACHER";

  // Create new user in our database
  const newUser = await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      role: role,
      creditWallet: {
        create: {
          freeCredits: 5,
          purchasedCredits: 0,
          reservedCredits: 0,
          usedCredits: 0,
        },
      },
    },
    include: {
      creditWallet: true,
    },
  });

  return newUser;
}