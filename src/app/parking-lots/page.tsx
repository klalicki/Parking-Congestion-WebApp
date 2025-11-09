"use client";

import {
  Typography,
  LinearProgress,
  Stack,
  Paper,
  Box,
  Button,
  Grid,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Lot } from "../page";

export default function Page() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const addCars = async (lotID: string) => {
    await fetch("/api/testing/add/", {
      method: "POST",
      body: JSON.stringify({ lotID }),
    });
    setRefresh(refresh + 1);
  };

  const removeCars = async (lotID: string) => {
    await fetch("/api/testing/remove/", {
      method: "POST",
      body: JSON.stringify({ lotID }),
    });
    setRefresh(refresh + 1);
  };
  const getColor = (percent: number) => {
    if (percent >= 90) return "error"; // red
    if (percent >= 70) return "warning"; // yellow
    return "success"; // green
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
        let sorted: Lot[];
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh]);

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
      ></Stack>

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
                {lot.available} / {lot.capacity} available
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Button
                variant="contained"
                onClick={() => {
                  addCars(lot.lotID);
                }}
              >
                Add 20
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  removeCars(lot.lotID);
                }}
              >
                Remove 20
              </Button>
            </Grid>
            <Typography variant="caption" color="text.secondary">
              {Math.round(percent)}% occupied
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percent}
              color={getColor(percent)}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Paper>
        );
      })}
    </main>
  );
}
