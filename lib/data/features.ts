export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesData {
  section: {
    subtitle: string;
    title: string;
    description: string;
  };
  features: Feature[];
}

export const featuresData: FeaturesData = {
  section: {
    subtitle: "Özellikler",
    title: "Daha İyi Bir Berber Deneyimi",
    description:
      "Modern berber randevu sistemimiz ile zaman kazanın, kuyruklarda beklemeyin ve size özel hizmetlerden yararlanın.",
  },
  features: [
    {
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Hızlı ve Kolay Randevu",
      description:
        "Bir kaç tıklama ile istediğiniz berbere, istediğiniz saatte randevu alabilirsiniz. Zaman kaybı yok.",
    },
    {
      icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
      title: "Favorilere Ekleme",
      description:
        "En sevdiğiniz berberleri favorilere ekleyerek daha hızlı randevu alabilirsiniz.",
    },
  ],
};
