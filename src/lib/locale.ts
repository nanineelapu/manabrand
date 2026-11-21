/**
 * Where ManaBrand works: Ichapuram and the towns and villages around it, Srikakulam district, Andhra Pradesh.
 * Everything that talks about location (address form, delivery check, copy, emails) reads from here.
 */
export const AREA = {
  town: "Ichapuram", district: "Srikakulam", state: "Andhra Pradesh", pincode: "532312",
  /** "Ichapuram, Srikakulam, Andhra Pradesh 532312" */
  full: "Ichapuram, Srikakulam, Andhra Pradesh 532312",
} as const;

/** Towns around Ichapuram (suggestions in the address form — villages can be typed in freely). */
export const NEARBY_PLACES = ["Ichapuram", "Sompeta", "Kaviti", "Kanchili", "Palasa–Kasibugga", "Mandasa", "Tekkali"] as const;

/** Srikakulam district pincodes all start with 532. */
export const inServiceArea = (pincode: string) => /^532\d{3}$/.test(pincode);
export const OUT_OF_AREA = "We deliver in Ichapuram and the nearby towns and villages of Srikakulam district (pincode 532xxx) for now.";
