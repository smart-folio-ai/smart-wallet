export type RiDocumentType =
  | 'earnings_release'
  | 'investor_presentation'
  | 'material_fact'
  | 'reference_form'
  | 'shareholder_notice'
  | 'financial_statement'
  | 'management_report'
  | 'conference_call_material'
  | 'dividend_notice'
  | 'other_ri_document'
  | 'unknown';

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
  fallback: {
    availableDocumentTypes: RiDocumentType[];
    suggestedFilters: Array<RiDocumentType | 'all'>;
  };
}

export interface RiAssetSuggestion {
  ticker: string;
  company: string;
}
