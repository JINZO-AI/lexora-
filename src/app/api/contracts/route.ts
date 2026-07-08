import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { saveContractFile, parseContractFile } from "@/lib/file-storage";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, SUBSCRIPTION_PLANS } from "@/lib/constants";

// GET /api/contracts - list user's contracts
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const riskLevel = searchParams.get("riskLevel") || "";
  const contractType = searchParams.get("contractType") || "";
  const status = searchParams.get("status") || "";
  const starredOnly = searchParams.get("starred") === "true";
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "50"));
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: any = { userId: user.id };
  if (search) {
    where.title = { contains: search };
  }
  if (riskLevel) where.riskLevel = riskLevel;
  if (contractType) where.contractType = contractType;
  if (status) where.status = status;
  if (starredOnly) where.isStarred = true;

  const [contracts, total] = await Promise.all([
    db.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { clauses: true } },
      },
    }),
    db.contract.count({ where }),
  ]);

  return NextResponse.json({
    contracts: contracts.map((c) => ({
      ...c,
      missingClauses: c.missingClauses ? JSON.parse(c.missingClauses) : null,
      negotiationPriorities: c.negotiationPriorities ? JSON.parse(c.negotiationPriorities) : null,
      immediateRedFlags: c.immediateRedFlags ? JSON.parse(c.immediateRedFlags) : null,
      clauseCount: c._count.clauses,
    })),
    total,
    offset,
    limit,
  });
}

// POST /api/contracts - upload a new contract
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const contractType = (formData.get("contractType") as string) || "custom";
    const expiresAt = formData.get("expiresAt") as string | null;
    const notes = (formData.get("notes") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title.trim()) {
      return NextResponse.json({ error: "Contract title is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      return NextResponse.json({ error: "Only PDF, DOCX, and TXT files are supported" }, { status: 400 });
    }

    // Check monthly limit
    const plan = user.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS;
    const monthlyLimit = SUBSCRIPTION_PLANS[plan]?.monthlyLimit ?? 5;
    if (monthlyLimit !== -1) {
      const fullUser = await db.user.findUnique({ where: { id: user.id } });
      if (fullUser && fullUser.contractsAnalyzedThisMonth >= monthlyLimit) {
        return NextResponse.json({
          error: `You've reached your monthly limit of ${monthlyLimit} contract analyses. Upgrade your plan for more.`,
        }, { status: 403 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine mime type
    let mimeType = file.type;
    if (!mimeType) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else mimeType = "text/plain";
    }

    // Save file
    const { filePath, fileHash, fileSize } = await saveContractFile(
      user.id,
      file.name,
      mimeType,
      buffer
    );

    // Check for duplicates
    const duplicate = await db.contract.findFirst({
      where: { userId: user.id, fileHash },
      select: { id: true, title: true },
    });

    // Parse the file to get text and metadata
    const parsed = await parseContractFile(filePath, mimeType);

    // Create contract record
    const contract = await db.contract.create({
      data: {
        userId: user.id,
        title: title.trim(),
        filePath,
        fileName: file.name,
        fileSize,
        fileHash,
        mimeType,
        contractType,
        language: "en",
        pageCount: parsed.pageCount,
        wordCount: parsed.wordCount,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "uploaded",
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "contract_uploaded",
        entityType: "contract",
        entityId: contract.id,
        newValues: JSON.stringify({ title: contract.title, contractType: contract.contractType, fileSize }),
        ipAddress: req.headers.get("x-forwarded-for") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      contract: {
        ...contract,
        missingClauses: null,
        negotiationPriorities: null,
        immediateRedFlags: null,
      },
      duplicateWarning: duplicate
        ? `A contract with the same file was already uploaded as "${duplicate.title}"`
        : null,
    }, { status: 201 });
  } catch (error) {
    console.error("Contract upload error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to upload contract",
    }, { status: 500 });
  }
}
