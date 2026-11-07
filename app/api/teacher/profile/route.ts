import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { personal, education, subjects, teachingInfo } = body;

    // 1. Find or create the User
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { teacherProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: personal.firstName,
          lastName: personal.lastName,
          phone: personal.phone,
          role: "TEACHER",
          creditWallet: {
            create: {
              freeCredits: 5,
              purchasedCredits: 0,
              reservedCredits: 0,
              usedCredits: 0,
            },
          },
        },
        include: { teacherProfile: true },
      });
    } else {
      // Update basic user info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: personal.firstName,
          lastName: personal.lastName,
          phone: personal.phone,
        },
      });
    }

    // 2. Create or Update TeacherProfile
    const teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        dateOfBirth: personal.dateOfBirth ? new Date(personal.dateOfBirth) : null,
        city: personal.city,
        address: personal.address,
        college: education.college,
        degree: education.degree,
        currentYear: education.currentYear,
        branch: education.branch,
        qualifications: education.qualifications,
        experienceYears: teachingInfo.experienceYears
          ? parseInt(teachingInfo.experienceYears)
          : 0,
        preferredMode: teachingInfo.preferredMode || null,
        availability: teachingInfo.availability || null,
        expectedSalary: teachingInfo.expectedSalary
          ? parseInt(teachingInfo.expectedSalary)
          : null,
        preferredLocation: teachingInfo.preferredLocation || null,
        languages: teachingInfo.languages
          ? teachingInfo.languages.split(",").map((l: string) => l.trim())
          : [],
        verificationStatus: "PENDING",
      },
      create: {
        userId: user.id,
        dateOfBirth: personal.dateOfBirth ? new Date(personal.dateOfBirth) : null,
        city: personal.city,
        address: personal.address,
        college: education.college,
        degree: education.degree,
        currentYear: education.currentYear,
        branch: education.branch,
        qualifications: education.qualifications,
        experienceYears: teachingInfo.experienceYears
          ? parseInt(teachingInfo.experienceYears)
          : 0,
        preferredMode: teachingInfo.preferredMode || null,
        availability: teachingInfo.availability || null,
        expectedSalary: teachingInfo.expectedSalary
          ? parseInt(teachingInfo.expectedSalary)
          : null,
        preferredLocation: teachingInfo.preferredLocation || null,
        languages: teachingInfo.languages
          ? teachingInfo.languages.split(",").map((l: string) => l.trim())
          : [],
        verificationStatus: "PENDING",
      },
    });

    // 3. Handle Subjects (delete old + create new)
    await prisma.teacherSubject.deleteMany({
      where: { teacherId: teacherProfile.id },
    });

    if (subjects && subjects.length > 0) {
      const validSubjects = subjects.filter(
        (s: { subject: string }) => s.subject && s.subject.trim() !== ""
      );

      if (validSubjects.length > 0) {
        await prisma.teacherSubject.createMany({
          data: validSubjects.map((s: { subject: string; classes: string }) => ({
            teacherId: teacherProfile.id,
            subject: s.subject.trim(),
            classes: s.classes
              ? s.classes.split(",").map((c: string) => c.trim())
              : [],
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile submitted successfully for verification",
      teacherProfileId: teacherProfile.id,
    });
  } catch (error: unknown) {
    console.error("Teacher profile error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}