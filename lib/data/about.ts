export interface AboutData {
  title: string;
  intro: string;
  mission: {
    title: string;
    content: string;
  };
  vision: {
    title: string;
    content: string;
  };
  values: {
    title: string;
    items: string[];
  };
  team: {
    title: string;
    content: string;
  };
  closing: string;
}

export const aboutData: AboutData = {
  title: "Hakkımızda",
  intro:
    "HairTime, 2023 yılında kurulan modern bir berber ve kuaför randevu platformudur. Amacımız, müşterilerin en uygun zamanda, en uygun berberi kolayca bulmasını sağlamaktır.",
  mission: {
    title: "Misyonumuz",
    content:
      "Müşteriler ve berberler arasında köprü kurarak, herkesin zamanını en verimli şekilde kullanmasını sağlamak. Kullanıcı dostu arayüzümüz sayesinde randevu almak ve yönetmek hiç bu kadar kolay olmamıştı.",
  },
  vision: {
    title: "Vizyonumuz",
    content:
      "Türkiye'nin en kapsamlı ve kullanışlı berber randevu platformu olmak. Sürekli gelişen teknolojimizle hem müşterilere hem de berberlere en iyi hizmeti sunmayı hedefliyoruz.",
  },
  values: {
    title: "Değerlerimiz",
    items: [
      "Kullanıcı memnuniyeti her zaman önceliğimizdir.",
      "Dürüstlük ve şeffaflık ilkelerimizden asla taviz vermeyiz.",
      "Sürekli gelişim ve yenilik için çalışırız.",
      "Zamanın değerli olduğuna inanır, bu değeri korumak için çaba gösteririz.",
      "Kullanıcı gizliliği ve veri güvenliği konusunda en yüksek standartlarda çalışırız.",
    ],
  },
  team: {
    title: "Ekibimiz",
    content:
      "Genç ve dinamik ekibimiz, teknoloji ve berberlik sektörünün profesyonellerinden oluşmaktadır. Her biri alanında uzman olan ekip üyelerimiz, en iyi kullanıcı deneyimini sunmak için çalışmaktadır.",
  },
  closing:
    "HairTime ekibi olarak, sizlere hizmet vermekten mutluluk duyuyoruz.",
};
