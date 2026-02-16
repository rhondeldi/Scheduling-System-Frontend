import { StrictMode, useEffect, useState } from 'react'

import { AppBar, Box, Container, Link, Toolbar, Typography } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { fetchWho, logoutDepartment } from '../js/departments.js'
import { Popup } from "../components/Loading";

import Identicon from 'identicon.js';
import { DEV } from '../js/basics.js';

function randByte(seed_string) {
    let hash = 0;
    for (let i = 0; i < seed_string.length; i++) {
        const charCode = seed_string.charCodeAt(i) % 256;
        hash = (hash * 31 + charCode) % 256;
    }
    return hash;
}

const pages = ['schedule', 'instructors', 'rooms', 'subjects', 'curriculums', 'departments'];

export function MainHeader({ pageName }) {

    const [anchorElNav, setAnchorElNav] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);

    const [userIconData, setUserIconData] = useState("")

    useEffect(() => {
        const useEffectAsync = async () => {
            const who = await fetchWho();

            if (who == 'no one is logged in') {
                console.log('detected no one is logged in on page load')
                window.location.href = '/login';
            } else {
                console.log('LOGIN SUCCESS!!!')
                const msg_buffer = new TextEncoder().encode(`${who}`);
                const hash_buffer = await window.crypto.subtle.digest('SHA-256', msg_buffer);

                const hash_array = Array.from(new Uint8Array(hash_buffer));
                const hash_hex = hash_array.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log('hash_hex = ', hash_hex)

                var options = {
                    foreground: [255, 255, 255, 255],
                    background: [
                        randByte(hash_hex.slice(0, 20)),
                        randByte(hash_hex.slice(21, 40)),
                        randByte(hash_hex.slice(41, 60)),
                        255
                    ],
                    margin: 0.2,
                    size: 128,
                    format: 'png'
                };

                let data = new Identicon(hash_hex, options).toString();

                setUserIconData(data)
            }
        }

        if (!DEV) {
            useEffectAsync();
        }

    }, []);

    const [popupOptions, setPopupOptions] = useState(null);


    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = async () => {
        try {
            await logoutDepartment()
            window.location.href = '/login';
        } catch (err) {
            setPopupOptions({
                Heading: "Logout Failed",
                HeadingStyle: { background: "red", color: "white" },
                Message: `${err}`,
            });
        }
    }

    return (<>
        <Popup popupOptions={popupOptions} closeButtonActionHandler={() => setPopupOptions(null)} />


        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <CalendarMonthIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.2rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Home
                    </Typography>

                    <CalendarMonthIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
                    <Box gap={1} sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        {pages.map((page) => (
                            <Button
                                key={page}
                                onClick={() => { }}
                                sx={{ my: 1, color: 'white', display: 'block', backgroundColor: pageName === page ? '#00000032' : '' }}
                                href={`/${page}/`}
                            >
                                {page}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ flexGrow: 0 }}>
                        <Tooltip title="Open settings">
                            <IconButton onClick={setAnchorElUser} sx={{ p: 0 }}>
                                <Avatar
                                    alt="Logged In Department User Icon"
                                    src={`data:image/png;base64,${userIconData}`}
                                />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem
                                key={'Logout'}
                                onClick={async (e, next) => {
                                    console.log('logout')
                                    await handleLogout()
                                    handleCloseUserMenu(e, next)
                                }}
                            >
                                <Typography sx={{ textAlign: 'center' }}>{'Logout'}</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
        <Box minHeight={'0.25em'}></Box>
    </>);
}