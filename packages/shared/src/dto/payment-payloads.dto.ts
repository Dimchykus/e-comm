import { IsNotEmpty, IsString } from "class-validator";

/** TCP message payloads for patterns that target payments. */
export class RefundPaymentPayload {
  @IsString()
  @IsNotEmpty()
  paymentId: string;
}

export class GetPaymentHistoryPayload {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
