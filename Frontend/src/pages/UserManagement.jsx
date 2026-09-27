// UserManagement.jsx - API-Oriented with Mobile Responsive Design
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, CheckCircle, XCircle, 
  User, Mail, Shield, Clock, Edit2, Trash2,
  UserPlus, ArrowLeft, Building, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const UserManagement = ({ setActiveView }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'deactivate' or 'delete'
  const [selectedUser, setSelectedUser] = useState(null);

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';

  const { addNotification } = useNotifications();

  // ============================================================
  // LOAD USERS FROM API
  // ============================================================
  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await userService.getAllUsers();
      
      let filteredUsers = allUsers || [];
      
      if (isOwner && user?.tenantId) {
        filteredUsers = allUsers.filter(u => 
          u.tenantId === user?.tenantId || 
          (u.role === 'SALES' || u.role === 'TAILOR')
        );
      }
      
      filteredUsers = filteredUsers.filter(u => u.email !== user?.email);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================================================
  // OPEN MODAL
  // ============================================================
  const openModal = (type, user) => {
    setModalType(type);
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setModalType('');
  };

  // ============================================================
  // CONFIRM ACTION
  // ============================================================
  const confirmAction = async () => {
    if (!selectedUser) return;

    if (modalType === 'deactivate') {
      await handleDeactivate(selectedUser.id);
    } else if (modalType === 'delete') {
      await handleDelete(selectedUser.id);
    }
    closeModal();
  };

  // ============================================================
  // ACTIVATE USER
  // ============================================================
  const handleActivate = async (userId) => {
    try {
      const userToActivate = users.find(u => u.id === userId);
      const result = await userService.activateUser(userId);
      
      if (result.success) {
        toast.success(`✅ ${userToActivate?.name || 'User'} activated successfully!`);
        
        if (addNotification) {
          addNotification(
            `✅ User ${userToActivate?.name || 'Unknown'} (${userToActivate?.email}) was activated by ${user?.name || 'System'}`,
            'security',
            '/userManagement',
            user?.email
          );
        }
        loadUsers();
      } else {
        toast.error(`❌ Failed to activate user: ${result.error}`);
      }
    } catch (error) {
      toast.error(`❌ Error activating user: ${error.message}`);
    }
  };

  // ============================================================
  // DEACTIVATE USER
  // ============================================================
  const handleDeactivate = async (userId) => {
    try {
      const userToDeactivate = users.find(u => u.id === userId);
      const result = await userService.deactivateUser(userId);
      
      if (result.success) {
        toast.success(`⚠️ ${userToDeactivate?.name || 'User'} deactivated`);
        
        if (addNotification) {
          addNotification(
            `⚠️ User ${userToDeactivate?.name || 'Unknown'} (${userToDeactivate?.email}) was deactivated by ${user?.name || 'System'}`,
            'security',
            '/userManagement',
            user?.email
          );
        }
        loadUsers();
      } else {
        toast.error(`❌ Failed to deactivate user: ${result.error}`);
      }
    } catch (error) {
      toast.error(`❌ Error deactivating user: ${error.message}`);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================
  const handleDelete = async (userId) => {
    if (!isAdmin && !isOwner) {
      toast.error('Only Admin or Owner can delete users');
      return;
    }
    
    const userToDelete = users.find(u => u.id === userId);
    
    if (isOwner) {
      if (userToDelete && (userToDelete.role === 'ADMIN' || userToDelete.role === 'OWNER')) {
        toast.error('❌ You cannot delete Admin or other Owner accounts');
        return;
      }
    }
    
    try {
      const result = await userService.deleteUser(userId);
      
      if (result.success) {
        toast.success(`🗑️ ${userToDelete?.name || 'User'} deleted permanently`);
        
        if (addNotification) {
          addNotification(
            `🗑️ User ${userToDelete?.name || 'Unknown'} (${userToDelete?.email}) was permanently deleted by ${user?.name || 'System'}`,
            'security',
            '/userManagement',
            user?.email
          );
        }
        loadUsers();
      } else {
        toast.error(`❌ Failed to delete user: ${result.error}`);
      }
    } catch (error) {
      toast.error(`❌ Error deleting user: ${error.message}`);
    }
  };

  // ============================================================
  // FILTER USERS
  // ============================================================
  const getFilteredUsers = () => {
    let filtered = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole.toUpperCase());
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus.toUpperCase());
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const roles = ['ADMIN', 'OWNER', 'SALES', 'TAILOR'];
  const statuses = ['ACTIVE', 'PENDING', 'INACTIVE'];

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const pendingUsers = users.filter(u => u.status === 'PENDING').length;
  const inactiveUsers = users.filter(u => u.status === 'INACTIVE').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ============================================================
  // CONFIRMATION MODAL - Mobile Friendly
  // ============================================================
  const ConfirmationModal = () => {
    if (!modalOpen || !selectedUser) return null;

    const isDeactivate = modalType === 'deactivate';
    const title = isDeactivate ? 'Deactivate User' : 'Delete User';
    const icon = isDeactivate ? 
      <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-2 sm:mb-3" /> : 
      <Trash2 className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-2 sm:mb-3" />;
    const message = isDeactivate ? 
      `Are you sure you want to deactivate ${selectedUser.name}? They will no longer be able to login.` :
      `Are you sure you want to permanently delete ${selectedUser.name}? This action cannot be undone.`;
    const confirmColor = isDeactivate ? 
      'bg-amber-500 hover:bg-amber-600 active:bg-amber-700' : 
      'bg-red-500 hover:bg-red-600 active:bg-red-700';
    const confirmText = isDeactivate ? 'Deactivate' : 'Delete';

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      >
        <div 
          className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            {icon}
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">{message}</p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={closeModal}
                className="w-full sm:flex-1 py-2.5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-medium transition text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`w-full sm:flex-1 py-2.5 sm:py-2.5 text-white rounded-xl font-medium transition text-sm sm:text-base order-1 sm:order-2 ${confirmColor}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-0 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-xl font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500 shrink-0" />
              <span className="truncate">User Management</span>
            </h2>
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">
              {isAdmin ? 'Manage all users in the system' : 'Manage your team members'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={loadUsers}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
          </button>
          <span className="text-[9px] sm:text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-gray-600 whitespace-nowrap">
            {totalUsers} users
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Total</p>
          <p className="text-sm sm:text-xl font-bold">{totalUsers}</p>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Active</p>
          <p className="text-sm sm:text-xl font-bold text-green-600">{activeUsers}</p>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Pending</p>
          <p className="text-sm sm:text-xl font-bold text-amber-600">{pendingUsers}</p>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Inactive</p>
          <p className="text-sm sm:text-xl font-bold text-red-600">{inactiveUsers}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-2 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-gray-500">No users found</p>
            <p className="text-xs sm:text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[8px] sm:text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[8px] sm:text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-[8px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-[8px] sm:text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-[8px] sm:text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[8px] sm:text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-linear-to-br from-rose-100 to-rose-200 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-[10px] sm:text-sm truncate max-w-[60px] sm:max-w-none">
                            {u.name || 'Unnamed'}
                          </p>
                          <p className="text-[8px] sm:text-xs text-gray-400 truncate max-w-[60px] sm:max-w-none">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`text-[7px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'SALES' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`text-[7px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                        u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        u.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {u.status === 'INACTIVE' ? 'Inactive' : u.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[8px] sm:text-xs text-gray-500 truncate max-w-[80px]">
                      {u.tenantName || '-'}
                    </td>
                    <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[8px] sm:text-xs text-gray-500 whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
                        {/* Activate Button */}
                        {(u.status === 'PENDING' || u.status === 'INACTIVE') && (isAdmin || isOwner) && (
                          <button
                            onClick={() => handleActivate(u.id)}
                            className="p-1 sm:p-1.5 bg-green-100 hover:bg-green-200 active:bg-green-300 rounded-lg text-green-600 transition"
                            title="Activate user"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        
                        {/* Deactivate Button */}
                        {u.status === 'ACTIVE' && (isAdmin || isOwner) && (
                          <button
                            onClick={() => openModal('deactivate', u)}
                            className="p-1 sm:p-1.5 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 rounded-lg text-amber-600 transition"
                            title="Deactivate user"
                          >
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        {(isAdmin || isOwner) && (
                          <button
                            onClick={() => openModal('delete', u)}
                            className="p-1 sm:p-1.5 bg-red-100 hover:bg-red-200 active:bg-red-300 rounded-lg text-red-600 transition"
                            title="Delete user permanently"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal />
    </div>
  );
};