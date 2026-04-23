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
    return 'Enter your email.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.';
  }

  if (password.length === 0) {
    return 'Enter your password.';
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
    return 'Enter your full name.';
  }

  if (city.length < 2) {
    return 'Enter a valid city.';
  }

  if (email.length === 0) {
    return 'Enter an email to create your account.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.';
  }

  if (phone.length > 0 && !PHONE_PATTERN.test(phone)) {
    return 'Enter a valid phone number.';
  }

  if (password.length < 8) {
    return 'Use at least 8 characters for your password.';
  }

  return null;
}

export function validateCreateRideInput(input: CreateRideInput) {
  const departureCity = sanitizeText(input.departureCity);
  const destinationCity = sanitizeText(input.destinationCity);
  const vehicleModel = sanitizeText(input.vehicleModel);
  const plateNumber = sanitizeText(input.plateNumber).toUpperCase();

  if (departureCity.length < 2 || destinationCity.length < 2) {
    return 'Select both departure and destination cities.';
  }

  if (departureCity.toLowerCase() === destinationCity.toLowerCase()) {
    return 'Departure and destination must be different.';
  }

  if (!isValidIsoDate(input.departureAt)) {
    return 'Enter a valid departure date and time.';
  }

  if (new Date(input.departureAt).getTime() <= Date.now()) {
    return 'Choose a departure time in the future.';
  }

  if (!Number.isInteger(input.availableSeats) || input.availableSeats < 1 || input.availableSeats > 8) {
    return 'Seats must be between 1 and 8.';
  }

  if (input.priceTnd <= 0) {
    return 'Price must be greater than 0.';
  }

  if (vehicleModel.length < 2) {
    return 'Enter a vehicle model.';
  }

  if (plateNumber.length < 4) {
    return 'Enter a valid plate number.';
  }

  return null;
}

export function validateDriverVerificationInput(input: DriverVerificationInput) {
  const fullName = sanitizeText(input.fullName);
  const cityOfResidence = sanitizeText(input.cityOfResidence);
  const phone = normalizePhone(input.phone);
  const documentTypes = new Set(input.documents.map((document) => document.type));

  if (fullName.length < 2) {
    return 'Enter your full name.';
  }

  if (!isValidIsoDate(input.dateOfBirth)) {
    return 'Enter a valid date of birth.';
  }

  if (calculateAge(input.dateOfBirth) < 21) {
    return 'Driver must be at least 21 years old.';
  }

  if (cityOfResidence.length < 2) {
    return 'Enter a valid city of residence.';
  }

  if (!PHONE_PATTERN.test(phone)) {
    return 'Enter a valid phone number.';
  }

  if (!input.phoneVerified) {
    return 'Verify your phone number before submitting.';
  }

  if (input.documents.length < 4) {
    return 'Upload all 4 required documents.';
  }

  if (documentTypes.size !== 4) {
    return 'Submit each required document type only once.';
  }

  return null;
}
