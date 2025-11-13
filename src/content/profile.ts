export interface ContactInfo {
  telegramHandle: string;
  email: string;
}

export interface ProfileContent {
  fullNameRu: string;
  fullNameEn: string;
  contact: ContactInfo;
}

export const profileContent: ProfileContent = {
  fullNameRu: 'Гагитэ Эдуард Станиславович',
  fullNameEn: 'Eduard Gagite',
  contact: {
    telegramHandle: 'edublago',
    email: 'eduardgagite@gmail.com',
  },
};


