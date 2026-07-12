import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: "#00bcd4",
        },
    },

    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
    },

    shape: {
        borderRadius: 10,
    },
});

export default theme;