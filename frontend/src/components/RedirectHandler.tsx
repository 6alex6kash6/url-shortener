import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const RedirectHandler: React.FC = () => {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const handleRedirect = () => {
      if (!shortUrl) {
        setError('Invalid URL');
        setRedirecting(false);
        return;
      }

      // Simply redirect to the backend URL which handles the redirect
      // The backend will increment click count and redirect to original URL
      window.location.href = `${API_BASE_URL}/${shortUrl}`;
    };

    // Add a small delay to show the loading state
    const timer = setTimeout(handleRedirect, 500);
    
    return () => clearTimeout(timer);
  }, [shortUrl]);

  if (redirecting) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="h6">Redirecting...</Typography>
        <Typography variant="body2" color="textSecondary">
          Taking you to your destination
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="50vh"
      gap={2}
    >
      <Typography variant="h4" color="error">
        {error}
      </Typography>
      <Typography variant="body1" color="textSecondary">
        The short URL "/{shortUrl}" could not be found or has expired.
      </Typography>
    </Box>
  );
};