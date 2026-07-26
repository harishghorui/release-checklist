import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const release = await prisma.release.findUnique({
      where: { id },
    });

    if (!release) {
      return NextResponse.json(
        { error: "Release not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(release);
  } catch (error) {
    console.error("Failed to fetch release:", error);
    return NextResponse.json(
      { error: "Failed to fetch release" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, date, additionalInfo, completedSteps } = body;

    const updateData: {
      name?: string;
      date?: Date;
      additionalInfo?: string;
      completedSteps?: string[];
    } = {};

    if (name !== undefined) updateData.name = name;
    if (date !== undefined) updateData.date = new Date(date);
    if (additionalInfo !== undefined) updateData.additionalInfo = additionalInfo;
    if (completedSteps !== undefined) updateData.completedSteps = completedSteps;

    const updatedRelease = await prisma.release.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRelease);
  } catch (error) {
    console.error("Failed to update release:", error);
    return NextResponse.json(
      { error: "Failed to update release" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.release.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Release deleted successfully" });
  } catch (error) {
    console.error("Failed to delete release:", error);
    return NextResponse.json(
      { error: "Failed to delete release" },
      { status: 500 }
    );
  }
}
