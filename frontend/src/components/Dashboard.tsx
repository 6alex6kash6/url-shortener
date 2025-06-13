import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { UrlShortener } from './UrlShortener';
import { UrlList } from './UrlList';

export const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          URL Shortener
        </Typography>

        <UrlShortener />
        <UrlList />
      </Box>
    </Container>
  );
};