import { Grid, Typography } from "@mui/material";

import FleetHealth from "../components/dashboard/FleetHealth";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import StatCard from "../components/dashboard/StatCard";
import DashboardLayout from "../layouts/DashboardLayout";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 700,
                    mb: 4,
                }}
            >
                Fleet Overview
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Online Devices"
                        value={128}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Offline Devices"
                        value={5}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Active Alerts"
                        value={3}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Total Devices"
                        value={133}
                    />
                </Grid>

                <Grid size={{ xs: 12, lg: 8 }}>
                    <RecentAlerts />
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <FleetHealth />
                </Grid>
            </Grid>
        </DashboardLayout>
    );
}