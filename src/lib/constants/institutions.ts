export type Institution = {
  id: string;
  name: string;
  type: 'BANK_ACCOUNT' | 'CREDIT_CARD';
  color: string;
  gradient: string;
  initial: string;
};

export const PUBLIC_INSTITUTIONS: Institution[] = [
  // Banks
  {
    id: 'bank-hdfc',
    name: 'HDFC Bank',
    type: 'BANK_ACCOUNT',
    color: '#004C8F',
    gradient: 'from-[#004C8F] to-[#002D56]',
    initial: 'H'
  },
  {
    id: 'bank-sbi',
    name: 'State Bank of India',
    type: 'BANK_ACCOUNT',
    color: '#00B5E2',
    gradient: 'from-[#00B5E2] to-[#0089AB]',
    initial: 'S'
  },
  {
    id: 'bank-icici',
    name: 'ICICI Bank',
    type: 'BANK_ACCOUNT',
    color: '#F26522',
    gradient: 'from-[#F26522] to-[#C94711]',
    initial: 'I'
  },
  {
    id: 'bank-axis',
    name: 'Axis Bank',
    type: 'BANK_ACCOUNT',
    color: '#97144D',
    gradient: 'from-[#97144D] to-[#6A0C35]',
    initial: 'A'
  },
  {
    id: 'bank-kotak',
    name: 'Kotak Mahindra',
    type: 'BANK_ACCOUNT',
    color: '#ED1C24',
    gradient: 'from-[#ED1C24] to-[#B3131A]',
    initial: 'K'
  },
  {
    id: 'bank-other',
    name: 'Other Bank',
    type: 'BANK_ACCOUNT',
    color: '#64748B',
    gradient: 'from-[#64748B] to-[#475569]',
    initial: 'B'
  },

  // Credit Cards
  {
    id: 'card-amex',
    name: 'American Express',
    type: 'CREDIT_CARD',
    color: '#006FCF',
    gradient: 'from-[#006FCF] to-[#004A8F]',
    initial: 'A'
  },
  {
    id: 'card-hdfc',
    name: 'HDFC Credit Card',
    type: 'CREDIT_CARD',
    color: '#004C8F',
    gradient: 'from-[#004C8F] to-[#002D56]',
    initial: 'H'
  },
  {
    id: 'card-sbi',
    name: 'SBI Card',
    type: 'CREDIT_CARD',
    color: '#00B5E2',
    gradient: 'from-[#00B5E2] to-[#0089AB]',
    initial: 'S'
  },
  {
    id: 'card-icici',
    name: 'ICICI Credit Card',
    type: 'CREDIT_CARD',
    color: '#F26522',
    gradient: 'from-[#F26522] to-[#C94711]',
    initial: 'I'
  },
  {
    id: 'card-axis',
    name: 'Axis Credit Card',
    type: 'CREDIT_CARD',
    color: '#97144D',
    gradient: 'from-[#97144D] to-[#6A0C35]',
    initial: 'A'
  },
  {
    id: 'card-other',
    name: 'Other Credit Card',
    type: 'CREDIT_CARD',
    color: '#64748B',
    gradient: 'from-[#64748B] to-[#475569]',
    initial: 'C'
  }
];
