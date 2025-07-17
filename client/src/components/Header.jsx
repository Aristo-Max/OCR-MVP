import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const Header = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

    return (
        <AppBar position="static" sx={{ backgroundColor: "#fff" }}>
            <Toolbar
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    paddingX: isMobile ? 1 : 3,
                    minHeight: isMobile ? 48 : 64,
                }}
            >
                {/* Logo on the Left */}
                <Box sx={{ display: "flex", alignItems: "center", minWidth: 60 }}>
                    <img
                        src="/AristoMax.png"
                        alt="Logo"
                        style={{
                            height: isMobile ? 30 : isTablet ? 35 : 40,
                            marginRight: isMobile ? 4 : 8,
                        }}
                    />
                </Box>

                {/* Centered Content */}
                <Typography
                    variant={isMobile ? "h6" : isTablet ? "h5" : "h4"}
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 750,
                        textAlign: "center",
                        color: "#0D9ECA",
                        position: "absolute",
                        left: 0,
                        right: 0,
                        margin: "auto",
                        width: "fit-content",
                        pointerEvents: "none",
                    }}
                >
                    SmartRead
                </Typography>
                {/* Placeholder for right side to balance the logo */}
                <Box sx={{ minWidth: 60 }} />
            </Toolbar>
        </AppBar>
    );
};

export default Header;