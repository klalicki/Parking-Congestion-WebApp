import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";

const client = new MongoClient(uri, { socketTimeoutMS: 10000 });

/**
 * This function removes a specific plate number from the scans array based on the provided lot ID.
 * @param {string} plateNumber - The `plateNumber` parameter is a string that represents the license
 * plate number of a vehicle that is being scanned out of a parking lot.
 * @param {string} lotID - The `lotID` parameter is a string that represents the unique identifier of a
 * parking lot where a vehicle with a specific plate number is being scanned out.
 */
export async function scanPlateOut(plateNumber: string, lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  await lotsColl.updateOne({ lotID: lotID }, {
    $pull: { scans: { plateNumber: plateNumber } },
  } as any);
}

/**
 * The `scanPlateIn` function scans a plate number into a specified parking lot and
 * updates the database with the new scan information.
 * @param {string} plateNumber - The `plateNumber` parameter is a string that represents the license
 * plate number of a vehicle that is being scanned in.
 * @param {string} lotID - A lotID is a unique identifier for a parking lot in the ParkingApp system.
 * It helps to distinguish one parking lot from another and is used to track information related to a
 * specific parking lot.
 * @returns The `scanPlateIn` function is returning the result of the `findOneAndUpdate` operation on
 * the `lotsColl` collection after pushing the new scan object into the `scans` array for the specified
 * `lotID`.
 */
export async function scanPlateIn(plateNumber: string, lotID: string) {
  const lotsColl = client.db("ParkingApp").collection("lots");
  const newScan = {
    plateNumber: plateNumber,
    timestamp: new Date(),
  };
  await scanPlateOut(plateNumber, lotID);
  const result = await lotsColl.findOneAndUpdate(
    { lotID: lotID },
    {
      $push: { scans: newScan },
    } as any,
    { returnDocument: "after" }
  );

  console.log(result);
  return result;
}

export async function getLotData() {
  const lotsColl = client.db("ParkingApp").collection("lots");

  // for each item in this list, get its basic information, plus the number of items in its 'scans' array
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