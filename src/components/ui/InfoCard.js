// src/components/ui/InfoCard.jsx

import { Paper, Typography } from "@mui/material";

export function InfoCard({ title, value }) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 90,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        gutterBottom
        sx={{ fontWeight: 500 }}
      >
        {title}
      </Typography>
      <Typography
        variant="h6"
        sx={{ color: "primary.main", fontWeight: 600 }}
      >
        {value || "N/A"}
      </Typography>
    </Paper>
  );
}
