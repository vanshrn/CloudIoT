import { Box, Typography } from "@mui/material";

export default function AuthBrand() {
    return (
        <Box
            sx={{
                flex: 1,
                display: {
                    xs: "none",
                    md: "flex",
                },
                flexDirection: "column",
                justifyContent: "center",
                px: 8,
                background:
                    "linear-gradient(135deg,#1565C0,#0D47A1)",
                color: "white",
            }}
        >
            <Typography
                variant="h2"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                }}
            >
                CloudIoT
            </Typography>

            <Typography
                variant="h5"
                sx={{
                    opacity: 0.9,
                    mb: 4,
                }}
            >
                Industrial IoT Platform
            </Typography>

            <Typography
                sx={{
                    fontSize: 20,
                    maxWidth: 500,
                    opacity: 0.8,
                }}
            >
                Monitor devices, collect telemetry,
                manage fleets and predict failures
                using AWS IoT services.
            </Typography>
        </Box>
    );
}