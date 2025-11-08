'use client';

import { useEffect, useState } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SortIcon from '@mui/icons-material/Sort';

interface Lot {
  _id?: string;
  lotID: string;
  title: string;
  capacity: number;
  scans?: { plateNumber: string }[];
  scanCount: number;
  available?: number;
}

export default function LotsListPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true); // toggle for sort order

  useEffect(() => {
    fetch('/api/lots')
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

  // Sort handler
  const handleSort = () => {
    setSortAsc((prev) => !prev);
    setLots((prev) =>
      [...prev].sort((a, b) =>
        sortAsc
          ? (b.available ?? 0) - (a.available ?? 0) // Descending
          : (a.available ?? 0) - (b.available ?? 0) // Ascending
      )
    );
  };

  const getColor = (percent: number) => {
    if (percent >= 90) return 'error'; // red
    if (percent >= 70) return 'warning'; // yellow
    return 'success'; // green
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Parking Lots Overview
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SortIcon />}
          onClick={handleSort}
        >
          Sort by Availability {sortAsc ? '(↓)' : '(↑)'}
        </Button>
      </Stack>

      {lots.length === 0 && (
        <Typography variant="body1" textAlign="center" color="text.secondary">
          No parking lots found in the database.
        </Typography>
      )}

      {lots.map((lot) => {
        const percent = lot.capacity > 0 ? (lot.scanCount / lot.capacity) * 100 : 0;

        return (
          <Paper
            key={lot.lotID}
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{lot.title}</Typography>
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
