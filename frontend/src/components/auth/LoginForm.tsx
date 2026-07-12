import { Button, Paper, Stack, TextField, Typography } from "@mui/material";

export default function LoginForm() {
    return (
        <Paper
            elevation={4}
            sx={{
                width: 420,
                p: 4,
                borderRadius: 3,
            }}
        >
            <Stack spacing={3}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: "bold",
                    }}
                >
                    CloudIoT
                </Typography>

                <Typography color="text.secondary">
                    Sign in to your account
                </Typography>

                <TextField
                    label="Email"
                    fullWidth
                />

                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                />

                <Button
                    variant="contained"
                    size="large"
                >
                    Login
                </Button>
            </Stack>
        </Paper>
    );
}