import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { Education, Frequency, Intent, MaritalStatus, YesNo } from './types';
import { tr } from '../i18n/i18n';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
};

export const INTENT_OPTIONS: Option<Intent>[] = [
  { value: 'marriage', label: 'Ready to get married', description: 'I want to find my life partner soon.', icon: 'diamond-outline' },
  { value: 'serious', label: 'A serious relationship', description: 'I want something long-term.', icon: 'heart-outline' },
  { value: 'friends', label: 'New friends', description: 'I want to meet new people first.', icon: 'people-outline' },
  { value: 'fun', label: 'Just for fun', description: 'Let’s see where it goes.', icon: 'sparkles-outline' },
];

export const MARITAL_OPTIONS: Option<MaritalStatus>[] = [
  { value: 'never_married', label: 'Never married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export const CHILDREN_OPTIONS: Option<YesNo>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const SMOKING_OPTIONS: Option<Frequency>[] = [
  { value: 'never', label: 'No, never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Yes, regularly' },
];

export const DRINKING_OPTIONS: Option<Frequency>[] = [
  { value: 'never', label: 'No, never' },
  { value: 'sometimes', label: 'Socially' },
  { value: 'often', label: 'Yes, regularly' },
];

export const RELIGION_OPTIONS: Option<string>[] = [
  { value: 'christianity', label: 'Christianity' },
  { value: 'islam', label: 'Islam' },
  { value: 'judaism', label: 'Judaism' },
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'buddhism', label: 'Buddhism' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'agnostic', label: 'Agnostic' },
  { value: 'atheist', label: 'Atheist' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

export const EDUCATION_OPTIONS: Option<Education>[] = [
  { value: 'high_school', label: 'High school' },
  { value: 'vocational', label: 'Vocational or non-degree' },
  { value: 'bachelor', label: 'Bachelor’s degree' },
  { value: 'master', label: 'Master’s degree' },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

export const PROFESSIONS = [
  'Accountant',
  'Actor',
  'Architect',
  'Artist',
  'Athlete',
  'Banker',
  'Barista',
  'Business owner',
  'Chef',
  'Civil servant',
  'Consultant',
  'Content creator',
  'Customer service',
  'Data analyst',
  'Dentist',
  'Designer',
  'Doctor',
  'Driver',
  'Electrician',
  'Engineer',
  'Entrepreneur',
  'Event planner',
  'Farmer',
  'Financial advisor',
  'Firefighter',
  'Fitness coach',
  'Flight attendant',
  'Freelancer',
  'Graphic designer',
  'Hairdresser',
  'HR specialist',
  'IT specialist',
  'Journalist',
  'Lawyer',
  'Marketing specialist',
  'Mechanic',
  'Military',
  'Model',
  'Musician',
  'Nurse',
  'Pharmacist',
  'Photographer',
  'Physiotherapist',
  'Pilot',
  'Police officer',
  'Product manager',
  'Professor',
  'Project manager',
  'Psychologist',
  'Real estate agent',
  'Researcher',
  'Retail',
  'Sales',
  'Scientist',
  'Social worker',
  'Software developer',
  'Student',
  'Teacher',
  'Translator',
  'Travel agent',
  'UX/UI designer',
  'Veterinarian',
  'Video editor',
  'Waiter / waitress',
  'Web developer',
  'Writer',
  'Not working right now',
];

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 6;
export const BIO_MAX = 500;

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const HEIGHT_MIN_CM = 140;
export const HEIGHT_MAX_CM = 210;

export function cmToFeet(cm: number) {
  let feet = Math.floor(cm / 2.54 / 12);
  let inches = Math.round(cm / 2.54 - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return `${feet}′ ${inches}″`;
}

// The label in the app language (the lists keep English, the key of every translation).
export function labelOf<T extends string>(options: Option<T>[], value: T | undefined) {
  const label = options.find((o) => o.value === value)?.label;
  return label ? tr(label) : '';
}
