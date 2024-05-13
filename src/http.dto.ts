export class HttpRequestResultDto { 
  constructor() { 
      this.cookie = '' 
  } 

  method!: 'GET' | 'POST' 
  url = '' 
  data: any | undefined 
  status: number | undefined 
  isOk: boolean | undefined 
  isTimeoutError: boolean | undefined 
  isError: boolean | undefined 
  message: string | undefined 
  cookie: string 
}