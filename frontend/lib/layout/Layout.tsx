'use client';

import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Person,
  AccountCircle,
  Settings,
  Logout,
} from '@mui/icons-material';
import { Sidebar } from './Sidebar';
import { useAuth } from '../auth/AuthProvider';
import { useRouter } from 'next/navigation';
import darkCyanTheme from '../themes/darkCyan';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchorEl);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0A1A1F',
        backgroundImage: `radial-gradient(ellipse at top, #0D2B2F 0%, #0A1A1F 70%)`,
      }}
    >
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'rgba(13, 43, 47, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: sidebarOpen && !isMobile ? 'calc(100% - 280px)' : '100%',
          ml: sidebarOpen && !isMobile ? '280px' : 0,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            px: 3,
          }}
        >
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{
                mr: 2,
                color: '#B2EBF2',
                '&:hover': {
                  color: '#00E5FF',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              color: '#E0F7FA',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            TRON Lock System
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton
              size="large"
              aria-label="show notifications"
              color="inherit"
              onClick={handleNotificationsOpen}
              sx={{
                color: '#B2EBF2',
                '&:hover': {
                  color: '#00E5FF',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                },
              }}
            >
              <Badge badgeContent={4} color="primary">
                <Notifications />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{
                color: '#B2EBF2',
                '&:hover': {
                  color: '#00E5FF',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#1A5D6B',
                  color: '#00E5FF',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarToggle}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: sidebarOpen && !isMobile ? 'calc(100% - 280px)' : '100%',
          ml: sidebarOpen && !isMobile ? 0 : 0,
          pt: 8,
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isMenuOpen}
        onClose={handleProfileMenuClose}
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
            router.push('/profile');
            handleProfileMenuClose();
          }}
          sx={{
            color: '#E0F7FA',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          <Person sx={{ mr: 2, color: '#B2EBF2' }} />
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push('/settings');
            handleProfileMenuClose();
          }}
          sx={{
            color: '#E0F7FA',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          <Settings sx={{ mr: 2, color: '#B2EBF2' }} />
          Settings
        </MenuItem>
        <Divider sx={{ borderColor: 'rgba(0, 229, 255, 0.2)' }} />
        <MenuItem
          onClick={handleLogout}
          sx={{
            color: '#E0F7FA',
            '&:hover': {
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
            },
          }}
        >
          <Logout sx={{ mr: 2, color: '#B2EBF2' }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isNotificationsOpen}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(13, 43, 47, 0.95)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            maxWidth: 360,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 229, 255, 0.2)' }}>
          <Typography sx={{ color: '#E0F7FA', fontWeight: 600 }}>
            Notifications
          </Typography>
        </Box>
        <MenuItem
          sx={{
            color: '#E0F7FA',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          New deposit detected
        </MenuItem>
        <MenuItem
          sx={{
            color: '#E0F7FA',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          Sweep completed successfully
        </MenuItem>
        <MenuItem
          sx={{
            color: '#E0F7FA',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          Override request pending approval
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Layout;