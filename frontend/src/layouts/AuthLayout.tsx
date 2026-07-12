import { Box } from "@mui/material";

interface Props {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                backgroundColor: "#f5f7fb",
            }}
        >
            {children}
        </Box>
    );
}