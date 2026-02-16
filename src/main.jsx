import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Box, ThemeProvider, Typography } from '@mui/material'

import './assets/main.css'
import { MainHeader } from './components/Header.jsx'
import theme from './components/Theme.jsx'

import UNIVERSITY_LOGO from './assets/cvsu-logo.png'

function App() {
    return (
        <>
            <MainHeader />
            <Box display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'center'} height={'80vh'}>
                <img src={UNIVERSITY_LOGO} height={'150px'}/>
                <Typography variant='body1' fontWeight={'bold'} color='green'>Cavite State University - Silang Campus</Typography>
                <Typography variant='h6' marginTop={2}>Subject Scheduling System Using Genetic Algorithm</Typography>
            </Box>
        </>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </StrictMode>,
)
