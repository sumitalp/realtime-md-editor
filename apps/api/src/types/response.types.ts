export interface HelloResponse {
  message: string;
  timestamp: string;
  endpoints: {
    health: string;
    login: string;
    register: string;
    verify: string;
    documents: string;
    publicDocs: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  message: string;
  port: number | string;
}
