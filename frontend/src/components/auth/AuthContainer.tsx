import { Box } from "@mui/material";

interface Props {
    children: React.ReactNode;
}

export default function AuthContainer({ children }: Props) {
    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 4,
            }}
        >
            {children}
        </Box>
    );
}