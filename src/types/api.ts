export interface ApiMeta {
  partial?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  data: T;
  _meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field?: string;
}
