import type { OrderStatus } from "@/db/schema";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Նոր",
  confirmed: "Հաստատված",
  shipped: "Ուղարկված",
  delivered: "Առաքված",
  cancelled: "Չեղարկված",
  returned: "Վերադարձված",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-[#fef3c7] text-[#78350f]",
  confirmed: "bg-[#dbeafe] text-[#1e3a8a]",
  shipped: "bg-[#e0e7ff] text-[#312e81]",
  delivered: "bg-[#dcfce7] text-[#14532d]",
  cancelled: "bg-[#f3f4f6] text-[#374151]",
  returned: "bg-[#fee2e2] text-[#7f1d1d]",
};
