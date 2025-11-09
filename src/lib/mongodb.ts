import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri, {
  maxIdleTimeMS: 500,
  maxPoolSize: 100,
  maxConnecting: 2,
});

/**
 * Removes a specific plate number from the scans array based on the provided lot ID.
 */
export async function scanPlateOut(plateNumber: string, lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");

  const cleanedPlate = plateNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  await lotsColl.updateOne({ lotID }, {
    $pull: { scans: { plateNumber: cleanedPlate } },
  } as any);
}

/**
 * Adds a plate to the scans list for a lot (with a timestamp).
 */
export async function scanPlateIn(plateNumber: string, lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  // remove all non-alphanumeric characters from plateNumber:
  const cleanedPlate = plateNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const newScan = {
    plateNumber: cleanedPlate,
    timestamp: new Date(),
  };
  const newScanArchive = { ...newScan, type: "entry" };

  // Ensure duplicate plates are removed before adding
  await scanPlateOut(cleanedPlate, lotID);

  const result = await lotsColl.findOneAndUpdate(
    { lotID },
    { $push: { scans: newScan, scanArchive: newScanArchive } } as any,
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
          scans: 1,
          scanCount: { $size: { $ifNull: ["$scans", []] } },
        },
      },
    ])
    .toArray();

  return result;
}

/**
 * Finds unregistered plates that have been parked for more than 15 minutes.
 * Uses `timestamp` instead of old `timeEntered`.
 */
export async function findUnauthorizedPlatesOverTime() {
  const db = client.db("ParkingApp");

  const carsColl = db.collection("cars"); // registered vehicles
  const lotsColl = db.collection("lots");

  const registered = await carsColl.find({}).toArray();

  const registeredPlates = registered.map((c) => c.plate);
  const lots = await lotsColl.find().toArray();
  const now = new Date();

  const alerts: Array<{
    plateNumber: string;
    lotID: string;
    minutesParked: number;
  }> = [];

  for (const lot of lots) {
    console.log(lot);
    if (!Array.isArray(lot.scans)) continue;

    for (const scan of lot.scans) {
      if (!scan || typeof scan !== "object") continue; // skip null or malformed entries
      console.log(scan);
      const { plateNumber, timestamp } = scan;
      if (!plateNumber || !timestamp) continue;

      const enteredAt = new Date(timestamp);

      const diffMinutes = (now.getTime() - enteredAt.getTime()) / 60000;

      // alert only if plate unregistered + >15min parked
      if (
        !registeredPlates.find((plate) => {
          return plate.plateNumber === plateNumber;
        }) &&
        diffMinutes >= 15
      ) {
        alerts.push({
          plateNumber,
          lotID: lot.lotID,
          minutesParked: Math.floor(diffMinutes),
        });
      }
    }
  }

  console.log("Unauthorized alerts:", alerts.length);
  return alerts;
}

const generateRandomPlate = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let plate = "";
  for (let i = 0; i < 3; i++) {
    plate += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return {
    plateNumber: plate,
    timestamp: new Date(),
  };
};

export async function testAddCars(lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  console.log(lotsColl);
  const newCars = [];
  const carsToAdd = Math.random() * 10 + 10;
  for (let i = 0; i < carsToAdd; i++) {
    newCars.push(generateRandomPlate());
  }

  lotsColl.findOneAndUpdate(
    { lotID: lotID },
    { $push: { scans: { $each: newCars } } as any }
  );
}

export async function testRemoveCars(lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  console.log(lotsColl);
  for (let i = 0; i < 20; i++) {
    lotsColl.findOneAndUpdate({ lotID: lotID }, { $pop: { scans: 1 } });
  }
}
