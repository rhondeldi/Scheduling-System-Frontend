import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import theme from "../components/Theme";
import { PrintHeader } from "./PrintHeader"
import { Box, ThemeProvider } from "@mui/material";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Box width={'100%'} height={'100%'} border={'thin solid black'}>
                <PrintHeader />
            </Box>
        </ThemeProvider>
    </StrictMode>
);