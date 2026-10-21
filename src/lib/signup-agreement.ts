/** Check again at submission, not only through the disabled button. */
export function requireSignupAgreement(agreed: boolean): void {
  if (!agreed) throw new Error("Please agree to the Terms of Service and Privacy Policy.");
}