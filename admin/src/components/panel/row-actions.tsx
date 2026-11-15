"use client";

import {
  deleteCustomerAction,
  deleteMessageAction,
  deleteProductAction,
  setProductActiveAction,
  updateOrderStatusAction,
} from "@/lib/actions/shop";
import { AutoSaveSelect, ConfirmButton, ToggleSwitch, orderStatusOptions } from "./controls";

/** Thin wrappers that bind a row's id to the right server action. */

export function ProductActiveToggle({ id, active, name }: { id: string; active: boolean; name: string }) {
  return (
    <ToggleSwitch checked={active} label={`Show ${name} in the shop`} action={(next) => setProductActiveAction(id, next)} />
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

export function DeleteCustomerButton({ id }: { id: string }) {
  return <ConfirmButton label="Delete" action={() => deleteCustomerAction(id)} />;
}

export function DeleteMessageButton({ id }: { id: string }) {
  return <ConfirmButton label="Delete" action={() => deleteMessageAction(id)} />;
}
