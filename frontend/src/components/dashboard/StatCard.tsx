import { Paper, Typography } from "@mui/material";

interface StatCardProps {
    title: string;
    value: string | number;
}

export default function StatCard({
    title,
    value,
}: StatCardProps) {
    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                borderRadius: 3,
                height: 140,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <Typography
                color="text.secondary"
                sx={{
                    fontSize: 15,
                }}
            >
                {title}
            </Typography>

            <Typography
                variant="h3"
                sx={{
                    fontWeight: 700,
                }}
            >
                {value}
            </Typography>
        </Paper>
    );
}