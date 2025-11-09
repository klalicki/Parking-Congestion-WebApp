"use client";

import { useEffect, useRef, useState } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { getDistance } from "@/lib/distances";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import { Icon } from "@mui/material";
import NoCrashIcon from "@mui/icons-material/NoCrash";
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

const REFRESH_INTERVAL = 30;

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
  const [useMinutes, setUseMinutes] = useState<boolean>(true);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState<number>(REFRESH_INTERVAL);
  const [forceRefresh, setForceRefresh] = useState(false);
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
      lot.available > 50
        ? 0.7
        : (lot.available - range.spots.min) /
          (range.spots.max - range.spots.min);
    return distanceScore * 0.3 + spotsScore * 0.7;
  };

  const decrementTimer = () => {
    setRefreshTimer((prev) => {
      if (prev === 0) {
        setForceRefresh((prev) => !prev);

        return REFRESH_INTERVAL;
      } else {
        return prev - 1;
      }
    });
  };

  useEffect(() => {
    const refreshIntervalID = setInterval(decrementTimer, 1000);
    return () => {
      clearInterval(refreshIntervalID);
    };
  }, []);

  useEffect(() => {
    fetch("/api/lots")
      .then((res) => res.json())
      .then((data) => {
        // Compute derived data fields if not provided
        const processed = data.map((lot: Lot) => {
          const available =
            lot.capacity - lot.scanCount > 0 ? lot.capacity - lot.scanCount : 0;
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
  }, [displayMode, targetBuilding, sortMode, forceRefresh]);

  const toggleMinutes = () => {
    setUseMinutes(!useMinutes);
  };

  const getColor = (percent: number) => {
    if (percent >= 90) return "error"; // red
    if (percent >= 70) return "warning"; // yellow
    return "success"; // green
  };

  const handleModePicker = (e: any) => {
    setDisplayMode(e.target.value);
  };
  const handleBuildingPicker = (e: any) => {
    setTargetBuilding(e.target.value);
  };
  const handleSortMode = (e: any) => {
    setSortMode(e.target.value);
  };

  const refreshPage = () => {
    setForceRefresh((prev) => !prev);
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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" gutterBottom>
          Lots
        </Typography>
        <Button onClick={refreshPage}>Refresh ({refreshTimer})</Button>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <FormControl>
          <InputLabel id="displayModePickerLabel">Permit Type</InputLabel>
          <Select
            labelId="displayModePickerLabel"
            id="displayModePicker"
            value={displayMode}
            label="Display Mode"
            onChange={handleModePicker}
          >
            {/* <MenuItem value={"resident"}>Resident Student</MenuItem> */}
            <MenuItem value={"commuter"}>Commuter </MenuItem>
            <MenuItem value={"facstaff"}>Fac/Staff</MenuItem>{" "}
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
            <MenuItem value={"hybrid"}>Best</MenuItem>
            <MenuItem value={"spots"}>Spots</MenuItem>
            <MenuItem value={"distance"}>Distance</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {lots.length === 0 && (
        <Typography variant="body1" textAlign="center" color="text.secondary">
          No parking lots found in the database.
        </Typography>
      )}

      {lots.map((lot, lotIndex) => {
        const percent =
          lot.capacity > 0 ? (lot.scanCount / lot.capacity) * 100 : 0;

        const isFirstChoice = lotIndex === 0;
        return (
          <Paper
            key={lot.lotID}
            elevation={3}
            sx={{
              p: 0,
              mb: 2,
              borderRadius: 2,
              border: isFirstChoice ? "2px solid" : undefined,
              borderColor: isFirstChoice ? "success.main" : undefined,
            }}
          >
            {isFirstChoice && (
              <Box
                sx={{
                  backgroundColor: "success.main",
                  p: 0.5,
                  pl: 2,
                  color: "Background",
                  fontWeight: 500,
                  mb: 0,
                }}
              >
                Best Choice
              </Box>
            )}
            <Box
              sx={{
                p: 2,
                pt: isFirstChoice ? 1 : 2,
                gap: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">{lot.title}</Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h3">
                    <DirectionsWalkIcon />
                    {useMinutes
                      ? Math.ceil(lot.distance * 20)
                      : lot.distance.toFixed(2)}
                    <span
                      onClick={toggleMinutes}
                      style={{ fontSize: "1rem", marginLeft: ".25rem" }}
                    >
                      {useMinutes ? "min" : "mi"}
                    </span>
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h3">
                    <NoCrashIcon />
                    {lot.available}
                    <span style={{ fontSize: "1rem", marginLeft: ".25rem" }}>
                      spots
                    </span>
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={percent}
                color={getColor(percent)}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {Math.round(percent)}% occupied
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lot.available}/{lot.capacity} spots available
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </main>
  );
}
