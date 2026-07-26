import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const releases = await prisma.release.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(releases);
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    return NextResponse.json(
      { error: "Failed to fetch releases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, date, additionalInfo } = body;

    if (!name || !date) {
      return NextResponse.json(
        { error: "Name and date are required" },
        { status: 400 }
      );
    }

    const release = await prisma.release.create({
      data: {
        name,
        date: new Date(date),
        additionalInfo: additionalInfo ?? "",
      },
    });

    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    console.error("Failed to create release:", error);
    return NextResponse.json(
      { error: "Failed to create release" },
      { status: 500 }
    );
  }
}
