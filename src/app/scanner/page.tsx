"use client";

import {
  Typography,
  LinearProgress,
  Stack,
  Paper,
  Box,
  Button,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Chip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Lot } from "../page";

export default function Page() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotID, setLotID] = useState<string>("OMP");
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [currentLotData, setCurrentLotData] = useState<Lot>();
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  // type RequestData = {
  // plateNumber: string;
  // lotID: string;
  // scanType: "entry" | "exit";
  // };

  const addCar = async (plateNumber: string) => {
    await fetch("/api/scan/", {
      method: "POST",
      body: JSON.stringify({ plateNumber, lotID, scanType: "entry" }),
    });
    setRefresh((refresh) => !refresh);
  };
  const removeCar = async (plateNumber: string) => {
    await fetch("/api/scan/", {
      method: "POST",
      body: JSON.stringify({ plateNumber, lotID, scanType: "exit" }),
    });
    setRefresh((refresh) => !refresh);
  };

  const handlePlateChange = (e) => {
    setPlateNumber(e.target.value);
  };

  const handleSelectLot = (e) => {
    setLotID(e.target.value);
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
        setLots(processed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/lots")
      .then((res) => res.json())
      .then((data) => {
        // Compute derived data fields if not provided
        const processed = data.map((lot: Lot) => {
          const available = lot.available ?? lot.capacity - lot.scanCount;
          return { ...lot, available };
        });
        // find the item from the list where lot.lotID is equal to our lotID state value
        const selected = processed.find((lot: Lot) => lot.lotID === lotID);
        setCurrentLotData(selected);
        setLots(processed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lotID, refresh]);

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
        Scanner API Test
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      ></Stack>
      <FormControl>
        <InputLabel id="displayModePickerLabel">Parking Lot</InputLabel>
        <Select
          labelId="displayModePickerLabel"
          id="displayModePicker"
          value={lotID}
          label="Display Mode"
          onChange={handleSelectLot}
        >
          {lots.map((lot) => {
            return <MenuItem value={lot.lotID}>{lot.title}</MenuItem>;
          })}
        </Select>
      </FormControl>

      {/* a text input to type a license plate, then buttons for entry and exit scans */}
      {/* text input */}
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <TextField
          id="outlined-basic"
          label="License Plate"
          variant="outlined"
          value={plateNumber}
          onChange={handlePlateChange}
        />

        <Button
          variant="contained"
          onClick={() => {
            addCar(plateNumber);
            setPlateNumber("");
          }}
        >
          Entry Scan
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            removeCar(plateNumber);
            setPlateNumber("");
          }}
        >
          Exit Scan
        </Button>
      </Box>

      {currentLotData && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h4">
            {currentLotData.title}: {currentLotData.scanCount}/
            {currentLotData.capacity} cars
          </Typography>
          <Box sx={{ mt: 2, p: 1, gap: 1, display: "flex", flexWrap: "wrap" }}>
            {currentLotData.scans?.map((scan) => {
              return (
                <Chip
                  key={scan.plateNumber}
                  onDelete={(e) => {
                    removeCar(scan.plateNumber);
                  }}
                  label={scan.plateNumber}
                ></Chip>
              );
            })}
          </Box>
        </Paper>
      )}
    </main>
  );
}
