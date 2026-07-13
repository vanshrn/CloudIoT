import {
    Chip,
    List,
    ListItem,
    ListItemText,
    Paper,
    Typography,
} from "@mui/material";

const alerts = [
    {
        device: "ESP32_001",
        message: "High Temperature",
        severity: "Critical",
    },
    {
        device: "ESP32_018",
        message: "Offline",
        severity: "Warning",
    },
    {
        device: "ESP32_024",
        message: "Low Battery",
        severity: "Warning",
    },
];

export default function RecentAlerts() {
    return (
        <Paper
            sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    fontWeight: 600,
                }}
            >
                Recent Alerts
            </Typography>

            <List disablePadding>
                {alerts.map((alert) => (
                    <ListItem
                        key={alert.device}
                        disableGutters
                        secondaryAction={
                            <Chip
                                label={alert.severity}
                                color={
                                    alert.severity === "Critical"
                                        ? "error"
                                        : "warning"
                                }
                                size="small"
                            />
                        }
                    >
                        <ListItemText
                            primary={alert.device}
                            secondary={alert.message}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}