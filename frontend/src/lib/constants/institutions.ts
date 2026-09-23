export type Institution = {
  id: string;
  name: string;
  type: 'BANK_ACCOUNT' | 'CREDIT_CARD';
  color: string;
  gradient: string;
  initial: string;
  aliases: string[];
  isPopular?: boolean;
};

export const PUBLIC_INSTITUTIONS: Institution[] = [
  // ==========================================
  // BANKS
  // ==========================================
  {
    id: 'bank-hdfc',
    name: 'HDFC Bank',
    type: 'BANK_ACCOUNT',
    color: '#004C8F',
    gradient: 'from-[#004C8F] to-[#002D56]',
    initial: 'H',
    aliases: ['hdfc', 'housing development finance'],
    isPopular: true
  },
  {
    id: 'bank-sbi',
    name: 'State Bank of India',
    type: 'BANK_ACCOUNT',
    color: '#00B5E2',
    gradient: 'from-[#00B5E2] to-[#0089AB]',
    initial: 'S',
    aliases: ['sbi', 'state bank of india'],
    isPopular: true
  },
  {
    id: 'bank-icici',
    name: 'ICICI Bank',
    type: 'BANK_ACCOUNT',
    color: '#F26522',
    gradient: 'from-[#F26522] to-[#C94711]',
    initial: 'I',
    aliases: ['icici', 'industrial credit and investment'],
    isPopular: true
  },
  {
    id: 'bank-axis',
    name: 'Axis Bank',
    type: 'BANK_ACCOUNT',
    color: '#97144D',
    gradient: 'from-[#97144D] to-[#6A0C35]',
    initial: 'A',
    aliases: ['axis', 'uti bank'],
    isPopular: true
  },
  {
    id: 'bank-kotak',
    name: 'Kotak Mahindra Bank',
    type: 'BANK_ACCOUNT',
    color: '#ED1C24',
    gradient: 'from-[#ED1C24] to-[#B3131A]',
    initial: 'K',
    aliases: ['kotak', 'kmb', 'mahindra'],
    isPopular: true
  },
  {
    id: 'bank-pnb',
    name: 'Punjab National Bank',
    type: 'BANK_ACCOUNT',
    color: '#F58220',
    gradient: 'from-[#F58220] to-[#C05D0D]',
    initial: 'P',
    aliases: ['pnb', 'punjab national'],
  },
  {
    id: 'bank-bob',
    name: 'Bank of Baroda',
    type: 'BANK_ACCOUNT',
    color: '#F05A28',
    gradient: 'from-[#F05A28] to-[#B83E15]',
    initial: 'B',
    aliases: ['bob', 'baroda'],
  },
  {
    id: 'bank-indusind',
    name: 'IndusInd Bank',
    type: 'BANK_ACCOUNT',
    color: '#841E34',
    gradient: 'from-[#841E34] to-[#591020]',
    initial: 'I',
    aliases: ['indusind', 'indus'],
  },
  {
    id: 'bank-yes',
    name: 'Yes Bank',
    type: 'BANK_ACCOUNT',
    color: '#0054A6',
    gradient: 'from-[#0054A6] to-[#003871]',
    initial: 'Y',
    aliases: ['yes bank', 'yes'],
  },
  {
    id: 'bank-idfc',
    name: 'IDFC FIRST Bank',
    type: 'BANK_ACCOUNT',
    color: '#7F1041',
    gradient: 'from-[#7F1041] to-[#500726]',
    initial: 'I',
    aliases: ['idfc', 'idfc first'],
  },
  {
    id: 'bank-au',
    name: 'AU Small Finance Bank',
    type: 'BANK_ACCOUNT',
    color: '#E87D1E',
    gradient: 'from-[#E87D1E] to-[#A3510C]',
    initial: 'A',
    aliases: ['au', 'au small finance'],
  },
  {
    id: 'bank-citi',
    name: 'Citibank',
    type: 'BANK_ACCOUNT',
    color: '#003B70',
    gradient: 'from-[#003B70] to-[#002241]',
    initial: 'C',
    aliases: ['citi', 'citibank'],
  },
  {
    id: 'bank-sc',
    name: 'Standard Chartered',
    type: 'BANK_ACCOUNT',
    color: '#009739',
    gradient: 'from-[#009739] to-[#006024]',
    initial: 'S',
    aliases: ['standard chartered', 'sc', 'stan chart'],
  },
  {
    id: 'bank-other',
    name: 'Other Bank',
    type: 'BANK_ACCOUNT',
    color: '#64748B',
    gradient: 'from-[#64748B] to-[#475569]',
    initial: 'B',
    aliases: ['other', 'unknown'],
  },

  // ==========================================
  // CREDIT CARDS
  // ==========================================
  {
    id: 'card-amex',
    name: 'American Express',
    type: 'CREDIT_CARD',
    color: '#006FCF',
    gradient: 'from-[#006FCF] to-[#004A8F]',
    initial: 'A',
    aliases: ['amex', 'american express', 'platinum', 'gold'],
    isPopular: true
  },
  {
    id: 'card-hdfc',
    name: 'HDFC Credit Card',
    type: 'CREDIT_CARD',
    color: '#004C8F',
    gradient: 'from-[#004C8F] to-[#002D56]',
    initial: 'H',
    aliases: ['hdfc', 'infinia', 'diners club', 'regalia', 'millennia'],
    isPopular: true
  },
  {
    id: 'card-sbi',
    name: 'SBI Card',
    type: 'CREDIT_CARD',
    color: '#00B5E2',
    gradient: 'from-[#00B5E2] to-[#0089AB]',
    initial: 'S',
    aliases: ['sbi', 'sbi card', 'simplysave', 'simplyclick', 'elite'],
    isPopular: true
  },
  {
    id: 'card-icici',
    name: 'ICICI Credit Card',
    type: 'CREDIT_CARD',
    color: '#F26522',
    gradient: 'from-[#F26522] to-[#C94711]',
    initial: 'I',
    aliases: ['icici', 'amazon pay', 'rubyx', 'sapphiro', 'emeralde', 'coral'],
    isPopular: true
  },
  {
    id: 'card-axis',
    name: 'Axis Credit Card',
    type: 'CREDIT_CARD',
    color: '#97144D',
    gradient: 'from-[#97144D] to-[#6A0C35]',
    initial: 'A',
    aliases: ['axis', 'flipkart axis', 'magnus', 'atlas', 'vistara', 'select'],
    isPopular: true
  },
  {
    id: 'card-kotak',
    name: 'Kotak Credit Card',
    type: 'CREDIT_CARD',
    color: '#ED1C24',
    gradient: 'from-[#ED1C24] to-[#B3131A]',
    initial: 'K',
    aliases: ['kotak', 'zen', 'white', 'league'],
  },
  {
    id: 'card-sc',
    name: 'Standard Chartered Card',
    type: 'CREDIT_CARD',
    color: '#009739',
    gradient: 'from-[#009739] to-[#006024]',
    initial: 'S',
    aliases: ['standard chartered', 'sc', 'smart', 'ultimate'],
  },
  {
    id: 'card-indusind',
    name: 'IndusInd Credit Card',
    type: 'CREDIT_CARD',
    color: '#841E34',
    gradient: 'from-[#841E34] to-[#591020]',
    initial: 'I',
    aliases: ['indusind', 'pinnacle', 'legend', 'aura'],
  },
  {
    id: 'card-onecard',
    name: 'OneCard',
    type: 'CREDIT_CARD',
    color: '#000000',
    gradient: 'from-[#1A1A1A] to-[#000000]',
    initial: 'O',
    aliases: ['onecard', 'one card', 'metal'],
    isPopular: true
  },
  {
    id: 'card-other',
    name: 'Other Credit Card',
    type: 'CREDIT_CARD',
    color: '#64748B',
    gradient: 'from-[#64748B] to-[#475569]',
    initial: 'C',
    aliases: ['other', 'unknown'],
  }
];
