"use client";

import {
  deleteMessageAction,
  deleteProductAction,
  deleteUserAction,
  setProductActiveAction,
  setUserRoleAction,
  updateOrderStatusAction,
} from "@/lib/actions/admin";
import {
  AutoSaveSelect,
  ConfirmButton,
  ToggleSwitch,
  orderStatusOptions,
} from "./admin-controls";

/** Thin wrappers that bind a row's id to the right server action. */

export function ProductActiveToggle({ id, active, name }: { id: string; active: boolean; name: string }) {
  return (
    <ToggleSwitch
      checked={active}
      label={`Show ${name} in the shop`}
      action={(next) => setProductActiveAction(id, next)}
    />
  );
}

export function DeleteProductButton({ id }: { id: string }) {
  return <ConfirmButton label="Delete" action={() => deleteProductAction(id)} />;
}

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <AutoSaveSelect
      label="Order status"
      value={status}
      options={orderStatusOptions}
      action={(next) => updateOrderStatusAction(id, next)}
    />
  );
}

export function UserRoleSelect({ id, role }: { id: string; role: string }) {
  return (
    <AutoSaveSelect
      label="Role"
      value={role}
      options={[
        { value: "user", label: "Customer" },
        { value: "admin", label: "Admin" },
      ]}
      action={(next) => setUserRoleAction(id, next)}
    />
  );
}

export function DeleteUserButton({ id }: { id: string }) {
  return <ConfirmButton label="Delete" action={() => deleteUserAction(id)} />;
}

export function DeleteMessageButton({ id }: { id: string }) {
  return <ConfirmButton label="Delete" action={() => deleteMessageAction(id)} />;
}
