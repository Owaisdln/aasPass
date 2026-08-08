import Bowser from 'bowser';

export interface ParsedBrowser {
  browser: string | null;
  os: string | null;
}

export class BrowserParser {
  static parse(
    userAgent: string | null,
  ): ParsedBrowser {
    if (!userAgent) {
      return {
        browser: null,
        os: null,
      };
    }

    const parser = Bowser.getParser(userAgent);

    return {
      browser: parser.getBrowserName() ?? null,
      os: parser.getOSName() ?? null,
    };
  }
}