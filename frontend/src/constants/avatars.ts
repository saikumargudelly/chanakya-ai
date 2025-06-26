// Avatar configurations for different assistant types
export interface AvatarConfig {
  src: string;
  alt: string;
  fallback: string;
}

export const AVATAR_MAP: Record<string, AvatarConfig> = {
  // Male assistant (Krishna)
  krishna: {
    src: '/avatars/krish.svg',
    alt: 'Krishna',
    fallback: '/avatars/chanakya.svg'
  },
  // Female assistant (Rukmini)
  rukmini: {
    src: '/avatars/rukmini.svg',
    alt: 'Rukmini',
    fallback: '/avatars/chanakya.svg'
  },
  // Default assistant (Chanakya)
  chanakya: {
    src: '/avatars/chanakya.svg',
    alt: 'Chanakya',
    fallback: '/avatars/chanakya.svg'
  }
};

// Map gender to assistant type
export const GENDER_TO_ASSISTANT: Record<string, keyof typeof AVATAR_MAP> = {
  male: 'rukmini',    // Male users get Rukmini (female assistant)
  female: 'krishna',  // Female users get Krishna (male assistant)
  other: 'chanakya',  // Default to Chanakya for other/unspecified
};

// Get avatar config by gender
export const getAvatarByGender = (gender: string): AvatarConfig => {
  const assistantType = GENDER_TO_ASSISTANT[gender] || 'chanakya';
  return AVATAR_MAP[assistantType] || AVATAR_MAP.chanakya;
};
