import { Box } from "@mui/material";

import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

interface Props {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
    return (
        <Box
            sx={{
                display: "flex",
                height: "100vh",
            }}
        >
            <Sidebar />

            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Topbar />

                <Box
                    sx={{
                        flex: 1,
                        p: 4,
                        bgcolor: "#f5f7fb",
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}