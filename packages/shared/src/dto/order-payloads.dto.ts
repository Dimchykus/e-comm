import { IsNotEmpty, IsString } from "class-validator";

/** TCP message payloads for patterns that look orders up. */
export class FindOrderByIdPayload {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class FindOrdersByUserPayload {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
