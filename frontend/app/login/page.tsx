'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Shield,
} from '@mui/icons-material';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    totpCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
    setError('');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password, formData.totpCode);
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      
      if (errorMessage.includes('TOTP code required')) {
        setRequiresTotp(true);
        setError('Please enter your 2FA code');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A1A1F',
        backgroundImage: `radial-gradient(ellipse at top, #0D2B2F 0%, #0A1A1F 70%)`,
        p: 2,
      }}
    >
      <Card
        sx={{
          backgroundColor: 'rgba(13, 43, 47, 0.8)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 229, 255, 0.3)',
          backdropFilter: 'blur(20px)',
          maxWidth: 420,
          width: '100%',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 4, position: 'relative' }}>
          {/* Logo/Icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                color: '#00E5FF',
                border: '2px solid rgba(0, 229, 255, 0.3)',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
              }}
            >
              <Lock sx={{ fontSize: 40 }} />
            </Avatar>
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              color: '#E0F7FA',
              fontWeight: 600,
              textAlign: 'center',
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            TRON Lock System
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#B2EBF2',
              textAlign: 'center',
              mb: 3,
              fontSize: '0.875rem',
            }}
          >
            Admin Dashboard Login
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(255, 82, 82, 0.1)',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                color: '#FF5252',
                '& .MuiAlert-icon': {
                  color: '#FF5252',
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {/* Email Field */}
            <TextField
              fullWidth
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              autoFocus
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#B2EBF2' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(13, 43, 47, 0.6)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(0, 229, 255, 0.5)',
                    backgroundColor: 'rgba(13, 43, 47, 0.8)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#00E5FF',
                    backgroundColor: 'rgba(13, 43, 47, 0.9)',
                    boxShadow: '0 0 0 3px rgba(0, 229, 255, 0.2)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#E0F7FA',
                  '&::placeholder': {
                    color: '#78909C',
                  },
                },
                '& .MuiFormLabel-root': {
                  color: '#B2EBF2',
                  '&.Mui-focused': {
                    color: '#00E5FF',
                  },
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#B2EBF2' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      sx={{
                        color: '#B2EBF2',
                        '&:hover': {
                          color: '#00E5FF',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(13, 43, 47, 0.6)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(0, 229, 255, 0.5)',
                    backgroundColor: 'rgba(13, 43, 47, 0.8)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#00E5FF',
                    backgroundColor: 'rgba(13, 43, 47, 0.9)',
                    boxShadow: '0 0 0 3px rgba(0, 229, 255, 0.2)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#E0F7FA',
                  '&::placeholder': {
                    color: '#78909C',
                  },
                },
                '& .MuiFormLabel-root': {
                  color: '#B2EBF2',
                  '&.Mui-focused': {
                    color: '#00E5FF',
                  },
                },
              }}
            />

            {/* TOTP Field (shown if required) */}
            {requiresTotp && (
              <TextField
                fullWidth
                id="totpCode"
                label="2FA Code"
                type="text"
                value={formData.totpCode}
                onChange={handleChange('totpCode')}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Shield sx={{ color: '#B2EBF2' }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="Enter 6-digit code"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(13, 43, 47, 0.6)',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(0, 229, 255, 0.5)',
                      backgroundColor: 'rgba(13, 43, 47, 0.8)',
                    },
                    '&.Mui-focused': {
                      borderColor: '#00E5FF',
                      backgroundColor: 'rgba(13, 43, 47, 0.9)',
                      boxShadow: '0 0 0 3px rgba(0, 229, 255, 0.2)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#E0F7FA',
                    '&::placeholder': {
                      color: '#78909C',
                    },
                  },
                  '& .MuiFormLabel-root': {
                    color: '#B2EBF2',
                    '&.Mui-focused': {
                      color: '#00E5FF',
                    },
                  },
                }}
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #00B8D4 0%, #00838F 100%)',
                color: '#0A1A1F',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 229, 255, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)',
                  boxShadow: '0 8px 24px rgba(0, 229, 255, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(120, 144, 156, 0.2)',
                  color: '#78909C',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#0A1A1F' }} />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3, borderColor: 'rgba(0, 229, 255, 0.2)' }} />

          {/* Footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: '#78909C',
                fontSize: '0.75rem',
              }}
            >
              Secure admin dashboard for TRON Lock System
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}