import {
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import useLoginForm from "../../hooks/useLoginForm";

export default function LoginForm() {
    const login = useLoginForm();

    return (
        <Paper
            elevation={6}
            sx={{
                width: 420,
                p: 5,
                borderRadius: 4,
            }}
        >
            <Stack spacing={3}>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                >
                    Welcome Back
                </Typography>

                <Typography color="text.secondary">
                    Sign in to continue to CloudIoT
                </Typography>

                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={login.email}
                    onChange={(e) =>
                        login.setEmail(e.target.value)
                    }
                    error={login.emailError}
                    helperText={
                        login.emailError
                            ? "Enter a valid email address."
                            : " "
                    }
                />

                <TextField
                    label="Password"
                    type={
                        login.showPassword
                            ? "text"
                            : "password"
                    }
                    fullWidth
                    value={login.password}
                    onChange={(e) =>
                        login.setPassword(e.target.value)
                    }
                    error={login.passwordError}
                    helperText={
                        login.passwordError
                            ? "Password must be at least 8 characters."
                            : " "
                    }
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={() =>
                                            login.setShowPassword(
                                                !login.showPassword
                                            )
                                        }
                                    >
                                        {login.showPassword ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={login.rememberMe}
                            onChange={(e) =>
                                login.setRememberMe(
                                    e.target.checked
                                )
                            }
                        />
                    }
                    label="Remember me"
                />

                <Link
                    href="#"
                    underline="hover"
                    sx={{
                        alignSelf: "flex-end",
                        mt: -2,
                    }}
                >
                    Forgot password?
                </Link>

                <Button
                    variant="contained"
                    size="large"
                    disabled={!login.isValid}
                    sx={{
                        py: 1.4,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: "none",
                    }}
                >
                    Sign In
                </Button>
            </Stack>
        </Paper>
    );
}