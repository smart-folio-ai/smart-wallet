export type RiDocumentType =
  | 'earnings_release'
  | 'investor_presentation'
  | 'material_fact'
  | 'reference_form'
  | 'shareholder_notice'
  | 'other';

export interface RiDocumentListItem {
  id: string;
  ticker: string;
  company: string;
  title: string;
  documentType: RiDocumentType;
  period: string | null;
  publishedAt: string;
  source: {
    type: 'url' | 'file';
    value: string;
  };
}

export interface SearchRiDocumentsInput {
  query?: string;
  documentType?: RiDocumentType | 'all';
  limit?: number;
}

export interface SearchRiDocumentsOutput {
  documents: RiDocumentListItem[];
  total: number;
  warnings: string[];
}

export interface RiAssetSuggestion {
  ticker: string;
  company: string;
}
