import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useVhwMasterList } from '../hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import PieChartComponent from '../components/PieChartComponent';
import PivotTables from '../components/PivotTables';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0d9488', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const VhwNationalDashboard: React.FC = () => {
  const { isNationalLevel } = useAuth();
  const [vhwMasterList] = useVhwMasterList();
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  
  if (!isNationalLevel) {
    return <Navigate to="/" replace />;
  }
  // Calculate some basic stats from the master list
  const totalRecords = vhwMasterList.length;
  const provinces = [...new Set(vhwMasterList.map(record => record.province))].filter(p => p);
  
  // Filter VHW records by selected province
  const filteredVhwRecords = selectedProvince === 'all' 
    ? vhwMasterList 
    : vhwMasterList.filter(record => record.province === selectedProvince);

  const nationalStats = [
    { label: 'Total VHWs', value: totalRecords },
    { label: 'Provinces Covered', value: provinces.length },
    { label: 'Filtered VHWs', value: filteredVhwRecords.length },
  ];

  // Create a simple summary of payment categories
  const paymentCategoryCounts = vhwMasterList.reduce((acc, record) => {
    acc[record.paymentCategory] = (acc[record.paymentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for pie chart
  const paymentCategoryData: Array<{ name: string; value: number; color: string }> = Object.entries(paymentCategoryCounts)
    .map(([category, count], index) => ({
      name: category,
      value: count,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Count per province with additional metrics
  const provinceMetrics = vhwMasterList.reduce((acc, record) => {
    if (record.province) {
      if (!acc[record.province]) {
        acc[record.province] = {
          totalVhw: 0,
          districts: new Set<string>(),
          healthCentres: new Set<string>(),
          activeQ1Q2: 0,
          fullyPaid: 0,
        };
      }
      acc[record.province].totalVhw += 1;
      if (record.district) acc[record.province].districts.add(record.district);
      if (record.healthCentre) acc[record.province].healthCentres.add(record.healthCentre);
      if (record.activeQ1 && record.activeQ2) acc[record.province].activeQ1Q2 += 1;
      if (record.paymentCategory === 'Correct') acc[record.province].fullyPaid += 1;
    }
    return acc;
  }, {} as Record<string, {
    totalVhw: number;
    districts: Set<string>;
    healthCentres: Set<string>;
    activeQ1Q2: number;
    fullyPaid: number;
  }>);

  const provinceData: Array<{
    province: string;
    count: number;
    numDistricts: number;
    numHealthCentres: number;
    activeQ1Q2: number;
    fullyPaid: number;
  }> = Object.entries(provinceMetrics).map(([province, metrics]) => ({
    province,
    count: metrics.totalVhw,
    numDistricts: metrics.districts.size,
    numHealthCentres: metrics.healthCentres.size,
    activeQ1Q2: metrics.activeQ1Q2,
    fullyPaid: metrics.fullyPaid,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Village Health Workers - National Level Dashboard</h1>
      </div>

      {/* Province Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Province</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {provinces.map((province, index) => (
                <SelectItem key={index} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nationalStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Categories Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={paymentCategoryData}
              height={350}
              showLabel={true}
              showLegend={true}
              showTooltip={true}
              legendPosition="right"
              colors={COLORS}
              outerRadius={90}
              paddingAngle={2}
              tooltipFormatter={(value) => value.toLocaleString()}
            />
          </CardContent>
        </Card>

        {/* VHWs per Province Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>VHWs per Province</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="province" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Categories Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Categories Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(paymentCategoryCounts).map(([category, count], index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-lg font-semibold">{category}</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provinces List */}
      <Card>
        <CardHeader>
          <CardTitle>Provinces Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {provinceData.map((provinceInfo, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-lg font-semibold text-gray-900">{provinceInfo.province}</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Total VHWs: <span className="font-semibold text-gray-900">{provinceInfo.count}</span></p>
                  <p>Districts: <span className="font-semibold text-gray-900">{provinceInfo.numDistricts}</span></p>
                  <p>Health Centres: <span className="font-semibold text-gray-900">{provinceInfo.numHealthCentres}</span></p>
                  <p>Active Q1 & Q2: <span className="font-semibold text-gray-900">{provinceInfo.activeQ1Q2}</span></p>
                  <p>Fully Paid: <span className="font-semibold text-gray-900">{provinceInfo.fullyPaid}</span></p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VHW Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>VHW Records - {selectedProvince === 'all' ? 'All Provinces' : selectedProvince}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">ID Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Province</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">District</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Health Centre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Phone Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Payment Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {filteredVhwRecords.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{record.firstName} {record.lastName}</td>
                    <td className="px-4 py-3 text-sm">{record.idNumber}</td>
                    <td className="px-4 py-3 text-sm">{record.province}</td>
                    <td className="px-4 py-3 text-sm">{record.district}</td>
                    <td className="px-4 py-3 text-sm">{record.healthCentre}</td>
                    <td className="px-4 py-3 text-sm">{record.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.paymentCategory === 'Correct' ? 'bg-green-100 text-green-800' :
                        record.paymentCategory.includes('Over') ? 'bg-yellow-100 text-yellow-800' :
                        record.paymentCategory.includes('Under') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.paymentCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.dataQuality === 'Good' ? 'bg-green-100 text-green-800' :
                        record.dataQuality === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.dataQuality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Tables */}
      <div className="mt-8">
        <PivotTables />
      </div>
    </div>
  );
};

export default VhwNationalDashboard;
