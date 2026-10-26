// Shop-wide settings. Everything in [brackets] is a placeholder to replace.

export const site = {
  shopName: "[ԽԱՆՈՒԹԻ ԱՆՈՒՆ]",
  /** Shown in the header and footer; used for the tel: link. Digits only after +. */
  phone: "+37400000000",
  phoneDisplay: "[+374 XX XXX XXX]",
  address: "[Հասցե]",
  workingHours: "[Աշխատանքային ժամեր]",
  legalName: "[ՀՎՀՀ / իրավաբանական անուն]",

  /** Leave a link empty ("") to hide that button. */
  messengers: {
    whatsapp: "", // e.g. "https://wa.me/37400000000"
    viber: "", // e.g. "viber://chat?number=%2B37400000000"
    telegram: "", // e.g. "https://t.me/yourshop"
  },

  delivery: {
    yerevanDays: "[1]",
    regionsDays: "[2–3]",
    priceText: "[անվճար / ___ ֏]",
  },
  warrantyMonths: 3,
  returnDays: 14,
  /** Minutes the operator promises to call back within. */
  callbackMinutes: 15,
};
