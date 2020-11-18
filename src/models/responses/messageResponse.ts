import { Paging } from "./paging";

export class MesssageResponse {
  paging: Paging;
  status: boolean;
  data: any;
  message: string;
}
