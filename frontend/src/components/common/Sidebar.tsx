import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    Typography,
} from "@mui/material";

const menuItems = [
    "Dashboard",
    "Devices",
    "Telemetry",
    "Alerts",
    "Analytics",
    "OTA Updates",
    "Users",
    "Settings",
];

export default function Sidebar() {
    return (
        <Box
            sx={{
                width: 260,
                bgcolor: "#111827",
                color: "white",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    p: 3,
                    fontWeight: 700,
                }}
            >
                CloudIoT
            </Typography>

            <List sx={{ px: 1 }}>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item}
                        sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            color: "white",
                            "&:hover": {
                                bgcolor: "#1f2937",
                            },
                        }}
                    >
                        <ListItemText primary={item} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );
}