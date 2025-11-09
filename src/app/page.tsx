"use client";

import { useEffect, useRef, useState } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { getDistance } from "@/lib/distances";
export interface Lot {
  _id?: string;
  lotID: string;
  title: string;
  capacity: number;
  scans?: { plateNumber: string }[];
  scanCount: number;
  available: number;
  location: string;
  allows: { [key: string]: boolean };
  distance: number;
}

interface LotRange {
  distance: {
    min: number;
    max: number;
  };
  spots: {
    min: number;
    max: number;
  };
}

const calcRanges = (lots: Lot[]): LotRange => {
  let minDistance = Infinity,
    maxDistance = -Infinity,
    minSpots = Infinity,
    maxSpots = -Infinity;

  lots.forEach((lot) => {
    minDistance = lot.distance < minDistance ? lot.distance : minDistance;
    maxDistance = lot.distance > maxDistance ? lot.distance : maxDistance;
    minSpots = lot.available < minSpots ? lot.available : minSpots;
    maxSpots = lot.available > maxSpots ? lot.available : maxSpots;
  });
  return {
    distance: { min: minDistance, max: maxDistance },
    spots: { min: minSpots, max: maxSpots },
  };
};

export default function LotsListPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true); // toggle for sort order
  const [displayMode, setDisplayMode] = useState<
    "resident" | "facstaff" | "visitor" | "commuter"
  >("commuter");
  const [targetBuilding, setTargetBuilding] = useState<
    "science-hall" | "lecture-center"
  >("science-hall");

  const [sortMode, setSortMode] = useState<"hybrid" | "distance" | "spots">(
    "hybrid"
  );

  const buildingCoords = {
    "science-hall": { lat: 41.743050942491706, long: -74.08055594997064 },
    "lecture-center": { lat: 41.74267224856954, long: -74.08419207155384 },
  };

  const scoreLot = (lot: Lot, range: LotRange) => {
    const distanceScore =
      (range.distance.max - lot.distance) /
      (range.distance.max - range.distance.min);
    const spotsScore =
      (lot.available - range.spots.min) / (range.spots.max - range.spots.min);
    return distanceScore * 0.3 + spotsScore * 0.7;
  };

  useEffect(() => {
    fetch("/api/lots")
      .then((res) => res.json())
      .then((data) => {
        // Compute derived data fields if not provided
        const processed = data.map((lot: Lot) => {
          const available = lot.available ?? lot.capacity - lot.scanCount;
          return { ...lot, available };
        });
        const filtered = processed.filter((item: Lot) => {
          return item.allows[displayMode] == true;
        });
        const filteredWithDistance: Lot[] = filtered.map((item: Lot) => {
          const coords = item.location
            .split(",")
            .map((item) => parseFloat(item));

          const distance = getDistance(
            buildingCoords[targetBuilding].lat,
            buildingCoords[targetBuilding].long,
            coords[0],
            coords[1]
          );
          return { ...item, distance };
        });
        let sorted: Lot[];
        switch (sortMode) {
          case "distance":
            sorted = filteredWithDistance.sort((a, b) => {
              return a.distance - b.distance;
            });
            setLots(sorted);
            break;
          case "hybrid":
            const ranges = calcRanges(filteredWithDistance);
            sorted = filteredWithDistance.sort((a, b) => {
              const scoreA = scoreLot(a, ranges);
              const scoreB = scoreLot(b, ranges);
              return scoreB - scoreA;
            });
            setLots(filteredWithDistance);
            break;
          case "spots":
          default:
            sorted = filteredWithDistance.sort((a, b) => {
              return b.available - a.available;
            });
            setLots(sorted);
            break;
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [displayMode, targetBuilding, sortMode]);

  const getColor = (percent: number) => {
    if (percent >= 90) return "error"; // red
    if (percent >= 70) return "warning"; // yellow
    return "success"; // green
  };

  const handleModePicker = (e:any) => {
    setDisplayMode(e.target.value);
  };
  const handleBuildingPicker = (e: any) => {
    setTargetBuilding(e.target.value);
  };
  const handleSortMode = (e: any) => {
    setSortMode(e.target.value);
  };

  if (loading) {
    return (
      <main className="p-6 max-w-3xl mx-auto text-center">
        <Typography variant="h5" sx={{ mb: 2 }}>
          Loading parking lot data...
        </Typography>
        <LinearProgress />
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <Typography variant="h4" gutterBottom>
        Parking Lots Overview
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <FormControl>
          <InputLabel id="displayModePickerLabel">Parking Type</InputLabel>
          <Select
            labelId="displayModePickerLabel"
            id="displayModePicker"
            value={displayMode}
            label="Display Mode"
            onChange={handleModePicker}
          >
            {/* <MenuItem value={"resident"}>Resident Student</MenuItem> */}
            <MenuItem value={"commuter"}>Commuter Student</MenuItem>
            <MenuItem value={"facstaff"}>Faculty/Staff</MenuItem>{" "}
            <MenuItem value={"visitor"}>Visitor</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="targetBuildingLabel">Parking Near</InputLabel>
          <Select
            labelId="targetBuildingLabel"
            id="targetBuilding"
            value={targetBuilding}
            label="Target Building"
            onChange={handleBuildingPicker}
          >
            <MenuItem value={"science-hall"}>Science Hall</MenuItem>
            <MenuItem value={"lecture-center"}>Lecture Center</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="sortModeLabel">Sort By</InputLabel>
          <Select
            labelId="sortModeLabel"
            id="sortMode"
            value={sortMode}
            label="Sort Mode"
            onChange={handleSortMode}
          >
            <MenuItem value={"hybrid"}>Hybrid</MenuItem>
            <MenuItem value={"spots"}>Availability</MenuItem>
            <MenuItem value={"distance"}>Distance</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {lots.length === 0 && (
        <Typography variant="body1" textAlign="center" color="text.secondary">
          No parking lots found in the database.
        </Typography>
      )}

      {lots.map((lot) => {
        const percent =
          lot.capacity > 0 ? (lot.scanCount / lot.capacity) * 100 : 0;

        return (
          <Paper
            key={lot.lotID}
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">{lot.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {lot.distance.toFixed(2)}mi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lot.available} / {lot.capacity} available
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={percent}
              color={getColor(percent)}
              sx={{ height: 10, borderRadius: 5 }}
            />

            <Typography variant="caption" color="text.secondary">
              {Math.round(percent)}% occupied
            </Typography>
          </Paper>
        );
      })}
    </main>
  );
}
