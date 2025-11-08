import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri, { socketTimeoutMS: 10000 });

/**
 * Removes a specific plate number from the scans array based on the provided lot ID.
 */
export async function scanPlateOut(plateNumber: string, lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  await lotsColl.updateOne(
    { lotID },
    { $pull: { scans: { plateNumber } } } as any
  );
}

/**
 * Adds a plate to the scans list for a lot (with a timestamp).
 */
export async function scanPlateIn(plateNumber: string, lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  const newScan = {
    plateNumber,
    timestamp: new Date(),
  };

  // Ensure duplicate plates are removed before adding
  await scanPlateOut(plateNumber, lotID);

  const result = await lotsColl.findOneAndUpdate(
    { lotID },
    { $push: { scans: newScan } } as any,
    { returnDocument: "after" }
  );

  console.log(result);
  return result;
}

/**
 * Returns summary data for all parking lots, including scan counts.
 */
export async function getLotData() {
  const lotsColl = client.db("ParkingApp").collection("lots");

  const result: Array<any> = await lotsColl
    .aggregate([
      {
        $project: {
          lotID: 1,
          title: 1,
          allows: 1,
          location: 1,
          capacity: 1,
          scanCount: { $size: { $ifNull: ["$scans", []] } },
        },
      },
    ])
    .toArray();

  return result;
}

/**
 * Finds unregistered plates that have been parked for more than 15 minutes.
 * Matches your schema: scans: [{ plateNumber, timeEntered }]
 */
export async function findUnauthorizedPlatesOverTime() {
  const db = client.db("ParkingApp");
  const carsColl = db.collection("cars"); // registered vehicles
  const lotsColl = db.collection("lots");

  // Get all registered plates
  const registered = await carsColl.find({}).toArray();
  const registeredPlates = new Set(registered.map((c) => c.plate));

  // Get all lots and their scanned plates
  const lots = await lotsColl.find({}).toArray();
  const now = new Date();
  const alerts: Array<{ plateNumber: string; lotID: string; minutesParked: number }> = [];

  for (const lot of lots) {
    if (!Array.isArray(lot.scans)) continue;

    for (const scan of lot.scans) {
      const { plateNumber, timeEntered } = scan;

      // Skip invalid or missing timestamps
      if (!plateNumber || !timeEntered) continue;

      // Parse timeEntered safely (e.g., "2025-11-08 09:30AM EDT")
      const enteredAt = new Date(timeEntered.replace("EDT", "GMT-4")); // handle timezone

      const diffMinutes = (now.getTime() - enteredAt.getTime()) / 60000;

      // If plate not registered and parked >15 min
      if (!registeredPlates.has(plateNumber) && diffMinutes >= 15) {
        alerts.push({
          plateNumber,
          lotID: lot.lotID,
          minutesParked: Math.floor(diffMinutes),
        });
      }
    }
  }

  return alerts;
}

