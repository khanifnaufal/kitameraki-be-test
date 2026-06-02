export type FieldType = 'text' | 'date' | 'datetime' | 'email';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  order: number;
  column: 1 | 2;
  row: number;
}

export interface FormSettings {
  id?: string;
  organizationId: string;
  fields: FormField[];
  updatedAt?: string;
  type?: 'formSettings';
}
