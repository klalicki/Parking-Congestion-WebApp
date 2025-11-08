import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("parking-app");

    // Get all lots
    const lots = await db.collection("lots").find({}).toArray();

    // Get lotStatus to see which plates are currently scanned in each lot
    const lotStatuses = await db.collection("lotStatus").find({}).toArray();

    const occupancy = lots.map((lot) => {
      // Find matching lotStatus
      const status = lotStatuses.find((s) => s.lotNumber === lot.lotID);
      const scannedCount = status?.scans?.length || 0;

      const percent = (scannedCount / lot.capacity) * 100;

      let congestion: "Low" | "Medium" | "High" = "Low";
      if (percent >= 80) congestion = "High";
      else if (percent >= 50) congestion = "Medium";

      return {
        id: lot._id,
        title: lot.title,
        lotID: lot.lotID,
        allows: lot.allows,
        capacity: lot.capacity,
        scannedCount,
        congestion,
      };
    });

    return NextResponse.json(occupancy);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch occupancy" }, { status: 500 });
  }
}
