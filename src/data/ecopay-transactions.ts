// Ecopay transactions data
export interface EcopayTransaction {
  transferId: string;
  transferOn: number;
  serviceName: string;
  transactionType: string;
  crDr: string;
  mobileNumber: string;
  transactionValue: number;
  postBalance: number;
  transferStatus: string;
  transactor: string;
  currency: string;
}

// Convert Excel data (column letters to keys)
const rawData: Array<{[key: string]: any}> = [
  { "A": "OC250829.1417.K94121", "B": 45898.59601263889, "C": "O2C Transfer", "D": "MR", "E": "CR", "F": "103IND01", "G": 147101.5, "H": 148375.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97411", "B": 45904.50055107639, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 148193.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97411", "B": 45904.50055107639, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "774357625", "G": 45, "H": 148193.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97413", "B": 45904.500551087964, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 148284.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97413", "B": 45904.500551087964, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "783272080", "G": 45, "H": 148284.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97421", "B": 45904.50055486111, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "779809755", "G": 45, "H": 148057, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97421", "B": 45904.50055486111, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 148057, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97425", "B": 45904.50055619213, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "775522185", "G": 45, "H": 148111.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97425", "B": 45904.50055619213, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 148111.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97430", "B": 45904.500558796295, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 147966, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97430", "B": 45904.500558796295, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "779725524", "G": 45, "H": 147966, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97434", "B": 45904.500560960645, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "784503693", "G": 45, "H": 147784, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97434", "B": 45904.500560960645, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 147784, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97437", "B": 45904.50056166667, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "772553397", "G": 45, "H": 147829.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97437", "B": 45904.50056166667, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 147829.5, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97448", "B": 45904.50056564815, "C": "Salary Payment", "D": "MP", "E": "DR", "F": "775078047", "G": 45, "H": 147693, "I": "TS", "J": "783761273", "K": "USD" },
  { "A": "SY250904.1200.K97448", "B": 45904.50056564815, "C": "Salary Payment", "D": "Transaction Charge", "E": "DR", "F": "IND03", "G": 0.5, "H": 147693, "I": "TS", "J": "783761273", "K": "USD" },
];

export const ecopayTransactions: EcopayTransaction[] = rawData.map(item => ({
  transferId: item["A"],
  transferOn: item["B"],
  serviceName: item["C"],
  transactionType: item["D"],
  crDr: item["E"],
  mobileNumber: item["F"],
  transactionValue: item["G"],
  postBalance: item["H"],
  transferStatus: item["I"],
  transactor: item["J"],
  currency: item["K"],
}));

export const paymentScenarios = [
  {
    case: "A",
    title: "Inactive both quarters",
    scenarios: [
      { payment: 0, result: "Correct: inactive, no payment" },
      { payment: ">0", result: "Incorrect: inactive but paid" },
    ],
  },
  {
    case: "B",
    title: "Active one quarter only",
    scenarios: [
      { payment: 60, result: "Correct: 1 quarter paid" },
      { payment: "<60", result: "Underpaid for 1 quarter" },
      { payment: ">60", result: "Overpaid for 1 quarter" },
    ],
  },
  {
    case: "C",
    title: "Active both quarters",
    scenarios: [
      { payment: 0, result: "No payment" },
      { payment: "1-59", result: "Partial payment for 1 quarter" },
      { payment: 60, result: "Full payment for 1 quarter only" },
      { payment: "61-119", result: "Underpaid for 2 quarters" },
      { payment: 120, result: "Correct: fully paid for 2 quarters" },
      { payment: ">120", result: "Overpayment" },
    ],
  },
];
