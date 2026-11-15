import type { Metadata } from "next";
import { PageTitle } from "@/components/panel/page-title";
import { DeleteCustomerButton } from "@/components/panel/row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data/shop";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requireAdmin();
  const users = await getAdminUsers();

  return (
    <div>
      <PageTitle
        title="Customers"
        description={`${users.length} shop accounts. Customer accounts cannot sign in to this panel; admins are managed under Admins.`}
      />

      <div className="relative overflow-x-auto rounded-card ring-1 ring-line">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
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
                <td className="px-4 py-3 text-right">
                  <DeleteCustomerButton id={u.id} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
