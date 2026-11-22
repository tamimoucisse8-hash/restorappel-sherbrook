import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Les identifiants Twilio (TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN) sont manquants."
    );
  }

  return twilio(accountSid, authToken);
}

function getTwilioPhoneNumber(): string {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error("TWILIO_PHONE_NUMBER est manquant dans les variables d'environnement.");
  }
  return fromNumber;
}

/**
 * Normalise un numéro canadien/nord-américain au format E.164 (+1XXXXXXXXXX).
 */
export function formatCanadianPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return phone.startsWith("+") ? phone.trim() : `+${digits}`;
}

/**
 * SMS 1 : Envoyé immédiatement après la création d'une réservation.
 */
export async function sendBookingConfirmationSms(params: {
  to: string;
  customerName: string;
  partySize: number;
  restaurantName: string;
  dateFormatted: string;
  timeFormatted: string;
}): Promise<string> {
  const client = getTwilioClient();
  const from = getTwilioPhoneNumber();
  const to = formatCanadianPhoneE164(params.to);

  const body = `Bonjour ${params.customerName}, merci, votre table pour ${params.partySize} personnes est réservée chez ${params.restaurantName} le ${params.dateFormatted} à ${params.timeFormatted}. Répondez OUI pour confirmer, NON pour annuler.`;

  const message = await client.messages.create({
    from,
    to,
    body,
  });

  return message.sid;
}

/**
 * SMS 2 : Rappel automatique envoyé 3 heures avant l'heure de réservation.
 */
export async function sendThreeHourReminderSms(params: {
  to: string;
  restaurantName: string;
}): Promise<string> {
  const client = getTwilioClient();
  const from = getTwilioPhoneNumber();
  const to = formatCanadianPhoneE164(params.to);

  const body = `Rappel : Votre table chez ${params.restaurantName} est dans 3h. Répondez OUI pour confirmer.`;

  const message = await client.messages.create({
    from,
    to,
    body,
  });

  return message.sid;
}

/**
 * Valide l'authenticité d'un webhook entrant depuis Twilio.
 */
export function verifyTwilioWebhookSignature(params: {
  signature: string | null;
  url: string;
  formParams: Record<string, string>;
}): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || !params.signature) {
    return false;
  }

  return twilio.validateRequest(
    authToken,
    params.signature,
    params.url,
    params.formParams
  );
}
