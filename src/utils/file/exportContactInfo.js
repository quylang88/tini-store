const FACEBOOK = String(import.meta.env.VITE_CONTACT_FACEBOOK || "").trim();
const ZALO_PHONE = String(import.meta.env.VITE_CONTACT_ZALO_PHONE || "").trim();

const normalizeFacebookName = (value) =>
  value
    .replace(/^https?:\/\/(?:www\.)?(?:m\.)?facebook\.com\//i, "")
    .replace(/\/+$/g, "")
    .trim();

const normalizePhone = (value) => value.replace(/[^\d+]/g, "");

export const getExportContacts = () => {
  const contacts = [];

  const facebookName = normalizeFacebookName(FACEBOOK);

  if (facebookName) {
    contacts.push({
      key: "facebook",
      title: "Facebook",
      value: facebookName,
      href: "",
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
