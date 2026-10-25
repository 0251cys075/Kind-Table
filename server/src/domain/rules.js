/**
 * Kind Table Domain Rules & Validation
 * Directly implements the business rules and constraints from the Java Capstone (Group 76).
 * All error messages are written in plain, human-friendly language (no technical jargon).
 */

export const ALLOWED_CATEGORIES = [
  'Cooked meal',
  'Bakery',
  'Fruit and vegetables',
  'Packaged food',
  'Dairy',
];

export const BATCH_STATUS = {
  AVAILABLE: 'Available',
  CLAIMED: 'Claimed',
  EXPIRED: 'Expired',
};

// Domain Error Classes mirroring Java Capstone Exceptions
export class InvalidQuantityError extends Error {
  constructor(message = 'Please enter at least 1 portion (whole numbers only). One portion feeds one person.') {
    super(message);
    this.name = 'InvalidQuantityError';
    this.code = 'INVALID_QUANTITY';
    this.statusCode = 400;
  }
}

export class ExpiredFoodDonationError extends Error {
  constructor(message = 'That time has already passed. Please choose how many hours the food will stay fresh from now.') {
    super(message);
    this.name = 'ExpiredFoodDonationError';
    this.code = 'EXPIRED_FOOD_DONATION';
    this.statusCode = 400;
  }
}

export class SurplusBatchAlreadyClaimedError extends Error {
  constructor(message = 'Another NGO claimed this just before you. Here are other batches nearby that need rescuing.') {
    super(message);
    this.name = 'SurplusBatchAlreadyClaimedError';
    this.code = 'ALREADY_CLAIMED';
    this.statusCode = 409;
  }
}

export class BatchNotFoundError extends Error {
  constructor(message = 'We could not find that food batch. It may have been removed or already expired.') {
    super(message);
    this.name = 'BatchNotFoundError';
    this.code = 'BATCH_NOT_FOUND';
    this.statusCode = 404;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.statusCode = 400;
  }
}

/**
 * Validates a new donation request against all business rules.
 */
export function validateDonationInput({ donor, category, quantity, location, expiryTime, latitude, longitude }) {
  if (!donor || typeof donor !== 'string' || donor.trim().length === 0) {
    throw new ValidationError('Please enter your name or organisation so NGOs know who prepared the food.');
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new ValidationError(
      `Please select a valid food category (${ALLOWED_CATEGORIES.join(', ')}).`
    );
  }

  // Quantity rule: Whole number greater than 0
  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    throw new InvalidQuantityError();
  }

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    throw new ValidationError('Please enter a pickup location so volunteers know where to collect the food.');
  }

  if (!expiryTime) {
    throw new ExpiredFoodDonationError('Please select how long the food stays fresh.');
  }

  const expiryDate = new Date(expiryTime);
  if (isNaN(expiryDate.getTime())) {
    throw new ExpiredFoodDonationError('Please provide a valid freshness time.');
  }

  // Expiry rule: Must be in the future
  const now = new Date();
  if (expiryDate <= now) {
    throw new ExpiredFoodDonationError();
  }

  return {
    donor: donor.trim(),
    category,
    quantity: parsedQty,
    location: location.trim(),
    expiryTime: expiryDate.toISOString(),
    latitude: latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : 40.7128,
    longitude: longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : -74.0060,
  };
}

/**
 * Validates a claim request.
 */
export function validateClaimInput({ ngoName }) {
  if (!ngoName || typeof ngoName !== 'string' || ngoName.trim().length === 0) {
    throw new ValidationError('Please enter your NGO or volunteer name before claiming this food.');
  }
  return {
    ngoName: ngoName.trim(),
  };
}
