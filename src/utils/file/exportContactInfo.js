const FACEBOOK_URL = String(import.meta.env.VITE_CONTACT_FACEBOOK_URL || "").trim();
const ZALO_PHONE = String(import.meta.env.VITE_CONTACT_ZALO_PHONE || "").trim();

const normalizeDisplayUrl = (url) =>
  url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/g, "");

const normalizePhone = (value) => value.replace(/[^\d+]/g, "");

export const getExportContacts = () => {
  const contacts = [];

  if (FACEBOOK_URL) {
    contacts.push({
      key: "facebook",
      title: "Facebook",
      value: normalizeDisplayUrl(FACEBOOK_URL),
      href: FACEBOOK_URL,
      accent: "#1877F2",
      iconText: "f",
    });
  }

  if (ZALO_PHONE) {
    const phone = normalizePhone(ZALO_PHONE);
    contacts.push({
      key: "zalo",
      title: "Zalo",
      value: phone,
      href: phone ? `https://zalo.me/${phone.replace(/^\+/, "")}` : "",
      accent: "#0068FF",
      iconText: "Z",
    });
  }

  return contacts;
};
