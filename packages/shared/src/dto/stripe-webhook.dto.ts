import { IsNotEmpty, IsString } from "class-validator";

/**
 * Raw Stripe webhook forwarded by the gateway. The body must stay the
 * untouched request payload so the signature can be verified.
 */
export class StripeWebhookPayload {
  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}
