export interface AuthMiddleWare {
  Authorize(): any;
  GenarateToken(id: string): Promise<any>;
}
