'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  People,
  History,
  ArrowUpward,
  ArrowDownward,
  Warning,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';
import { Layout } from '@/lib/layout/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Sample data for charts
const depositData = [
  { name: 'Mon', deposits: 12, amount: 1200 },
  { name: 'Tue', deposits: 19, amount: 2300 },
  { name: 'Wed', deposits: 15, amount: 1800 },
  { name: 'Thu', deposits: 22, amount: 2800 },
  { name: 'Fri', deposits: 18, amount: 2100 },
  { name: 'Sat', deposits: 25, amount: 3200 },
  { name: 'Sun', deposits: 21, amount: 2600 },
];

const lotMaturityData = [
  { name: 'Week 1', locked: 45, eligible: 5, paid: 12 },
  { name: 'Week 2', locked: 52, eligible: 8, paid: 15 },
  { name: 'Week 3', locked: 48, eligible: 12, paid: 18 },
  { name: 'Week 4', locked: 61, eligible: 15, paid: 22 },
];

export default function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 1247,
    totalDeposits: 3421,
    totalPrincipal: 2847500,
    totalPayouts: 156,
    pendingOverrides: 3,
    opsWalletBalance: 1247.5,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'deposit',
      user: 'user_123456',
      amount: 150000000,
      status: 'confirmed',
      time: '2 minutes ago',
    },
    {
      id: 2,
      type: 'sweep',
      user: 'user_789012',
      amount: 100000000,
      status: 'completed',
      time: '5 minutes ago',
    },
    {
      id: 3,
      type: 'payout',
      user: 'user_345678',
      amount: 115000000,
      status: 'paid',
      time: '10 minutes ago',
    },
    {
      id: 4,
      type: 'referral',
      user: 'user_901234',
      amount: 0,
      status: 'qualified',
      time: '15 minutes ago',
    },
  ]);

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
        return <CheckCircle sx={{ color: '#00C853', fontSize: 16 }} />;
      case 'pending':
        return <AccessTime sx={{ color: '#FF6D00', fontSize: 16 }} />;
      case 'failed':
        return <Warning sx={{ color: '#FF5252', fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return '#00E5FF';
      case 'sweep':
        return '#1A5D6B';
      case 'payout':
        return '#00C853';
      case 'referral':
        return '#FF6D00';
      default:
        return '#B2EBF2';
    }
  };

  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header Section */}
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
            Dashboard Overview
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#B2EBF2',
              fontSize: '1rem',
            }}
          >
            Monitor your TRON Lock System performance and activity
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(13, 43, 47, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(0, 229, 255, 0.1)',
                      color: '#00E5FF',
                      width: 48,
                      height: 48,
                    }}
                  >
                    <People />
                  </Avatar>
                  <Chip
                    label="+12%"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(0, 200, 83, 0.2)',
                      color: '#00C853',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ color: '#E0F7FA', fontWeight: 600, mb: 1 }}>
                  {stats.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B2EBF2' }}>
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(13, 43, 47, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(0, 229, 255, 0.1)',
                      color: '#00E5FF',
                      width: 48,
                      height: 48,
                    }}
                  >
                    <AccountBalance />
                  </Avatar>
                  <Chip
                    label="+8%"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(0, 229, 255, 0.2)',
                      color: '#00E5FF',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ color: '#E0F7FA', fontWeight: 600, mb: 1 }}>
                  {stats.totalDeposits.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B2EBF2' }}>
                  Total Deposits
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(13, 43, 47, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(0, 200, 83, 0.1)',
                      color: '#00C853',
                      width: 48,
                      height: 48,
                    }}
                  >
                    <TrendingUp />
                  </Avatar>
                  <Chip
                    label="$2.8M"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(0, 200, 83, 0.2)',
                      color: '#00C853',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ color: '#E0F7FA', fontWeight: 600, mb: 1 }}>
                  ${formatAmount(stats.totalPrincipal)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B2EBF2' }}>
                  Total Principal Locked
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(13, 43, 47, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 109, 0, 0.1)',
                      color: '#FF6D00',
                      width: 48,
                      height: 48,
                    }}
                  >
                    <History />
                  </Avatar>
                  <Chip
                    label="3 pending"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 109, 0, 0.2)',
                      color: '#FF6D00',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ color: '#E0F7FA', fontWeight: 600, mb: 1 }}>
                  {stats.pendingOverrides}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B2EBF2' }}>
                  Override Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                backgroundColor: 'rgba(13, 43, 47, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#E0F7FA',
                    fontWeight: 600,
                    mb: 3,
                    letterSpacing: '0.02em',
                  }}
                >
                  Weekly Deposits
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={depositData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 229, 255, 0.1)" />
                      <XAxis dataKey="name" stroke="#B2EBF2" fontSize={12} />
                      <YAxis stroke="#B2EBF2" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(13, 43, 47, 0.95)',
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                          borderRadius: 8,
                          backdropFilter: 'blur(10px)',
                        }}
                        labelStyle={{ color: '#E0F7FA', fontWeight: 600 }}
                        itemStyle={{ color: '#B2EBF2' }}
                      />
                      <Bar dataKey="deposits" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                backgroundColor: 'rgba(13, 43, 47, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#E0F7FA',
                    fontWeight: 600,
                    mb: 3,
                    letterSpacing: '0.02em',
                  }}
                >
                  Lot Maturity Status
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lotMaturityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 229, 255, 0.1)" />
                      <XAxis dataKey="name" stroke="#B2EBF2" fontSize={12} />
                      <YAxis stroke="#B2EBF2" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(13, 43, 47, 0.95)',
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                          borderRadius: 8,
                          backdropFilter: 'blur(10px)',
                        }}
                        labelStyle={{ color: '#E0F7FA', fontWeight: 600 }}
                        itemStyle={{ color: '#B2EBF2' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="locked"
                        stroke="#FF6D00"
                        strokeWidth={2}
                        dot={{ fill: '#FF6D00', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="eligible"
                        stroke="#00C853"
                        strokeWidth={2}
                        dot={{ fill: '#00C853', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="paid"
                        stroke="#00E5FF"
                        strokeWidth={2}
                        dot={{ fill: '#00E5FF', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Card
          sx={{
            backgroundColor: 'rgba(13, 43, 47, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#E0F7FA',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                Recent Activity
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  borderColor: 'rgba(0, 229, 255, 0.5)',
                  color: '#00E5FF',
                  '&:hover': {
                    borderColor: '#00E5FF',
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  },
                }}
              >
                View All
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentActivity.map((activity) => (
                <Box
                  key={activity.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'rgba(0, 229, 255, 0.05)',
                    borderRadius: 1,
                    borderLeft: `4px solid ${getActivityColor(activity.type)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 229, 255, 0.1)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: `${getActivityColor(activity.type)}20`,
                        color: getActivityColor(activity.type),
                        mr: 2,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {activity.user.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: '#E0F7FA', fontWeight: 500 }}>
                        {activity.type === 'deposit' && 'New Deposit'}
                        {activity.type === 'sweep' && 'Sweep Completed'}
                        {activity.type === 'payout' && 'Payout Processed'}
                        {activity.type === 'referral' && 'Referral Qualified'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#B2EBF2' }}>
                        {activity.user} • {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {activity.amount > 0 && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#E0F7FA',
                          fontWeight: 600,
                          fontFamily: '"Roboto Mono", monospace',
                        }}
                      >
                        ${formatAmount(activity.amount)} USDT
                      </Typography>
                    )}
                    {getStatusIcon(activity.status)}
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}