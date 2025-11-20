
export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic international or local Kenya format
  const re = /^(\+?254|0)(7|1)\d{8}$/;
  return re.test(phone.replace(/\s+/g, ''));
};

export const isValidMembershipId = (id: string): boolean => {
  // Alphanumeric, min 3 chars
  return /^[A-Za-z0-9-]{3,}$/.test(id);
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '').trim();
};

export const isValidOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};
