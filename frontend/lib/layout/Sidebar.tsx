'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Tooltip,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  ArrowDownward,
  ArrowUpward,
  BarChart,
  History,
  Settings,
  Menu,
  MenuOpen,
  Person,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Person />,
    path: '/users',
  },
  {
    id: 'deposits',
    label: 'Deposits',
    icon: <AccountBalance />,
    path: '/deposits',
  },
  {
    id: 'lots',
    label: 'Lock Lots',
    icon: <History />,
    path: '/lots',
  },
  {
    id: 'payouts',
    label: 'Payouts',
    icon: <ArrowUpward />,
    path: '/payouts',
  },
  {
    id: 'sweeps',
    label: 'Sweeps',
    icon: <ArrowDownward />,
    path: '/sweeps',
  },
  {
    id: 'overrides',
    label: 'Overrides',
    icon: <Settings />,
    path: '/overrides',
  },
];

const adminNavItems: NavItem[] = [
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    icon: <Settings />,
    path: '/admin/settings',
  },
];

const clientNavItems: NavItem[] = [
  {
    id: 'client-dashboard',
    label: 'My Dashboard',
    icon: <Dashboard />,
    path: '/client/dashboard',
  },
  {
    id: 'client-deposits',
    label: 'My Deposits',
    icon: <AccountBalance />,
    path: '/client/deposits',
  },
  {
    id: 'client-payouts',
    label: 'My Payouts',
    icon: <ArrowUpward />,
    path: '/client/payouts',
  },
  {
    id: 'client-referrals',
    label: 'Referrals',
    icon: <BarChart />,
    path: '/client/referrals',
  },
  {
    id: 'client-history',
    label: 'Transaction History',
    icon: <History />,
    path: '/client/history',
  },
];

const bottomNavItems: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    path: '/settings',
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'temporary' | 'permanent';
}

export function Sidebar({ open, onClose, variant }: SidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const drawerWidth = collapsed ? 80 : 280;

  const handleNavClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleToggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isItemActive = isActive(item.path);

    return (
      <React.Fragment key={item.id}>
        <ListItem
          disablePadding
          sx={{
            display: 'block',
            mb: 0.5,
          }}
        >
          <Tooltip
            title={collapsed ? item.label : ''}
            placement="right"
            arrow
          >
            <ListItemButton
              onClick={() => {
                if (hasChildren) {
                  handleToggleExpand(item.id);
                } else {
                  handleNavClick(item.path);
                }
              }}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 2.5,
                position: 'relative',
                borderRadius: 1,
                backgroundColor: isItemActive
                  ? 'rgba(0, 229, 255, 0.1)'
                  : 'transparent',
                color: isItemActive ? '#00E5FF' : '#B2EBF2',
                '&:hover': {
                  backgroundColor: 'rgba(0, 229, 255, 0.05)',
                  color: '#00E5FF',
                },
                '&::before': isItemActive
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      backgroundColor: '#00E5FF',
                      borderRadius: '0 2px 2px 0',
                    }
                  : {},
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 3,
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isItemActive ? 600 : 500,
                    fontSize: '0.875rem',
                    letterSpacing: '0.02em',
                  }}
                />
              )}
              {!collapsed && hasChildren && (
                <Box
                  component="span"
                  sx={{
                    ml: 'auto',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <Menu />
                </Box>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List
              component="div"
              disablePadding
              sx={{ pl: 4 }}
            >
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0D2B2F',
        backgroundImage: `linear-gradient(180deg, #0D2B2F 0%, #0A1A1F 100%)`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 64,
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
        }}
      >
        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              color: '#00E5FF',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            TRON Lock
          </Typography>
        )}
        <IconButton
          onClick={handleToggleCollapse}
          sx={{
            color: '#B2EBF2',
            '&:hover': {
              color: '#00E5FF',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          }}
        >
          {collapsed ? <Menu /> : <MenuOpen />}
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
        <List>
          {navItems.map((item) => renderNavItem(item))}
        </List>
      </Box>

      {/* Bottom Section */}
      <Box
        sx={{
          borderTop: '1px solid rgba(0, 229, 255, 0.2)',
          p: 2,
        }}
      >
        {/* User Profile */}
        {user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                borderRadius: 1,
              },
            }}
            onClick={() => handleNavClick('/profile')}
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
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            {!collapsed && (
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#E0F7FA',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                  noWrap
                >
                  {user.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#78909C' }}
                >
                  {user.role}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Bottom Navigation Items */}
        <List>
          {bottomNavItems.map((item) => renderNavItem(item))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 229, 255, 0.2)',
          backgroundColor: 'transparent',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export default Sidebar;