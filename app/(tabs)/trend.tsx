import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../supabaseClient';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';

interface Athlete {
  fincode: number;
  name: string;
}

interface AttendanceData {
  month: string;
  attendance_percentage: number;
}

const SEASON_START = '2024-09';
const SEASON_END = '2025-08';

function getSeasonMonths(start: string, end: string) {
  const result: string[] = [];
  let current = new Date(start + '-01');
  const endDate = new Date(end + '-01');
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = (current.getMonth() + 1).toString().padStart(2, '0');
    result.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }
  return result;
}

const months = getSeasonMonths(SEASON_START, SEASON_END);

export default function TrendScreen() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFincode, setSelectedFincode] = useState<'all' | number>('all');
  const [selectedType, setSelectedType] = useState<'Swim' | 'Gym'>('Swim');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'ASS' | 'EA' | 'EB' | 'Prop'>('all');
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      let query = supabase.from('athletes').select('fincode, name, groups').order('name', { ascending: true });
      if (selectedGroup !== 'all') {
        query = query.eq('groups', selectedGroup);
      }
      const { data, error } = await query;
      if (error) {
        setError(error.message);
      } else {
        setAthletes(data || []);
      }
    };
    fetchAthletes();
  }, [selectedGroup]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);
      if (selectedFincode === 'all') {
        setChartData([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('get_monthly_attendance_percentage', {
        fincode_input: selectedFincode,
        session_type_input: selectedType,
      });
      if (error) {
        setError(error.message);
        setChartData([]);
      } else {
        setChartData(data || []);
      }
      setLoading(false);
    };
    fetchAttendanceData();
  }, [selectedFincode, selectedType]);

  // Chart dimensions
  const chartTopPadding = 24;
  const chartHeight = 220;
  // Make bars thinner to fit 12 in the visible width
  const visibleBars = 12;
  const screenWidth = Dimensions.get('window').width;
  const barGap = 4;
  const barWidth = Math.floor((screenWidth - 64 - (visibleBars - 1) * barGap) / visibleBars);
  const chartWidth = months.length * (barWidth + barGap) + 32;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance Trend (Sep 2024 – Aug 2025)</Text>
      <View style={styles.filterRow}>
        <Text style={styles.label}>Group:</Text>
        <Picker
          selectedValue={selectedGroup}
          style={styles.picker}
          onValueChange={itemValue => setSelectedGroup(itemValue as any)}
        >
          <Picker.Item label="All groups" value="all" />
          <Picker.Item label="ASS" value="ASS" />
          <Picker.Item label="EA" value="EA" />
          <Picker.Item label="EB" value="EB" />
          <Picker.Item label="Prop" value="Prop" />
        </Picker>
        <Text style={styles.label}>Filter by athlete:</Text>
        <Picker
          selectedValue={selectedFincode}
          style={styles.picker}
          onValueChange={itemValue => setSelectedFincode(itemValue === 'all' ? 'all' : Number(itemValue))}
        >
          <Picker.Item label="Select an athlete" value="all" />
          {athletes.map(a => (
            <Picker.Item key={a.fincode} label={`${a.name} (${a.fincode})`} value={a.fincode} />
          ))}
        </Picker>
        <Text style={styles.label}>Session type:</Text>
        <Picker
          selectedValue={selectedType}
          style={styles.picker}
          onValueChange={itemValue => setSelectedType(itemValue as 'Swim' | 'Gym')}
        >
          <Picker.Item label="Swim" value="Swim" />
          <Picker.Item label="Gym" value="Gym" />
        </Picker>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#ffd33d" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView horizontal style={{ width: '100%' }} contentContainerStyle={{ minWidth: chartWidth }}>
          <Svg width={chartWidth} height={chartHeight + 60} style={{ backgroundColor: '#f8f8ff', borderRadius: 8 }}>
            {/* Y axis grid */}
            {[0, 20, 40, 60, 80, 100].map(y => (
              <G key={y}>
                <Line
                  x1={0}
                  x2={chartWidth}
                  y1={chartTopPadding + chartHeight - (y / 100) * chartHeight}
                  y2={chartTopPadding + chartHeight - (y / 100) * chartHeight}
                  stroke="#eee"
                />
                <SvgText x={8} y={chartTopPadding + chartHeight - (y / 100) * chartHeight + 5} fontSize={12} textAnchor="end" fill="#333">{y}%</SvgText>
              </G>
            ))}
            {/* Bars */}
            {months.map((m, i) => {
              const data = chartData.find(cd => cd.month === m);
              const val = data?.attendance_percentage || 0;
              const barColor = val >= 80 ? '#4caf50' : '#f44336';
              const barMaxHeight = chartHeight - 12;
              const barActualHeight = (val / 100) * barMaxHeight;
              const barY = chartTopPadding + chartHeight - barActualHeight;
              return (
                <G key={m}>
                  <Rect
                    x={i * (barWidth + barGap) + 32}
                    y={barY}
                    width={barWidth}
                    height={barActualHeight}
                    fill={barColor}
                    rx={6}
                  />
                  <SvgText
                    x={i * (barWidth + barGap) + 32 + barWidth / 2}
                    y={chartTopPadding + chartHeight + 16}
                    fontSize={12}
                    textAnchor="middle"
                    fill="#333"
                  >
                    {m.slice(5)}
                  </SvgText>
                  {val > 0 && (
                    <SvgText
                      x={i * (barWidth + barGap) + 32 + barWidth / 2}
                      y={barY - 8}
                      fontSize={12}
                      textAnchor="middle"
                      fill="#333"
                    >
                      {`${val}%`}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd33d',
    marginVertical: 10,
    textAlign: 'center',
  },
  filterRow: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    marginTop: 8,
  },
  picker: {
    color: '#fff',
    backgroundColor: '#444',
    marginVertical: 4,
  },
  errorText: {
    color: 'red',
    marginVertical: 8,
    textAlign: 'center',
  },
});
