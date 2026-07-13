import {
    AppBar,
    Avatar,
    Box,
    IconButton,
    Toolbar,
    Typography,
} from "@mui/material";

import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";

export default function Topbar() {
    return (
        <AppBar
            position="static"
            elevation={0}
            color="inherit"
            sx={{
                borderBottom: "1px solid #e5e7eb",
            }}
        >
            <Toolbar>
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 600,
                    }}
                >
                    Dashboard
                </Typography>

                <IconButton>
                    <NotificationsOutlinedIcon />
                </IconButton>

                <Box sx={{ ml: 2 }}>
                    <Avatar>V</Avatar>
                </Box>
            </Toolbar>
        </AppBar>
    );
}