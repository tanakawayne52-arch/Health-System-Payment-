import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { ecopayTransactions } from '../data/ecopay-transactions';

// Helper function to convert Excel serial date to readable date
const excelDateToJSDate = (serial: number): string => {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  const fractionalDay = serial - Math.floor(serial);
  const totalSeconds = Math.floor(fractionalDay * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  dateInfo.setUTCHours(hours, minutes, seconds);

  return dateInfo.toLocaleString();
};

const EcopayTransactions: React.FC = () => {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Ecopay Transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>CR/DR</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Post Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transactor</TableHead>
                <TableHead>Currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ecopayTransactions.map((txn, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{txn.transferId}</TableCell>
                  <TableCell className="text-xs">{excelDateToJSDate(txn.transferOn)}</TableCell>
                  <TableCell className="text-xs">{txn.serviceName}</TableCell>
                  <TableCell className="text-xs">{txn.transactionType}</TableCell>
                  <TableCell className="text-xs">
                    <span className={`px-2 py-1 rounded ${txn.crDr === 'CR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {txn.crDr}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{txn.mobileNumber}</TableCell>
                  <TableCell className="text-xs font-semibold">{txn.transactionValue.toLocaleString()} {txn.currency}</TableCell>
                  <TableCell className="text-xs">{txn.postBalance.toLocaleString()} {txn.currency}</TableCell>
                  <TableCell className="text-xs">{txn.transferStatus}</TableCell>
                  <TableCell className="text-xs">{txn.transactor}</TableCell>
                  <TableCell className="text-xs">{txn.currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EcopayTransactions;
