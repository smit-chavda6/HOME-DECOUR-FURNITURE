import { formatDate } from "@/components/orders/order-status";
import { DeleteUserButton, UserRoleSelect } from "@/components/admin/row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data/admin";

export const metadata = { title: "Customers" };

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const users = await getAdminUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted">{users.length} accounts</p>
      </div>

      <div className="overflow-x-auto rounded-card ring-1 ring-line">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-muted">@{u.username}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{u.email}</p>
                  <p className="text-xs text-muted">{u.phone}</p>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(u.joined)}</td>
                <td className="px-4 py-3 tabular-nums">{u.orders}</td>
                <td className="px-4 py-3">
                  {u.id === me.id ? (
                    <span className="text-xs text-muted">Admin (you)</span>
                  ) : (
                    <UserRoleSelect id={u.id} role={u.role} />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me.id && <DeleteUserButton id={u.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
