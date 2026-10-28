// One demo profile from src/data/profiles.json (converted from profiles.md, no keys).

export type ProfileGender = 'female' | 'male';
export type ProfileIntent = 'marriage' | 'serious_relationship' | 'new_friends' | 'for_fun';
export type ProfileMarital = 'neverMarried' | 'divorced' | 'widowed';

export type Profile = {
  id: string; // p0001
  gender: ProfileGender;
  name: string; // first name
  fullName: string;
  age: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  origins: string;
  intent: ProfileIntent;
  marital: ProfileMarital;
  hasChildren: boolean;
  blurred: boolean;
  verified: boolean;
  profession: string;
  religion: string;
  education: string;
  smoking: string;
  drinking: string;
  personality: string;
  heightCm: number | null;
  interests: string[];
  languages: string[];
  bio: string;
  photos: string[]; // file names, first = main photo (1.webp)
  video: string | null; // file name or null
  km?: number; // distance shown in the app, set by the filters (rule 9.4: moved closer, never hidden)
};

export type MediaItem = { type: 'photo' | 'video'; uri: string };
