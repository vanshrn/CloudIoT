import { Box } from "@mui/material";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            minHeight: "100vh",
            }}
        >
            <LoginForm />
        </Box>
    );
}