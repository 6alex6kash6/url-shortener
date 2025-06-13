import React, { useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { urlApi } from '../services/api';
import { toast } from 'react-toastify';

export const UrlList: React.FC = () => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<'info' | 'analytics' | null>(null);
  const queryClient = useQueryClient();

  // Fetch all URLs from backend
  const { data: urlsResponse, isLoading, error } = useQuery({
    queryKey: ['urls'],
    queryFn: urlApi.getAllUrls,
  });

  const deleteMutation = useMutation({
    mutationFn: urlApi.deleteUrl,
    onSuccess: () => {
      toast.success('URL deleted successfully');
      // Refresh the URLs list
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete URL');
    },
  });

  const { data: urlInfo } = useQuery({
    queryKey: ['urlInfo', selectedUrl],
    queryFn: () => selectedUrl ? urlApi.getUrlInfo(selectedUrl) : null,
    enabled: !!selectedUrl && dialogType === 'info',
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', selectedUrl],
    queryFn: () => selectedUrl ? urlApi.getAnalytics(selectedUrl) : null,
    enabled: !!selectedUrl && dialogType === 'analytics',
  });

  const handleDelete = (shortUrl: string) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      deleteMutation.mutate(shortUrl);
    }
  };

  const handleOpenDialog = (type: 'info' | 'analytics', shortUrl: string) => {
    setSelectedUrl(shortUrl);
    setDialogType(type);
  };

  const handleCloseDialog = () => {
    setSelectedUrl(null);
    setDialogType(null);
  };

  const handleShortUrlClick = (shortUrl: string) => {
    // Navigate to the short URL which will trigger the redirect
    window.location.href = `/${shortUrl}`;
  };

  const urls = urlsResponse?.data || [];

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Your URLs
        </Typography>
        <Typography>Loading...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Your URLs
        </Typography>
        <Typography color="error">Failed to load URLs</Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Your URLs
        </Typography>

        {urls.length === 0 ? (
          <Typography color="textSecondary">
            No URLs created yet. Create your first short URL above!
          </Typography>
        ) : (
          <List>
            {urls.map((url) => (
              <ListItem
                key={url.shortUrl}
                secondaryAction={
                  <Box>
                    <IconButton onClick={() => handleOpenDialog('info', url.shortUrl)}>
                      <InfoIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('analytics', url.shortUrl)}>
                      <AnalyticsIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(url.shortUrl)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Link
                        component="button"
                        variant="body1"
                        onClick={() => handleShortUrlClick(url.shortUrl)}
                        sx={{ 
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          cursor: 'pointer',
                          fontWeight: 'medium'
                        }}
                      >
                        {window.location.origin}/{url.shortUrl}
                      </Link>
                      <Typography variant="body2" color="textSecondary">
                        ({url.clickCount} clicks)
                      </Typography>
                    </Stack>
                  }
                  secondary={url.originalUrl}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={dialogType === 'info'} onClose={handleCloseDialog}>
        <DialogTitle>URL Information</DialogTitle>
        <DialogContent>
          {urlInfo?.data && (
            <Box>
              <Typography>Original URL: {urlInfo.data.originalUrl}</Typography>
              <Typography>Created: {new Date(urlInfo.data.createdAt).toLocaleString()}</Typography>
              <Typography>Clicks: {urlInfo.data.clickCount}</Typography>
              {urlInfo.data.expiresAt && (
                <Typography>Expires: {new Date(urlInfo.data.expiresAt).toLocaleString()}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogType === 'analytics'} onClose={handleCloseDialog}>
        <DialogTitle>URL Analytics</DialogTitle>
        <DialogContent>
          {analytics?.data && (
            <Box>
              <Typography>Total Clicks: {analytics.data.clickCount}</Typography>
              <Typography sx={{ mt: 2 }}>Recent IP Addresses:</Typography>
              <List>
                {analytics.data.lastIpAddresses.map((ip, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={ip} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};