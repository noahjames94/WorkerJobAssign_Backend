export class TemplateHelper {
  static loadParams(html: string, params: object): string {
    return TemplateHelper.applyParams(html, params);
  }

  private static applyParams(html: string, params: object): string {
    Object.entries(params).map(([key, value]) => {
      const regexp = new RegExp(`(<\\w+[^>]*id="${key}"[^>]*>)(?:.*)(<\\/\\w*>)`, "g");
      html = html.replace(regexp, `$1${JSON.stringify(value)}$2`);
    });
    return html;
  }
}

export default TemplateHelper;

