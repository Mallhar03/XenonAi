import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { desc, or, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = db.select().from(reviews).where(
      or(
        sql`${reviews.isSarcastic} = 1`,
        sql`${reviews.isAmbiguous} = 1`
      )
    ).orderBy(desc(reviews.createdAt)).all();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("reviews queue error", error);
    return NextResponse.json({ error: "Failed to fetch review queue" }, { status: 500 });
  }
}
