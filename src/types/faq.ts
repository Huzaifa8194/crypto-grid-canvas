export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: number;
}

export interface CreateFAQItemInput {
  question: string;
  answer: string;
}
