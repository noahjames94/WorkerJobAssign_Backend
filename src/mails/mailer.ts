export interface Mailer {
  send(to: string, locals: any, template: string): Promise<any>;
}
