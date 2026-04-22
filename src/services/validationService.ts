import {
  CreateRideInput,
  DriverVerificationInput,
  LoginInput,
  SignupInput,
} from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{8,15}$/;

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function isValidIsoDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

export function sanitizeText(value: string) {
  return normalizeWhitespace(value);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, '');
}

export function validateLoginInput(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (email.length === 0) {
    return 'Email requis.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Format email invalide.';
  }

  if (password.length === 0) {
    return 'Mot de passe requis.';
  }

  return null;
}

export function validateSignupInput(input: SignupInput) {
  const fullName = sanitizeText(input.fullName);
  const email = input.email ? normalizeEmail(input.email) : '';
  const phone = input.phone ? normalizePhone(input.phone) : '';
  const password = input.password.trim();
  const city = sanitizeText(input.city);

  if (fullName.length < 2) {
    return 'Nom complet requis.';
  }

  if (city.length < 2) {
    return 'Ville invalide.';
  }

  if (email.length === 0) {
    return 'Email requis pour creer un compte.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Format email invalide.';
  }

  if (phone.length > 0 && !PHONE_PATTERN.test(phone)) {
    return 'Numero de telephone invalide.';
  }

  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caracteres.';
  }

  return null;
}

export function validateCreateRideInput(input: CreateRideInput) {
  const departureCity = sanitizeText(input.departureCity);
  const destinationCity = sanitizeText(input.destinationCity);
  const vehicleModel = sanitizeText(input.vehicleModel);
  const plateNumber = sanitizeText(input.plateNumber).toUpperCase();

  if (departureCity.length < 2 || destinationCity.length < 2) {
    return 'Les villes de depart et de destination sont requises.';
  }

  if (departureCity.toLowerCase() === destinationCity.toLowerCase()) {
    return 'Le depart et la destination doivent etre differents.';
  }

  if (!isValidIsoDate(input.departureAt)) {
    return 'Date de depart invalide.';
  }

  if (new Date(input.departureAt).getTime() <= Date.now()) {
    return 'Le depart doit etre programme dans le futur.';
  }

  if (!Number.isInteger(input.availableSeats) || input.availableSeats < 1 || input.availableSeats > 8) {
    return 'Le nombre de places doit etre compris entre 1 et 8.';
  }

  if (input.priceTnd <= 0) {
    return 'Le prix doit etre superieur a zero.';
  }

  if (vehicleModel.length < 2) {
    return 'Le modele du vehicule est requis.';
  }

  if (plateNumber.length < 4) {
    return 'La plaque du vehicule est requise.';
  }

  return null;
}

export function validateDriverVerificationInput(input: DriverVerificationInput) {
  const fullName = sanitizeText(input.fullName);
  const cityOfResidence = sanitizeText(input.cityOfResidence);
  const phone = normalizePhone(input.phone);
  const documentTypes = new Set(input.documents.map((document) => document.type));

  if (fullName.length < 2) {
    return 'Nom complet requis.';
  }

  if (!isValidIsoDate(input.dateOfBirth)) {
    return 'Date de naissance invalide.';
  }

  if (calculateAge(input.dateOfBirth) < 21) {
    return 'Le conducteur doit avoir au moins 21 ans.';
  }

  if (cityOfResidence.length < 2) {
    return 'Ville de residence invalide.';
  }

  if (!PHONE_PATTERN.test(phone)) {
    return 'Numero de telephone invalide.';
  }

  if (!input.phoneVerified) {
    return 'Le numero de telephone doit etre verifie avant soumission.';
  }

  if (input.documents.length < 4) {
    return 'Les 4 documents obligatoires doivent etre televerses.';
  }

  if (documentTypes.size !== 4) {
    return 'Les 4 types de documents obligatoires doivent etre fournis une seule fois.';
  }

  return null;
}
