import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

declare global {
  var _mongoClient: MongoClient | undefined;
}

function getClient(): MongoClient {
  if (!global._mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");

    global._mongoClient = new MongoClient(uri);
  }

  return global._mongoClient;
}

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId is required" },
      { status: 400 }
    );
  }

  try {
    const client = getClient();
    await client.connect();

    const db = client.db("etbot");

    const company = await db
      .collection("companies")
      .findOne(
        { id: companyId },
        { projection: { _id: 0 } }
      );

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(company, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    });

  } catch (err) {
    console.error("[/api/company] error:", err);

    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}