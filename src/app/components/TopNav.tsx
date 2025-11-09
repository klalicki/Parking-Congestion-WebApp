import { Box, Container, Paper, Typography } from "@mui/material";
import Link from "next/link";

export default function TopNav() {
  return (
    <Container sx={{ display: "flex", justifyContent: "center", p: 1, pt: 2 }}>
      <Link href="/">
        <img
          style={{ height: "3rem" }}
          src="/lotsight.svg"
          alt="LotSight"
        ></img>
      </Link>
    </Container>
  );
}
