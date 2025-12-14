'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  useTheme,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Person,
  ContentCopy,
  Edit,
  Block,
  CheckCircle,
  History,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Layout } from '@/lib/layout/Layout';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  depositAddress: string;
  payoutAddress?: string;
  referralCode: string;
  referredByUserId?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  totalDeposits: number;
  totalPrincipal: number;
  activeLots: number;
  totalReferrals: number;
}

export default function Users() {
  const theme = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  // Sample users data
  const sampleUsers: User[] = [
    {
      id: '1',
      telegramUserId: '123456789',
      username: 'crypto_user_1',
      firstName: 'John',
      lastName: 'Doe',
      depositAddress: 'TXYZ1234567890abcdef',
      payoutAddress: 'TABC1234567890abcdef',
      referralCode: 'REF123',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      totalDeposits: 5,
      totalPrincipal: 500000000,
      activeLots: 3,
      totalReferrals: 2,
    },
    {
      id: '2',
      telegramUserId: '987654321',
      username: 'defi_enthusiast',
      firstName: 'Jane',
      lastName: 'Smith',
      depositAddress: 'TDEF1234567890abcdef',
      payoutAddress: 'TGHI1234567890abcdef',
      referralCode: 'REF456',
      status: 'active',
      createdAt: '2024-01-14T15:45:00Z',
      updatedAt: '2024-01-14T15:45:00Z',
      totalDeposits: 3,
      totalPrincipal: 300000000,
      activeLots: 2,
      totalReferrals: 1,
    },
    {
      id: '3',
      telegramUserId: '555666777',
      username: 'tron_master',
      firstName: 'Bob',
      lastName: 'Johnson',
      depositAddress: 'TJKL1234567890abcdef',
      payoutAddress: undefined,
      referralCode: 'REF789',
      status: 'active',
      createdAt: '2024-01-13T08:20:00Z',
      updatedAt: '2024-01-13T08:20:00Z',
      totalDeposits: 8,
      totalPrincipal: 800000000,
      activeLots: 5,
      totalReferrals: 4,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(sampleUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.telegramUserId.includes(searchTerm) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.depositAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.referralCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopySuccess('Address copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const user = params.row as User;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                color: '#00E5FF',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {user.username?.charAt(0).toUpperCase() || user.telegramUserId.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: '#E0F7FA', fontWeight: 500 }}>
                {user.username || `User ${user.telegramUserId}`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#78909C' }}>
                {user.telegramUserId}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'depositAddress',
      headerName: 'Deposit Address',
      width: 300,
      renderCell: (params: GridRenderCellParams) => {
        const address = params.value as string;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#80DEEA',
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.75rem',
              }}
              className="mono"
            >
              {address.substring(0, 8)}...{address.substring(address.length - 6)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleCopyAddress(address)}
              sx={{
                color: '#B2EBF2',
                '&:hover': {
                  color: '#00E5FF',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                },
              }}
            >
              <ContentCopy sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        );
      },
    },
    {
      field: 'totalDeposits',
      headerName: 'Deposits',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#E0F7FA', fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'totalPrincipal',
      headerName: 'Principal',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            color: '#E0F7FA',
            fontWeight: 500,
            fontFamily: '"Roboto Mono", monospace',
          }}
          className="mono"
        >
          ${(params.value as number / 1000000).toFixed(0)}
        </Typography>
      ),
    },
    {
      field: 'activeLots',
      headerName: 'Active Lots',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: 'rgba(0, 229, 255, 0.2)',
            color: '#00E5FF',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'totalReferrals',
      headerName: 'Referrals',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#E0F7FA', fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor:
              params.value === 'active'
                ? 'rgba(0, 200, 83, 0.2)'
                : 'rgba(255, 82, 82, 0.2)',
            color:
              params.value === 'active'
                ? '#00C853'
                : '#FF5252',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#B2EBF2', fontSize: '0.75rem' }}>
          {new Date(params.value as string).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, params.row as User)}
          sx={{
            color: '#B2EBF2',
            '&:hover': {
              color: '#00E5FF',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              color: '#E0F7FA',
              fontWeight: 600,
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            User Management
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#B2EBF2',
              fontSize: '1rem',
            }}
          >
            Manage system users and their activity
          </Typography>
        </Box>

        {/* Filters */}
        <Card
          sx={{
            backgroundColor: 'rgba(13, 43, 47, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by Telegram ID, username, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#B2EBF2' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
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
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#B2EBF2', '&.Mui-focused': { color: '#00E5FF' } }}>
                    Status
                  </InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    label="Status"
                    sx={{
                      backgroundColor: 'rgba(13, 43, 47, 0.6)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      borderRadius: 2,
                      color: '#E0F7FA',
                      '& .MuiSelect-icon': {
                        color: '#B2EBF2',
                      },
                      '&:hover': {
                        borderColor: 'rgba(0, 229, 255, 0.5)',
                      },
                      '&.Mui-focused': {
                        borderColor: '#00E5FF',
                      },
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: 'rgba(0, 229, 255, 0.5)',
                    color: '#00E5FF',
                    '&:hover': {
                      borderColor: '#00E5FF',
                      backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    },
                  }}
                >
                  Export Data
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card
          sx={{
            backgroundColor: 'rgba(13, 43, 47, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              loading={loading}
              pagination
              paginationMode="client"
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 25,
                  },
                },
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
                },
                '& .MuiDataGrid-columnHeader': {
                  color: '#E0F7FA',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-cell': {
                  color: '#E0F7FA',
                  borderBottom: '1px solid rgba(0, 229, 255, 0.1)',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: 'rgba(0, 229, 255, 0.05)',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  backgroundColor: 'rgba(0, 229, 255, 0.05)',
                  borderTop: '1px solid rgba(0, 229, 255, 0.2)',
                },
              }}
            />
          </Box>
        </Card>

        {/* User Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(13, 43, 47, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                router.push(`/users/${selectedUser.id}`);
              }
              handleMenuClose();
            }}
            sx={{
              color: '#E0F7FA',
              '&:hover': {
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
              },
            }}
          >
            <Edit sx={{ mr: 2, color: '#B2EBF2' }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedUser && selectedUser.payoutAddress) {
                handleCopyAddress(selectedUser.payoutAddress);
              }
              handleMenuClose();
            }}
            disabled={!selectedUser?.payoutAddress}
            sx={{
              color: '#E0F7FA',
              '&:hover': {
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
              },
              '&.Mui-disabled': {
                color: '#78909C',
              },
            }}
          >
            <ContentCopy sx={{ mr: 2, color: '#B2EBF2' }} />
            Copy Payout Address
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                router.push(`/users/${selectedUser.id}/history`);
              }
              handleMenuClose();
            }}
            sx={{
              color: '#E0F7FA',
              '&:hover': {
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
              },
            }}
          >
            <History sx={{ mr: 2, color: '#B2EBF2' }} />
              View History
          </MenuItem>
          <MenuItem
            onClick={() => {
              // Handle suspend/activate
              handleMenuClose();
            }}
            sx={{
              color: selectedUser?.status === 'active' ? '#FF5252' : '#00C853',
              '&:hover': {
                backgroundColor: selectedUser?.status === 'active' 
                  ? 'rgba(255, 82, 82, 0.1)' 
                  : 'rgba(0, 200, 83, 0.1)',
              },
            }}
          >
            {selectedUser?.status === 'active' ? (
              <Block sx={{ mr: 2 }} />
            ) : (
              <CheckCircle sx={{ mr: 2 }} />
            )}
            {selectedUser?.status === 'active' ? 'Suspend User' : 'Activate User'}
          </MenuItem>
        </Menu>

        {/* Copy Success Snackbar */}
        {copySuccess && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              backgroundColor: 'rgba(0, 200, 83, 0.9)',
              color: '#E0F7FA',
              padding: '12px 24px',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 200, 83, 0.3)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
            }}
          >
            {copySuccess}
          </Box>
        )}
      </Box>
    </Layout>
  );
}