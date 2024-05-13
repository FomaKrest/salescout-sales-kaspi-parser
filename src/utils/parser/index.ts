import axios, { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import UserAgent from "user-agents";
import { HttpRequestResultDto } from "../../http.dto";

export class ParserUtils {
  private static _proxies = [
    "test:test@167.172.162.223:8022",
    //"test:test@167.172.162.223:8010",
    "test:test@157.230.112.117:8034",
    "test:test@157.230.112.117:8094",
    "test:test@46.101.124.11:8022"
  ];

  private static _last_proxy_index = 0;

  public static getHeaders(referer: string = "https://kaspi.kz/"): any {
    return {
      "User-Agent": "Mozilla/5.0 (Linux; arm_64; Android 12; CPH2205) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 YaBrowser/23.3.3.86.00 SA/3 Mobile Safari/537.36",
      "Referer": referer,
      "Cookie": "lak_stat=765bba70-0c2f-4507-ba9d-a7f74001e4eb; ks.tg=2;yout=d; current-action-name=Index; k_stat=7696ba91-a8e3-4983-b379-9eb8d16873dd; ks.tg=29; kaspi.storefront.cookie.city=750000000",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "ru-RU,ru;q=0.7",
      "Cache-Control": "max-age=0",
      "Connection": "close",
      "Host": "kaspi.kz",
      "Sec-Ch-Ua": "\"Chromium\";v=\"124\", \"Brave\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Sec-Gpc": "1",
      "Upgrade-Insecure-Requests": "1"
    };
  }

  public static async getFilterUrlAndPayload(merchantId: number, page: number, referer: string): Promise<AxiosRequestConfig<any>> {
    let url;
    if (page == 1) {
      url = `https://kaspi.kz/yml/product-view/pl/filters?q=%3AallMerchants%3A${merchantId}%3AavailableInZones%3AMagnum_ZONE1&page=0&all=false&fl=true&ui=d&i=-1&c=750000000`
    } else {
      url = `https://kaspi.kz/yml/product-view/pl/results?page=${page - 1}&q=%3AallMerchants%3A${merchantId}%3AavailableInZones%3AMagnum_ZONE1&text&sort=relevance&qs&ui=d&i=-1&c=750000000`;
    }

    return ({
      method: "get",
      headers: await ParserUtils.getHeaders(referer),
      proxy: false,
      httpsAgent: await ParserUtils.getRandomProxy(),
      url,
      data: {
        q: `:allMerchants:${merchantId}:availableInZones:Magnum_ZONE1`,
        page: page - 1,
        all: false,
        fl: true,
        ui: "d",
        i: -1,
        c: 750000000,
      }
    });
  }

  public static async getRandomProxy() {
    let index = ParserUtils._last_proxy_index;
    ParserUtils._last_proxy_index = (ParserUtils._last_proxy_index + 1) % ParserUtils._proxies.length
    //console.log(`http://${proxies[randomIndex]}`)
    return new HttpsProxyAgent(`http://${ParserUtils._proxies[index]}`)
  }

  public static async getRandomUserAgent(): Promise<UserAgent> {
    const firstUserAgent = new UserAgent([
      {
        deviceCategory: 'desktop',
      },
    ])
    const userAgent = firstUserAgent.random()

    return userAgent
  }

  public static async getHeadersForOffers(referer = 'https://kaspi.kz/mc/'): Promise<any> {
    const randomUserAgent = ParserUtils.getRandomUserAgent()

    const userAgent = randomUserAgent.toString()

    const randomNumForKSTG = Math.ceil(Math.random() * 104) + 1

    return {
      'Accept': 'application/json, text/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-GB;q=0.8,en;q=0.7,ru-KZ;q=0.6,en-US;q=0.5',
      'Host': 'kaspi.kz',
      'Origin': 'https://kaspi.kz',
      'Referer': referer,
      'User-Agent': userAgent,
      'Connection': 'close',
      'Content-Type': 'application/json; charset=UTF-8',
      'Cookie': 'ks.tg=' + randomNumForKSTG,
    }
  }

  public static async postRequest(url: string, body = {}, options = {}, timeout = 5000): Promise<HttpRequestResultDto> {
    const httpRequestResult = new HttpRequestResultDto()
    httpRequestResult.isTimeoutError = false
    httpRequestResult.url = url
    httpRequestResult.method = 'POST'

    //timeout = 100;

    const source = axios.CancelToken.source()
    const timeoutFnc = setTimeout(() => {
      httpRequestResult.isTimeoutError = true
      source.cancel()
    }, timeout)

    await axios
      .post(url, body, {
        ...options,
        cancelToken: source.token,
      })
      .then((data) => {
        clearTimeout(timeoutFnc)

        httpRequestResult.data = data.data
        httpRequestResult.status = data.status
        httpRequestResult.isError = false
        httpRequestResult.message = 'OK'
        httpRequestResult.isOk = true
      })
      .catch((err) => {
        httpRequestResult.data = err?.response?.data || {}
        httpRequestResult.status = err?.response?.status || 0
        httpRequestResult.isError = true
        httpRequestResult.message = err?.message || ''
        httpRequestResult.isOk = false
      })

    return httpRequestResult
  }

}