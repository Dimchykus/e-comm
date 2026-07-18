import { IsNotEmpty, IsString } from "class-validator";

/** TCP message payloads for patterns that target a user's cart. */
export class GetCartPayload {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class ClearCartPayload {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
