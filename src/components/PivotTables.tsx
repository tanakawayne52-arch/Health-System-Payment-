import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';

const PivotTables: React.FC = React.memo(() => {

  return (
    <div className="space-y-8">
      {/* National Level Pivot Tables */}
      <div>
        <h2 className="text-2xl font-bold mb-6">National Level Pivot Tables</h2>
        
        {/* Table 1: VHWs by Province and Gender */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>VHWs by Province and Gender</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Province</TableHead>
                  <TableHead className="font-bold">No. VHWs</TableHead>
                  <TableHead className="font-bold">F</TableHead>
                  <TableHead className="font-bold">M</TableHead>
                  <TableHead className="font-bold">(blank)</TableHead>
                  <TableHead className="font-bold">Grand Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { province: 'BULAWAYO', total: 283, f: 130, m: 19, blank: 134 },
                  { province: 'HARARE', total: 690, f: 637, m: 53, blank: null },
                  { province: 'MANICALAND', total: 3354, f: 2915, m: 430, blank: 9 },
                  { province: 'MASH  CENTRAL', total: 2178, f: 1630, m: 548, blank: null },
                  { province: 'MASH EAST', total: 2929, f: 2513, m: 416, blank: null },
                  { province: 'MASH WEST', total: 3088, f: 2267, m: 685, blank: 136 },
                  { province: 'MASVINGO', total: 2950, f: 2530, m: 393, blank: 27 },
                  { province: 'MAT NORTH', total: 1590, f: 1322, m: 267, blank: 1 },
                  { province: 'MAT SOUTH', total: 1605, f: 1505, m: 100, blank: null },
                  { province: 'MIDLANDS', total: 2096, f: 1594, m: 495, blank: 7 },
                  { province: 'Grand Total', total: 20763, f: 17043, m: 3406, blank: 314 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{row.province}</TableCell>
                    <TableCell>{row.total?.toLocaleString()}</TableCell>
                    <TableCell>{row.f?.toLocaleString()}</TableCell>
                    <TableCell>{row.m?.toLocaleString()}</TableCell>
                    <TableCell>{row.blank?.toLocaleString()}</TableCell>
                    <TableCell>{row.total?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Table 2: VHWs by Province and Age Group */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>VHWs by Province and Age Group</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Province</TableHead>
                  <TableHead className="font-bold">&lt;20 or (blank)</TableHead>
                  <TableHead className="font-bold">20-29</TableHead>
                  <TableHead className="font-bold">30-39</TableHead>
                  <TableHead className="font-bold">40-49</TableHead>
                  <TableHead className="font-bold">50-59</TableHead>
                  <TableHead className="font-bold">60-70</TableHead>
                  <TableHead className="font-bold">&gt;70</TableHead>
                  <TableHead className="font-bold">Grand Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { province: 'BULAWAYO', lt20: 78, a2029: 9, a3039: 21, a4049: 66, a5059: 59, a6070: 39, gt70: 11, total: 283 },
                  { province: 'HARARE', lt20: 3, a2029: 51, a3039: 94, a4049: 190, a5059: 161, a6070: 114, gt70: 77, total: 690 },
                  { province: 'MANICALAND', lt20: 26, a2029: 29, a3039: 338, a4049: 1099, a5059: 1283, a6070: 423, gt70: 156, total: 3354 },
                  { province: 'MASH  CENTRAL', lt20: 4, a2029: 13, a3039: 194, a4049: 756, a5059: 860, a6070: 267, gt70: 84, total: 2178 },
                  { province: 'MASH EAST', lt20: 82, a2029: 9, a3039: 236, a4049: 854, a5059: 1027, a6070: 424, gt70: 297, total: 2929 },
                  { province: 'MASH WEST', lt20: 114, a2029: 21, a3039: 307, a4049: 1023, a5059: 1213, a6070: 332, gt70: 78, total: 3088 },
                  { province: 'MASVINGO', lt20: 20, a2029: 55, a3039: 376, a4049: 1092, a5059: 1067, a6070: 282, gt70: 58, total: 2950 },
                  { province: 'MAT NORTH', lt20: 8, a2029: 12, a3039: 112, a4049: 437, a5059: 639, a6070: 332, gt70: 50, total: 1590 },
                  { province: 'MAT SOUTH', lt20: 7, a2029: 25, a3039: 184, a4049: 508, a5059: 649, a6070: 194, gt70: 38, total: 1605 },
                  { province: 'MIDLANDS', lt20: 30, a2029: 8, a3039: 163, a4049: 553, a5059: 928, a6070: 348, gt70: 66, total: 2096 },
                  { province: 'Grand Total', lt20: 372, a2029: 232, a3039: 2025, a4049: 6578, a5059: 7886, a6070: 2755, gt70: 915, total: 20763 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{row.province}</TableCell>
                    <TableCell>{row.lt20?.toLocaleString()}</TableCell>
                    <TableCell>{row.a2029?.toLocaleString()}</TableCell>
                    <TableCell>{row.a3039?.toLocaleString()}</TableCell>
                    <TableCell>{row.a4049?.toLocaleString()}</TableCell>
                    <TableCell>{row.a5059?.toLocaleString()}</TableCell>
                    <TableCell>{row.a6070?.toLocaleString()}</TableCell>
                    <TableCell>{row.gt70?.toLocaleString()}</TableCell>
                    <TableCell>{row.total?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Table 3: VHWs by Province - Data Quality Count */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>VHWs by Province - Data Quality Count</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Province</TableHead>
                  <TableHead className="font-bold">Count of DATAQUALITY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { province: 'MANICALAND', count: 3374 },
                  { province: 'MASH EAST', count: 3259 },
                  { province: 'MASH WEST', count: 3251 },
                  { province: 'MASVINGO', count: 3139 },
                  { province: 'MIDLANDS', count: 2318 },
                  { province: 'MASH  CENTRAL', count: 2179 },
                  { province: 'MAT SOUTH', count: 1872 },
                  { province: 'MAT NORTH', count: 1589 },
                  { province: 'HARARE', count: 690 },
                  { province: 'BULAWAYO', count: 357 },
                  { province: 'Grand Total', count: 22028 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{row.province}</TableCell>
                    <TableCell>{row.count?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Table 4: Active VHWs by Quarter (Province) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active VHWs by Quarter (Province)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Province</TableHead>
                  <TableHead className="font-bold">Q1 Active VHWs</TableHead>
                  <TableHead className="font-bold">Q2 Active VHWs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { province: 'BULAWAYO', q1: 280, q2: 281 },
                  { province: 'HARARE', q1: 631, q2: 631 },
                  { province: 'MANICALAND', q1: 3320, q2: 3322 },
                  { province: 'MASH  CENTRAL', q1: 2157, q2: 2157 },
                  { province: 'MASH EAST', q1: 2899, q2: 2896 },
                  { province: 'MASH WEST', q1: 2987, q2: 2982 },
                  { province: 'MASVINGO', q1: 2713, q2: 2775 },
                  { province: 'MAT NORTH', q1: 1555, q2: 1541 },
                  { province: 'MAT SOUTH', q1: 1588, q2: 1592 },
                  { province: 'MIDLANDS', q1: 2040, q2: 2040 },
                  { province: 'Grand Total', q1: 20170, q2: 20217 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{row.province}</TableCell>
                    <TableCell>{row.q1?.toLocaleString()}</TableCell>
                    <TableCell>{row.q2?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Table 5: VHWs by Gender */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>VHWs by Gender</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Gender</TableHead>
                  <TableHead className="font-bold">No. VHWs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { gender: 'F', count: 17043 },
                  { gender: 'M', count: 3406 },
                  { gender: '(blank)', count: 314 },
                  { gender: 'Grand Total', count: 20763 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold">{row.gender}</TableCell>
                    <TableCell>{row.count?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Provincial Level Pivot Tables */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Provincial Level Pivot Tables</h2>
        
        {/* Mash Central Province */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">MASH  CENTRAL Province</h3>
          
          {/* VHWs by District */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>VHWs by District</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">District</TableHead>
                    <TableHead className="font-bold">No. VHWs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { district: 'BINDURA', count: 275 },
                    { district: 'CENTENARY', count: 262 },
                    { district: 'GURUVE', count: 156 },
                    { district: 'MAZOWE', count: 419 },
                    { district: 'MBIRE', count: 174 },
                    { district: 'MOUNT DARWIN', count: 404 },
                    { district: 'RUSHINGA', count: 227 },
                    { district: 'SHAMVA', count: 261 },
                    { district: 'Grand Total', count: 2178 },
                  ].map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{row.district}</TableCell>
                      <TableCell>{row.count?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* VHWs by District and Age Group */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>VHWs by District and Age Group</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">District</TableHead>
                    <TableHead className="font-bold">&lt;20 or (blank)</TableHead>
                    <TableHead className="font-bold">20-29</TableHead>
                    <TableHead className="font-bold">30-39</TableHead>
                    <TableHead className="font-bold">40-49</TableHead>
                    <TableHead className="font-bold">50-59</TableHead>
                    <TableHead className="font-bold">60-70</TableHead>
                    <TableHead className="font-bold">&gt;70</TableHead>
                    <TableHead className="font-bold">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { district: 'BINDURA', lt20: 1, a2029: 3, a3039: 28, a4049: 104, a5059: 67, a6070: 59, gt70: 13, total: 275 },
                    { district: 'CENTENARY', lt20: null, a2029: 1, a3039: 24, a4049: 94, a5059: 106, a6070: 30, gt70: 7, total: 262 },
                    { district: 'GURUVE', lt20: null, a2029: null, a3039: 4, a4049: 47, a5059: 74, a6070: 27, gt70: 4, total: 156 },
                    { district: 'MAZOWE', lt20: 1, a2029: 2, a3039: 38, a4049: 121, a5059: 151, a6070: 76, gt70: 30, total: 419 },
                    { district: 'MBIRE', lt20: null, a2029: null, a3039: 22, a4049: 87, a5059: 60, a6070: 3, gt70: 2, total: 174 },
                    { district: 'MOUNT DARWIN', lt20: 1, a2029: 1, a3039: 28, a4049: 121, a5059: 191, a6070: 42, gt70: 20, total: 404 },
                    { district: 'RUSHINGA', lt20: null, a2029: 1, a3039: 11, a4049: 89, a5059: 117, a6070: 9, gt70: null, total: 227 },
                    { district: 'SHAMVA', lt20: 1, a2029: 5, a3039: 39, a4049: 93, a5059: 94, a6070: 21, gt70: 8, total: 261 },
                    { district: 'Grand Total', lt20: 4, a2029: 13, a3039: 194, a4049: 756, a5059: 860, a6070: 267, gt70: 84, total: 2178 },
                  ].map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{row.district}</TableCell>
                      <TableCell>{row.lt20?.toLocaleString()}</TableCell>
                      <TableCell>{row.a2029?.toLocaleString()}</TableCell>
                      <TableCell>{row.a3039?.toLocaleString()}</TableCell>
                      <TableCell>{row.a4049?.toLocaleString()}</TableCell>
                      <TableCell>{row.a5059?.toLocaleString()}</TableCell>
                      <TableCell>{row.a6070?.toLocaleString()}</TableCell>
                      <TableCell>{row.gt70?.toLocaleString()}</TableCell>
                      <TableCell>{row.total?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* VHWs by District and Gender */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>VHWs by District and Gender</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">District</TableHead>
                    <TableHead className="font-bold">F</TableHead>
                    <TableHead className="font-bold">M</TableHead>
                    <TableHead className="font-bold">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { district: 'BINDURA', f: 243, m: 32, total: 275 },
                    { district: 'CENTENARY', f: 203, m: 59, total: 262 },
                    { district: 'GURUVE', f: 117, m: 39, total: 156 },
                    { district: 'MAZOWE', f: 394, m: 25, total: 419 },
                    { district: 'MBIRE', f: 98, m: 76, total: 174 },
                    { district: 'MOUNT DARWIN', f: 230, m: 174, total: 404 },
                    { district: 'RUSHINGA', f: 121, m: 106, total: 227 },
                    { district: 'SHAMVA', f: 224, m: 37, total: 261 },
                    { district: 'Grand Total', f: 1630, m: 548, total: 2178 },
                  ].map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{row.district}</TableCell>
                      <TableCell>{row.f?.toLocaleString()}</TableCell>
                      <TableCell>{row.m?.toLocaleString()}</TableCell>
                      <TableCell>{row.total?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Active VHWs by Quarter (District) */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Active VHWs by Quarter (District)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">District</TableHead>
                    <TableHead className="font-bold">Average of % Active Q1</TableHead>
                    <TableHead className="font-bold">Sum of % Active Q2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { district: 'BINDURA', q1: 275, q2: 275 },
                    { district: 'CENTENARY', q1: 262, q2: 262 },
                    { district: 'GURUVE', q1: 150, q2: 150 },
                    { district: 'MAZOWE', q1: 419, q2: 419 },
                    { district: 'MBIRE', q1: 165, q2: 165 },
                    { district: 'MOUNT DARWIN', q1: 403, q2: 403 },
                    { district: 'RUSHINGA', q1: 222, q2: 222 },
                    { district: 'SHAMVA', q1: 261, q2: 261 },
                    { district: 'Grand Total', q1: 2157, q2: 2157 },
                  ].map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{row.district}</TableCell>
                      <TableCell>{row.q1?.toLocaleString()}</TableCell>
                      <TableCell>{row.q2?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Mat North Province */}
        <div>
          <h3 className="text-xl font-semibold mb-4">MAT NORTH Province</h3>
          
          {/* VHWs by District and Age Group */}
          <Card>
            <CardHeader>
              <CardTitle>VHWs by District and Age Group</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">District</TableHead>
                    <TableHead className="font-bold">&lt;20 or (blank)</TableHead>
                    <TableHead className="font-bold">20-29</TableHead>
                    <TableHead className="font-bold">30-39</TableHead>
                    <TableHead className="font-bold">40-49</TableHead>
                    <TableHead className="font-bold">50-59</TableHead>
                    <TableHead className="font-bold">60-70</TableHead>
                    <TableHead className="font-bold">&gt;70</TableHead>
                    <TableHead className="font-bold">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { district: 'BINGA', lt20: 3, a2029: null, a3039: 8, a4049: 112, a5059: 149, a6070: 22, gt70: null, total: 294 },
                    { district: 'BUBI', lt20: 1, a2029: 4, a3039: 20, a4049: 48, a5059: 68, a6070: 50, gt70: 13, total: 204 },
                    { district: 'HWANGE', lt20: 2, a2029: 3, a3039: 36, a4049: 73, a5059: 86, a6070: 34, gt70: null, total: 234 },
                    { district: 'LUPANE', lt20: null, a2029: 2, a3039: 12, a4049: 50, a5059: 82, a6070: 48, gt70: 3, total: 197 },
                    { district: 'NKAYI', lt20: 2, a2029: null, a3039: 6, a4049: 37, a5059: 91, a6070: 48, gt70: 11, total: 195 },
                    { district: 'TSHOLOTSHO', lt20: null, a2029: null, a3039: 3, a4049: 46, a5059: 104, a6070: 71, gt70: 10, total: 234 },
                    { district: 'UMGUZA', lt20: null, a2029: 3, a3039: 27, a4049: 71, a5059: 59, a6070: 59, gt70: 13, total: 232 },
                    { district: 'Grand Total', lt20: 8, a2029: 12, a3039: 112, a4049: 437, a5059: 639, a6070: 332, gt70: 50, total: 1590 },
                  ].map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{row.district}</TableCell>
                      <TableCell>{row.lt20?.toLocaleString()}</TableCell>
                      <TableCell>{row.a2029?.toLocaleString()}</TableCell>
                      <TableCell>{row.a3039?.toLocaleString()}</TableCell>
                      <TableCell>{row.a4049?.toLocaleString()}</TableCell>
                      <TableCell>{row.a5059?.toLocaleString()}</TableCell>
                      <TableCell>{row.a6070?.toLocaleString()}</TableCell>
                      <TableCell>{row.gt70?.toLocaleString()}</TableCell>
                      <TableCell>{row.total?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

export default PivotTables;