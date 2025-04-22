export interface ContactData {
  title: string;
  contactInfo: {
    title: string;
    address: {
      label: string;
      value: string;
    };
    phone: {
      label: string;
      value: string;
    };
    email: {
      label: string;
      value: string;
    };
  };
  socialMedia: {
    title: string;
  };
  form: {
    title: string;
    fields: {
      name: string;
      email: string;
      subject: string;
      message: string;
    };
    button: {
      submit: string;
      sending: string;
    };
    successMessage: string;
    errorMessage: string;
  };
}

export const contactData: ContactData = {
  title: "İletişim",
  contactInfo: {
    title: "İletişim Bilgilerimiz",
    address: {
      label: "Adres",
      value: "İstanbul",
    },
    phone: {
      label: "Telefon",
      value: "+90 (212) 123 45 67",
    },
    email: {
      label: "E-posta",
      value: "info@berberrandevu.com",
    },
  },
  socialMedia: {
    title: "Sosyal Medya",
  },
  form: {
    title: "Bize Mesaj Gönderin",
    fields: {
      name: "Ad Soyad",
      email: "E-posta",
      subject: "Konu",
      message: "Mesajınız",
    },
    button: {
      submit: "Gönder",
      sending: "Gönderiliyor...",
    },
    successMessage:
      "Mesajınız gönderildi. En kısa sürede size dönüş yapacağız.",
    errorMessage: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
  },
};
