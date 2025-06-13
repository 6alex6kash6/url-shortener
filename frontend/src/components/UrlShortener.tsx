import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import { urlApi, type CreateUrlData } from '../services/api';
import { toast } from 'react-toastify';

export const UrlShortener: React.FC = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUrlData>();

  const createMutation = useMutation({
    mutationFn: urlApi.createShortUrl,
    onSuccess: () => {
      toast.success('Short URL created successfully!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create short URL');
    },
  });

  const onSubmit = (data: CreateUrlData) => {
    createMutation.mutate(data);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Short URL
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Original URL"
          {...register('originalUrl', {
            required: 'URL is required',
            pattern: {
              value: /^https?:\/\/.+/,
              message: 'Please enter a valid URL'
            }
          })}
          error={!!errors.originalUrl}
          helperText={errors.originalUrl?.message}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Custom Alias (optional)"
          {...register('alias', {
            maxLength: {
              value: 20,
              message: 'Alias must be 20 characters or less'
            }
          })}
          error={!!errors.alias}
          helperText={errors.alias?.message}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Expiration Date (optional)"
          type="datetime-local"
          {...register('expiresAt')}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={createMutation.isPending}
        >
          Create Short URL
        </Button>
      </Box>

      {createMutation.isSuccess && createMutation.data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Short URL: {createMutation.data.data.shortUrl}
        </Alert>
      )}
    </Paper>
  );
};