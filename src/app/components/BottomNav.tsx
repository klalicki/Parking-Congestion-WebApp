import { Box, Container, Paper } from "@mui/material";
import Link from "next/link";

export default function BottomNav() {
  return (
    <Paper elevation={8} square variant="outlined">
      <Container sx={{ display: "flex", gap: 2, p: 2 }}>
        <Link href={"/"}>Home</Link>
        <Link href={"/enforcement"}>Enforcement</Link>
        <Link href={"/scanner"}>Scanner API</Link>
        <Link href={"/parking-lots"}>Parking Lots Overview</Link>
      </Container>
    </Paper>
  );
}
