import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { VhwRecord } from '@/types/vhw';

interface PivotTablesProps {
  data: VhwRecord[];
}

const AGE_GROUPS = ['<20 or (blank)', '20-29', '30-39', '40-49', '50-59', '60-70', '>70'] as const;

const normalizeGender = (sex?: string) => {
  if (!sex) return 'Unknown';
  const normalized = sex.trim().toUpperCase();
  if (normalized === 'F') return 'Female';
  if (normalized === 'M') return 'Male';
  return 'Unknown';
};

const getAgeGroup = (age?: number | null) => {
  if (age === null || age === undefined || age < 20) return '<20 or (blank)';
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age <= 70) return '60-70';
  return '>70';
};

import { canonicalizeOrRaw } from '@/utils/province';

const toProvinceLabel = (province: string) => canonicalizeOrRaw(province) || 'Unknown';

const PivotTables: React.FC<PivotTablesProps> = React.memo(({ data }) => {
  const provinces = useMemo(() => {
    const unique = Array.from(new Set(data.map(record => toProvinceLabel(record.province))));
    const order = [
      'BULAWAYO', 'HARARE', 'MANICALAND', 'MASHONALAND CENTRAL', 'MASHONALAND EAST',
      'MASHONALAND WEST', 'MASVINGO', 'MATABELELAND NORTH', 'MATABELELAND SOUTH', 'MIDLANDS',
    ];
    return unique.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA !== -1 || indexB !== -1) return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      return a.localeCompare(b);
    });
  }, [data]);

  const [selectedNationalTables, setSelectedNationalTables] = useState<string[]>(['province-gender', 'province-age']);
  const [selectedProvincialTables, setSelectedProvincialTables] = useState<string[]>(['district-count']);
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [isNationalCollapsed, setIsNationalCollapsed] = useState(false);
  const [isProvincialCollapsed, setIsProvincialCollapsed] = useState(false);

  const filteredData = useMemo(() => {
    if (selectedProvince === 'ALL') return data;
    return data.filter(record => record.province === selectedProvince);
  }, [data, selectedProvince]);

  const nationalByProvinceGender = useMemo(() => {
    const map = new Map<string, { province: string; total: number; female: number; male: number; unknown: number }>();
    filteredData.forEach(record => {
      const province = toProvinceLabel(record.province);
      const entry = map.get(province) || { province, total: 0, female: 0, male: 0, unknown: 0 };
      entry.total += 1;
      const gender = normalizeGender(record.sex);
      if (gender === 'Female') entry.female += 1;
      else if (gender === 'Male') entry.male += 1;
      else entry.unknown += 1;
      map.set(province, entry);
    });
    const rows = Array.from(map.values()).sort((a, b) => a.province.localeCompare(b.province));
    const totals = rows.reduce((acc, row) => ({
      province: 'Grand Total',
      total: acc.total + row.total,
      female: acc.female + row.female,
      male: acc.male + row.male,
      unknown: acc.unknown + row.unknown,
    }), { province: 'Grand Total', total: 0, female: 0, male: 0, unknown: 0 });
    return [...rows, totals];
  }, [filteredData]);

  const nationalByProvinceAge = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    const initialRow = AGE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), { province: '', total: 0 } as Record<string, number>);

    filteredData.forEach(record => {
      const province = toProvinceLabel(record.province);
      const ageGroup = getAgeGroup(record.age);
      const entry = map.get(province) || { ...initialRow, province };
      entry[ageGroup] = (entry[ageGroup] || 0) + 1;
      entry.total = (entry.total || 0) + 1;
      map.set(province, entry);
    });

    const rows = Array.from(map.values()).sort((a, b) => a.province.localeCompare(b.province));
    const totals = rows.reduce((acc, row) => {
      AGE_GROUPS.forEach(group => { acc[group] += row[group] ?? 0; });
      acc.total += row.total ?? 0;
      return acc;
    }, { province: 'Grand Total', total: 0, ...AGE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {}) } as Record<string, number>);
    return [...rows, totals];
  }, [filteredData]);

  const nationalQualityCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(record => {
      const province = toProvinceLabel(record.province);
      map.set(province, (map.get(province) || 0) + 1);
    });
    const rows = Array.from(map.entries())
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => a.province.localeCompare(b.province));
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return [...rows, { province: 'Grand Total', count: total }];
  }, [filteredData]);

  const nationalActiveCounts = useMemo(() => {
    const map = new Map<string, { province: string; q1: number; q2: number }>();
    filteredData.forEach(record => {
      const province = toProvinceLabel(record.province);
      const entry = map.get(province) || { province, q1: 0, q2: 0 };
      if (record.activeQ1 === 1) entry.q1 += 1;
      if (record.activeQ2 === 1) entry.q2 += 1;
      map.set(province, entry);
    });
    const rows = Array.from(map.values()).sort((a, b) => a.province.localeCompare(b.province));
    const totals = rows.reduce((acc, row) => ({ province: 'Grand Total', q1: acc.q1 + row.q1, q2: acc.q2 + row.q2 }), { province: 'Grand Total', q1: 0, q2: 0 });
    return [...rows, totals];
  }, [filteredData]);

  const nationalGenderSummary = useMemo(() => {
    const summary = filteredData.reduce((acc, record) => {
      const gender = normalizeGender(record.sex);
      acc[gender] = (acc[gender] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { Female: 0, Male: 0, Unknown: 0, total: 0 } as Record<string, number>);

    return [
      { label: 'Female', count: summary.Female },
      { label: 'Male', count: summary.Male },
      { label: 'Unknown', count: summary.Unknown },
      { label: 'Grand Total', count: summary.total },
    ];
  }, [filteredData]);

  const provincialDistrictCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(record => {
      const district = record.district || 'Unknown';
      map.set(district, (map.get(district) || 0) + 1);
    });
    const rows = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([district, count]) => ({ district, count }));
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return [...rows, { district: 'Grand Total', count: total }];
  }, [filteredData]);

  const provincialDistrictAge = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    const initial = AGE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), { district: '', total: 0 } as Record<string, number>);
    filteredData.forEach(record => {
      const district = record.district || 'Unknown';
      const ageGroup = getAgeGroup(record.age);
      const entry = map.get(district) || { ...initial, district };
      entry[ageGroup] = (entry[ageGroup] || 0) + 1;
      entry.total = (entry.total || 0) + 1;
      map.set(district, entry);
    });
    const rows = Array.from(map.values()).sort((a, b) => a.district.localeCompare(b.district));
    const totals = rows.reduce((acc, row) => {
      AGE_GROUPS.forEach(group => { acc[group] += row[group] || 0; });
      acc.total += row.total || 0;
      return acc;
    }, { district: 'Grand Total', total: 0, ...AGE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {}) } as Record<string, number>);
    return [...rows, totals];
  }, [filteredData]);

  const provincialDistrictGender = useMemo(() => {
    const map = new Map<string, { district: string; female: number; male: number; unknown: number }>();
    filteredData.forEach(record => {
      const district = record.district || 'Unknown';
      const entry = map.get(district) || { district, female: 0, male: 0, unknown: 0 };
      const gender = normalizeGender(record.sex);
      if (gender === 'Female') entry.female += 1;
      else if (gender === 'Male') entry.male += 1;
      else entry.unknown += 1;
      map.set(district, entry);
    });
    const rows = Array.from(map.values()).sort((a, b) => a.district.localeCompare(b.district));
    const totals = rows.reduce((acc, row) => ({ district: 'Grand Total', female: acc.female + row.female, male: acc.male + row.male, unknown: acc.unknown + row.unknown }), { district: 'Grand Total', female: 0, male: 0, unknown: 0 });
    return [...rows, totals];
  }, [filteredData]);

  const provincialDistrictActive = useMemo(() => {
    const map = new Map<string, { district: string; q1: number; q2: number }>();
    filteredData.forEach(record => {
      const district = record.district || 'Unknown';
      const entry = map.get(district) || { district, q1: 0, q2: 0 };
      if (record.activeQ1 === 1) entry.q1 += 1;
      if (record.activeQ2 === 1) entry.q2 += 1;
      map.set(district, entry);
    });
    const rows = Array.from(map.values()).sort((a, b) => a.district.localeCompare(b.district));
    const totals = rows.reduce((acc, row) => ({ district: 'Grand Total', q1: acc.q1 + row.q1, q2: acc.q2 + row.q2 }), { district: 'Grand Total', q1: 0, q2: 0 });
    return [...rows, totals];
  }, [filteredData]);

  const provincialDistrictQuality = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(record => {
      const district = record.district || 'Unknown';
      map.set(district, (map.get(district) || 0) + 1);
    });
    const rows = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([district, count]) => ({ district, count }));
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return [...rows, { district: 'Grand Total', count: total }];
  }, [filteredData]);

  const NATIONAL_TABLES = [
    { id: 'province-gender', label: 'VHWs by Province and Gender' },
    { id: 'province-age', label: 'VHWs by Province and Age Group' },
    { id: 'province-data-quality', label: 'VHWs by Province - Data Quality Count' },
    { id: 'active-quarter', label: 'Active VHWs by Quarter (Province)' },
    { id: 'gender', label: 'VHWs by Gender' },
  ];

  const PROVINCIAL_TABLES = [
    { id: 'district-count', label: 'VHWs by District' },
    { id: 'district-age', label: 'VHWs by District and Age Group' },
    { id: 'district-gender', label: 'VHWs by District and Gender' },
    { id: 'district-active-quarter', label: 'Active VHWs by Quarter (District)' },
    { id: 'district-data-quality', label: 'VHWs by District - Data Quality Count' },
  ];

  // Toggle table selection
  const toggleTable = (id: string, isNational: boolean) => {
    const setFn = isNational ? setSelectedNationalTables : setSelectedProvincialTables;
    const current = isNational ? selectedNationalTables : selectedProvincialTables;

    if (current.includes(id)) {
      setFn(current.filter(t => t !== id));
    } else {
      setFn([...current, id]);
    }
  };

  // Check if a table is selected
  const isTableSelected = (id: string, isNational: boolean) => {
    const current = isNational ? selectedNationalTables : selectedProvincialTables;
    return current.includes(id);
  };

  return (
    <div className="space-y-8">
      {/* National Level Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col gap-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Filter className="w-5 h-5 text-teal-600" />
              National Level Pivot Tables
            </h2>
            <button
              onClick={() => setIsNationalCollapsed(!isNationalCollapsed)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              {isNationalCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          {!isNationalCollapsed && (
            <div className="flex flex-col gap-4">
              {/* Province Filter Dropdown */}
              <div className="flex items-center gap-3 max-w-xs">
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Filter by Province:</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-900 font-medium"
                >
                  <option value="ALL">All Provinces</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              {/* Table Checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {NATIONAL_TABLES.map(table => (
                  <label
                    key={table.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 cursor-pointer transition-all group"
                  >
                    <input
                      type="checkbox"
                      checked={isTableSelected(table.id, true)}
                      onChange={() => toggleTable(table.id, true)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {table.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isNationalCollapsed && (
          <div className="p-6 space-y-6">
            {/* Table 1: VHWs by Province and Gender */}
            {isTableSelected('province-gender', true) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by Province and Gender</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Province</TableHead>
                        <TableHead className="font-bold">No. VHWs</TableHead>
                        <TableHead className="font-bold">Female</TableHead>
                        <TableHead className="font-bold">Male</TableHead>
                        <TableHead className="font-bold">Unknown</TableHead>
                        <TableHead className="font-bold">Grand Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nationalByProvinceGender.map((row, index) => (
                    <TableRow key={index} className={row.province === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                      <TableCell className="font-semibold">{row.province}</TableCell>
                      <TableCell>{row.total.toLocaleString()}</TableCell>
                      <TableCell>{row.female.toLocaleString()}</TableCell>
                      <TableCell>{row.male.toLocaleString()}</TableCell>
                      <TableCell>{row.unknown.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">{row.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Table 2: VHWs by Province and Age Group */}
            {isTableSelected('province-age', true) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by Province and Age Group</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Province</TableHead>
                        <TableHead className="font-bold">Unknown</TableHead>
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
                      {nationalByProvinceAge.map((row, index) => (
                        <TableRow key={index} className={row.province === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.province}</TableCell>
                          <TableCell>{(row['<20 or (blank)'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['20-29'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['30-39'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['40-49'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['50-59'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['60-70'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['>70'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row.total || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Table 3: VHWs by Province - Data Quality Count */}
            {isTableSelected('province-data-quality', true) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by Province - Data Quality Count</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Province</TableHead>
                        <TableHead className="font-bold">Count of DATAQUALITY</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nationalQualityCounts.map((row, index) => (
                        <TableRow key={index} className={row.province === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.province}</TableCell>
                          <TableCell>{row.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Table 4: Active VHWs by Quarter (Province) */}
            {isTableSelected('active-quarter', true) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active VHWs by Quarter (Province)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Province</TableHead>
                        <TableHead className="font-bold">Q1 Active VHWs</TableHead>
                        <TableHead className="font-bold">Q2 Active VHWs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nationalActiveCounts.map((row, index) => (
                        <TableRow key={index} className={row.province === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.province}</TableCell>
                          <TableCell>{row.q1.toLocaleString()}</TableCell>
                          <TableCell>{row.q2.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Table 5: VHWs by Gender */}
            {isTableSelected('gender', true) && (
              <Card className="border-slate-100 shadow-sm max-w-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by Gender</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Gender</TableHead>
                        <TableHead className="font-bold">No. VHWs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                          {nationalGenderSummary.map((row, index) => (
                        <TableRow key={index} className={row.label === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.label}</TableCell>
                          <TableCell>{row.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Provincial Level Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col gap-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Filter className="w-5 h-5 text-teal-600" />
              Provincial Level Pivot Tables
            </h2>
            <button
              onClick={() => setIsProvincialCollapsed(!isProvincialCollapsed)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              {isProvincialCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          {!isProvincialCollapsed && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PROVINCIAL_TABLES.map(table => (
                <label
                  key={table.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 cursor-pointer transition-all group"
                >
                  <input
                    type="checkbox"
                    checked={isTableSelected(table.id, false)}
                    onChange={() => toggleTable(table.id, false)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    {table.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {!isProvincialCollapsed && (
          <div className="p-6 space-y-6">
            {isTableSelected('district-count', false) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by District</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">District</TableHead>
                        <TableHead className="font-bold">No. VHWs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provincialDistrictCounts.map((row, index) => (
                        <TableRow key={index} className={row.district === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.district}</TableCell>
                          <TableCell>{row.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {isTableSelected('district-age', false) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by District and Age Group</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
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
                      {provincialDistrictAge.map((row, index) => (
                        <TableRow key={index} className={row.district === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.district}</TableCell>
                          <TableCell>{(row['<20 or (blank)'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['20-29'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['30-39'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['40-49'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['50-59'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['60-70'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row['>70'] || 0).toLocaleString()}</TableCell>
                          <TableCell>{(row.total || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {isTableSelected('district-gender', false) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by District and Gender</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">District</TableHead>
                        <TableHead className="font-bold">Female</TableHead>
                        <TableHead className="font-bold">Male</TableHead>
                        <TableHead className="font-bold">Unknown</TableHead>
                        <TableHead className="font-bold">Grand Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provincialDistrictGender.map((row, index) => (
                        <TableRow key={index} className={row.district === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.district}</TableCell>
                          <TableCell>{row.female.toLocaleString()}</TableCell>
                          <TableCell>{row.male.toLocaleString()}</TableCell>
                          <TableCell>{row.unknown.toLocaleString()}</TableCell>
                          <TableCell>{(row.female + row.male + row.unknown).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {isTableSelected('district-active-quarter', false) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active VHWs by Quarter (District)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">District</TableHead>
                        <TableHead className="font-bold">Q1 Active VHWs</TableHead>
                        <TableHead className="font-bold">Q2 Active VHWs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provincialDistrictActive.map((row, index) => (
                        <TableRow key={index} className={row.district === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.district}</TableCell>
                          <TableCell>{row.q1.toLocaleString()}</TableCell>
                          <TableCell>{row.q2.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {isTableSelected('district-data-quality', false) && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">VHWs by District - Data Quality Count</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">District</TableHead>
                        <TableHead className="font-bold">Count of DATAQUALITY</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provincialDistrictQuality.map((row, index) => (
                        <TableRow key={index} className={row.district === 'Grand Total' ? 'bg-slate-50 font-bold' : ''}>
                          <TableCell className="font-semibold">{row.district}</TableCell>
                          <TableCell>{row.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PivotTables;
