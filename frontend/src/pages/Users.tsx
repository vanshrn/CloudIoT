import { useMemo, useState } from 'react';
import {
  Stack,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { Search, Add, EditOutlined, DeleteOutline } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/auth/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { RoleChip } from '@/components/StatusChip';
import UserFormDialog from '@/components/UserFormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import type { AppUser, UserRole } from '@/types/user';
import { tokens } from '@/theme/theme';

type RoleFilter = 'all' | UserRole;

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const { users, loading, addUser, updateUser, removeUser } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    return result;
  }, [users, search, roleFilter]);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await removeUser(deletingUser.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeletingUser(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage who has access to your organization and what they can do.
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog} sx={{ flexShrink: 0 }}>
            Add user
          </Button>
        )}
      </Stack>

      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { sm: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: tokens.text.tertiary }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}>
            <MenuItem value="all">All roles</MenuItem>
            <MenuItem value="Administrator">Administrator</MenuItem>
            <MenuItem value="Operator">Operator</MenuItem>
            <MenuItem value="Viewer">Viewer</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Results */}
      {loading ? (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Stack>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No users match your filters"
          description="Try adjusting your search term or role filter to see more users."
          actionLabel="Clear filters"
          onAction={resetFilters}
        />
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.accent.main, fontSize: '0.75rem' }}>
                        {initials(user.name)}
                      </Avatar>
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption">{user.email}</Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <RoleChip role={user.role} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {isAdmin && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditDialog(user)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeletingUser(user)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${tokens.surface.border}` }}>
            <Typography variant="caption">
              Showing {filtered.length} of {users.length} users
            </Typography>
          </Box>
        </Paper>
      )}

      <UserFormDialog
        open={formOpen}
        editingUser={editingUser}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => (editingUser ? updateUser(editingUser.id, input) : addUser(input))}
      />

      <ConfirmDialog
        open={!!deletingUser}
        loading={deleteLoading}
        title="Delete user?"
        description={`This permanently removes ${deletingUser?.name} from your organization. This can't be undone.`}
        confirmLabel="Delete user"
        destructive
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingUser(null)}
      />
    </Stack>
  );
}
