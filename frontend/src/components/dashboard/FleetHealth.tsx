import {
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

const health = [
    {
        label: "Healthy",
        value: 96,
        color: "success",
    },
    {
        label: "Warning",
        value: 3,
        color: "warning",
    },
    {
        label: "Critical",
        value: 1,
        color: "error",
    },
] as const;

export default function FleetHealth() {
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
                    mb: 3,
                    fontWeight: 600,
                }}
            >
                Fleet Health
            </Typography>

            <Stack spacing={3}>
                {health.map((item) => (
                    <Stack
                        key={item.label}
                        spacing={1}
                    >
                        <Typography>
                            {item.label} ({item.value}%)
                        </Typography>

                        <LinearProgress
                            variant="determinate"
                            value={item.value}
                            color={item.color}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                            }}
                        />
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}