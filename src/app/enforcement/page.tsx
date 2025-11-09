"use client";

import { useEffect, useState } from "react";
import { Box, Typography, LinearProgress, Button, Paper } from "@mui/material";
import AlertsTable from "./components/AlertsTable";
import BackButton from "../components/BackButton";

interface Alert {
  plateNumber: string;
  lotID: string;
  minutesParked: number;
}

export default function EnforcementDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/enforcement/alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Enforcement</Typography>
        <Button variant="outlined" onClick={fetchAlerts}>
          Refresh Now
        </Button>
      </Box>

      {loading ? (
        <>
          <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
            Checking for unauthorized vehicles...
          </Typography>
          <LinearProgress />
        </>
      ) : alerts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            ✅ No unauthorized vehicles detected.
          </Typography>
        </Paper>
      ) : (
        <AlertsTable alerts={alerts} />
      )}
    </main>
  );
}
