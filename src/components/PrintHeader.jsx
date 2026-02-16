import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import {
    Box, Typography,
} from "@mui/material";

import "../assets/main.css";


import UNIVERSITY_LOGO from '../assets/cvsu-logo.png'

export function PrintHeader({isBlackAndWhite}) {
    return (<Box display={'flex'} width={'100%'} justifyContent={'center'} gap={5}>
        <Box >
            <img src={UNIVERSITY_LOGO} height={'90px'} style={{ filter: (isBlackAndWhite) ? 'grayscale(100%) contrast(120%)' : '' }} />
        </Box>
        <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
            <Typography lineHeight={'1.32rem'} variant="body1">Republic of the Philippines</Typography>
            <Typography lineHeight={'1.35rem'} variant="h5" fontWeight={'bold'}>Cavite State University</Typography>
            <Typography lineHeight={'1.3rem'} variant="h6">Silang Campus</Typography>
            <Typography lineHeight={'1.3rem'} variant="caption">Biga I, Silang, Cavite</Typography>
            <Typography lineHeight={'1rem'} variant="body2">(046)888-990 to 9904</Typography>
            <a href="mailto:cvsusilang@cvsu.edu.ph">cvsusilang@cvsu.edu.ph</a>
        </Box>
        <Box >
            <img src={UNIVERSITY_LOGO} height={'90px'} style={{ visibility: 'hidden' }} />
        </Box>
    </Box>);
}