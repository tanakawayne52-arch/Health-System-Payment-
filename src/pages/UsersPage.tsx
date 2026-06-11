import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { getUsers, saveUsers, getAuditLogs, saveAuditLogs } from '@/data/seed';
import Badge from '@/components/Badge';
import { ROLE_LABELS } from '@/types';
import type { User } from '@/types';
import { UserPlus, Pencil, Eye, X, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>(getUsers());
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleToggleActive = (u: User) => {
    const updated = users.map(user => user.id === u.id ? { ...user, isActive: !user.isActive } : user);
    setUsers(updated);
    saveUsers(updated);
    const logs = getAuditLogs();
    logs.unshift({
      id: `a${Date.now()}`, userId: 'u4', userName: 'Sarah Ncube', userRole: 'national_admin',
      action: 'EDIT', entityType: 'User', entityId: u.id,
      oldValues: { isActive: u.isActive }, newValues: { isActive: !u.isActive },
      reason: null, ipAddress: '192.168.1.40', timestamp: new Date().toISOString(),
    });
    saveAuditLogs(logs);
    addToast(`User ${u.isActive ? 'deactivated' : 'activated'}`, 'success');
  };

  const handleDelete = (u: User) => {
    if (window.confirm(`Are you sure you want to delete user ${u.fullName}?`)) {
      const updated = users.filter(user => user.id !== u.id);
      setUsers(updated);
      saveUsers(updated);
      const logs = getAuditLogs();
      logs.unshift({
        id: `a${Date.now()}`, userId: 'u4', userName: 'Sarah Ncube', userRole: 'national_admin',
        action: 'DELETE', entityType: 'User', entityId: u.id,
        oldValues: u as unknown as Record<string, unknown>, newValues: null,
        reason: null, ipAddress: '192.168.1.40', timestamp: new Date().toISOString(),
      });
      saveAuditLogs(logs);
      addToast(`User ${u.fullName} deleted`, 'success');
    }
  };

  const handleSave = (formData: Partial<User>) => {
    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u);
      setUsers(updated);
      saveUsers(updated);
      addToast('User updated', 'success');
    } else {
      const newUser: User = {
        id: `u${Date.now()}`, email: formData.email || '', fullName: formData.fullName || '',
        role: formData.role || 'provincial_officer', province: formData.province || null,
        district: formData.district || null, isActive: true,
        lastLogin: new Date().toISOString(), createdAt: new Date().toISOString(),
      };
      const updated = [...users, newUser];
      setUsers(updated);
      saveUsers(updated);
      addToast('User created', 'success');
    }
    setShowDrawer(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">User Management</h1>
          <p className="text-sm text-[#475569] mt-0.5">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowDrawer(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a365d]">
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Name</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Province</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Last Login</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                  <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{u.email}</td>
                  <td className="px-4 py-3"><Badge status={u.role}>{ROLE_LABELS[u.role]}</Badge></td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{u.province || 'N/A'}</td>
                  <td className="px-4 py-3"><Badge status={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3 text-xs text-[#475569]">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingUser(u); setShowDrawer(true); }} className="p-1.5 text-[#475569] hover:text-[#0d9488] hover:bg-[#f1f5f9] rounded transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded transition-colors ${u.isActive ? 'text-[#16a34a] hover:bg-[rgba(22,163,74,0.1)]' : 'text-[#94a3b8] hover:bg-[#f1f5f9]'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 text-[#94a3b8] hover:text-[#dc2626] hover:bg-[rgba(220,38,38,0.1)] rounded transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowDrawer(false); setEditingUser(null); }} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[440px] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-semibold text-[#1e293b]">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => { setShowDrawer(false); setEditingUser(null); }} className="p-1 text-[#94a3b8] hover:text-[#475569]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <UserForm initial={editingUser} onSave={handleSave} onCancel={() => { setShowDrawer(false); setEditingUser(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function UserForm({ initial, onSave, onCancel }: { initial: User | null; onSave: (d: Partial<User>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    email: initial?.email || '',
    role: initial?.role || 'provincial_officer' as const,
    province: initial?.province || '',
  });

  const isValid = form.fullName && form.email;

  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Full Name *</label>
        <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Email *</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Role</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
          <option value="provincial_officer">Provincial Officer</option>
          <option value="hr_custodian">HR/Custodian</option>
          <option value="finance_officer">Finance Officer</option>
          <option value="national_admin">National Administrator</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Province (for Provincial Officers)</label>
        <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
          <option value="">None</option>
          {['BULAWAYO', 'HARARE', 'MANICALAND', 'MASHONALAND CENTRAL', 'MASHONALAND EAST', 'MASHONALAND WEST', 'MASVINGO', 'MATABELELAND NORTH', 'MATABELELAND SOUTH', 'MIDLANDS'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md">Cancel</button>
        <button onClick={() => onSave(form)} disabled={!isValid} className="px-4 py-2 bg-[#0d9488] text-white text-sm rounded-md hover:bg-[#0f766e] disabled:opacity-50">
          {initial ? 'Update' : 'Create'} User
        </button>
      </div>
    </div>
  );
}
