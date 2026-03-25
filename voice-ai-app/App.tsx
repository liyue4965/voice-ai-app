import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Share,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  bgPrimary: '#0A0E17',
  bgSecondary: '#1A1F35',
  gradientStart: '#6C5CE7',
  gradientEnd: '#00D9FF',
  accent: '#00D9FF',
  recording: '#FF4757',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B9DC3',
  surface: '#252A40',
  cardBg: '#1E2438',
};

const LANGUAGES = [
  { code: 'zh-CN', name: '中文' },
  { code: 'en-US', name: '英语' },
  { code: 'ja-JP', name: '日语' },
  { code: 'ko-KR', name: '韩语' },
  { code: 'fr-FR', name: '法语' },
  { code: 'de-DE', name: '德语' },
];

const Tab = createBottomTabNavigator();

// ========== 首页 ==========
function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingText, setRecordingText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [selectedLang, setSelectedLang] = useState('zh-CN');
  
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1Anim = useRef(new Animated.Value(0.3)).current;
  const wave2Anim = useRef(new Animated.Value(0.3)).current;
  const wave3Anim = useRef(new Animated.Value(0.3)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();

      const createWaveAnimation = (anim) => Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ])
      );
      const w1 = createWaveAnimation(wave1Anim);
      const w2 = createWaveAnimation(wave2Anim);
      const w3 = createWaveAnimation(wave3Anim);
      w1.start(); w2.start(); w3.start();
      return () => { pulse.stop(); w1.stop(); w2.stop(); w3.stop(); };
    } else {
      pulseAnim.setValue(1);
      wave1Anim.setValue(0.3);
      wave2Anim.setValue(0.3);
      wave3Anim.setValue(0.3);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 模拟语音识别
  const recognizeSpeech = async (audioFile) => {
    // 这里可以接入真实的语音识别API
    // 如：讯飞、阿里云、百度语音识别
    return new Promise((resolve) => {
      setTimeout(() => {
        const langName = LANGUAGES.find(l => l.code === selectedLang)?.name || '中文';
        resolve(`[${langName}] 这是模拟的语音转文字识别结果。\n\n实际使用需要接入以下API：\n- 讯飞语音识别\n- 阿里云语音识别\n- 百度语音识别\n- OpenAI Whisper API`);
      }, 1500);
    });
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('需要麦克风权限'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      setShowResult(false);
    } catch (error) { Alert.alert('录音失败'); }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const result = await recognizeSpeech(null);
      setRecordingText(result);
      setShowResult(true);
      recordingRef.current = null;
    } catch (error) { console.error(error); }
  };

  // 上传音频文件转写
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/*'],
      });
      
      if (result.canceled) return;
      
      const file = result.assets[0];
      Alert.alert('上传成功', '正在识别...');
      
      // 模拟识别
      const text = await recognizeSpeech(file.uri);
      setRecordingText(text);
      setShowResult(true);
    } catch (error) {
      Alert.alert('上传失败');
    }
  };

  // 导出功能
  const handleExport = async (format) => {
    if (!recordingText) return;
    try {
      if (format === 'txt') {
        await Share.share({
          message: recordingText,
          title: '语音转文字结果',
        });
      } else if (format === 'copy') {
        // 复制到剪贴板功能需要 expo-clipboard
        Alert.alert('已复制到剪贴板');
      }
      Alert.alert(`已导出为 ${format.toUpperCase()}`);
    } catch (error) {
      Alert.alert('导出失败');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>语音转文字</Text>
        <TouchableOpacity><Ionicons name="person-circle-outline" size={32} color={COLORS.textPrimary} /></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 语言选择 */}
        <View style={styles.langSelector}>
          <Text style={styles.langLabel}>识别语言：</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity 
                key={lang.code}
                style={[styles.langChip, selectedLang === lang.code && styles.langChipActive]}
                onPress={() => setSelectedLang(lang.code)}
              >
                <Text style={[styles.langChipText, selectedLang === lang.code && styles.langChipTextActive]}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 功能卡片 */}
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={handleFileUpload}>
            <View style={[styles.featureIcon, { backgroundColor: '#6C5CE7' }]}>
              <Ionicons name="document-attach" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureTitle}>音频转文字</Text>
            <Text style={styles.featureSubtitle}>上传音频文件</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#00D9FF' }]}>
              <Ionicons name="videocam" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureTitle}>视频转文字</Text>
            <Text style={styles.featureSubtitle}>视频字幕提取</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FF6B6B' }]}>
              <MaterialIcons name="translate" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureTitle}>语音翻译</Text>
            <Text style={styles.featureSubtitle}>实时翻译</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#26DE81' }]}>
              <Ionicons name="speedometer" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureTitle}>音频变速</Text>
            <Text style={styles.featureSubtitle}>0.5x-2.0x</Text>
          </TouchableOpacity>
        </View>

        {/* 录音区域 */}
        {!showResult ? (
          <View style={styles.recordSection}>
            <View style={styles.recordArea}>
              {isRecording && (
                <>
                  <Animated.View style={[styles.waveRing, styles.waveRing3, { transform: [{ scale: wave3Anim }], opacity: wave3Anim * 0.3 }]} />
                  <Animated.View style={[styles.waveRing, styles.waveRing2, { transform: [{ scale: wave2Anim }], opacity: wave2Anim * 0.5 }]} />
                  <Animated.View style={[styles.waveRing, styles.waveRing1, { transform: [{ scale: wave1Anim }], opacity: wave1Anim * 0.7 }]} />
                </>
              )}
              <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} activeOpacity={0.8}>
                <Animated.View style={[styles.recordButton, isRecording && styles.recordButtonActive, { transform: [{ scale: pulseAnim }] }]}>
                  <Ionicons name={isRecording ? "stop" : "mic"} size={48} color={COLORS.textPrimary} />
                </Animated.View>
              </TouchableOpacity>
            </View>
            <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
            <Text style={styles.hint}>{isRecording ? '录音中... 点击停止' : '点击开始录音'}</Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>识别结果</Text>
              <Text style={styles.resultText}>{recordingText}</Text>
            </View>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleExport('copy')}>
                <Ionicons name="copy-outline" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleExport('txt')}>
                <Ionicons name="share-outline" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>分享</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={() => setShowResult(false)}>
                <Ionicons name="mic" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>重录</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ========== 录音页面 ==========
function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      return () => { pulse.stop(); clearInterval(timerRef.current); };
    }
    pulseAnim.setValue(1);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setResultText('录音完成！这是识别结果。实际使用需要接入语音识别API。');
      setShowResult(true);
    } else {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') { Alert.alert('需要麦克风权限'); return; }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording;
        setIsRecording(true);
        setRecordingTime(0);
        setShowResult(false);
      } catch (e) { Alert.alert('录音失败'); }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>录音</Text></View>
      <View style={styles.recordScreenContent}>
        {!showResult ? (
          <>
            <View style={styles.recordCircle}>
              <Animated.View style={[styles.bigRecordButton, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity onPress={toggleRecording}>
                  <Ionicons name={isRecording ? "stop" : "mic"} size={56} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            </View>
            <Text style={styles.recordTimer}>{formatTime(recordingTime)}</Text>
            <Text style={styles.recordHint}>{isRecording ? '正在录音...' : '点击开始录音'}</Text>
            <Text style={styles.recordSubHint}>再次点击停止录音</Text>
          </>
        ) : (
          <View style={styles.recordResult}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>识别结果</Text>
              <Text style={styles.resultText}>{resultText}</Text>
            </View>
            <TouchableOpacity style={styles.reRecordBtn} onPress={() => setShowResult(false)}>
              <Ionicons name="mic" size={20} color="#FFF" />
              <Text style={styles.reRecordText}>重新录音</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ========== 我的页面 ==========
function ProfileScreen() {
  const [history] = useState([
    { id: '1', date: '2024-03-25 14:30', text: '今天天气很好，我们去吃饭吧...', lang: '中文' },
    { id: '2', date: '2024-03-24 10:15', text: 'The project needs to be completed...', lang: '英语' },
    { id: '3', date: '2024-03-23 16:45', text: '明天的会议记得参加...', lang: '中文' },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <ScrollView style={styles.profileContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Ionicons name="person" size={48} color={COLORS.textPrimary} /></View>
          <Text style={styles.userName}>用户</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 历史记录</Text>
          {history.map(item => (
            <TouchableOpacity key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <View style={styles.langBadge}><Text style={styles.langBadgeText}>{item.lang}</Text></View>
              </View>
              <Text style={styles.historyText} numberOfLines={2}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ 设置</Text>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="settings" size={22} color={COLORS.textSecondary} />
            <Text style={styles.settingText}>通用设置</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications-none" size={22} color={COLORS.textSecondary} />
            <Text style={styles.settingText}>通知管理</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="cloud-upload" size={22} color={COLORS.textSecondary} />
            <Text style={styles.settingText}>API 配置</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="info-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.settingText}>关于我们</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.vipCard}>
          <View style={styles.vipLeft}><Text style={styles.vipTitle}>开通VIP会员</Text><Text style={styles.vipSubtitle}>解锁更多功能</Text></View>
          <Ionicons name="chevron-forward" size={24} color="#FFD700" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === '首页') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === '录音') iconName = focused ? 'mic-circle' : 'mic-circle-outline';
            else if (route.name === '我的') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="首页" component={HomeScreen} />
        <Tab.Screen name="录音" component={RecordScreen} />
        <Tab.Screen name="我的" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary },
  
  content: { flex: 1, paddingHorizontal: 16 },
  
  // 语言选择
  langSelector: { marginBottom: 16 },
  langLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  langChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, marginRight: 8 },
  langChipActive: { backgroundColor: COLORS.gradientStart },
  langChipText: { fontSize: 14, color: COLORS.textSecondary },
  langChipTextActive: { color: COLORS.textPrimary },
  
  // 功能卡片
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: (width - 48) / 2, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12 },
  featureIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  featureSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  
  // 录音区域
  recordSection: { alignItems: 'center', paddingVertical: 40 },
  recordArea: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  waveRing: { position: 'absolute', borderRadius: 100, borderWidth: 2, borderColor: COLORS.gradientStart },
  waveRing1: { width: 140, height: 140, borderRadius: 70 },
  waveRing2: { width: 170, height: 170, borderRadius: 85 },
  waveRing3: { width: 200, height: 200, borderRadius: 100 },
  recordButton: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.gradientStart, alignItems: 'center', justifyContent: 'center' },
  recordButtonActive: { backgroundColor: COLORS.recording },
  timer: { fontSize: 36, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  hint: { fontSize: 14, color: COLORS.textSecondary },
  
  // 结果
  resultContainer: { paddingVertical: 20 },
  resultCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16 },
  resultTitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  resultText: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 24 },
  resultActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 12, gap: 8 },
  actionButtonPrimary: { backgroundColor: COLORS.gradientStart },
  actionText: { fontSize: 14, color: COLORS.textPrimary },
  
  // Tab Bar
  tabBar: { backgroundColor: COLORS.bgSecondary, borderTopWidth: 0, height: Platform.OS === 'ios' ? 85 : 65, paddingBottom: Platform.OS === 'ios' ? 25 : 10, paddingTop: 10 },
  tabLabel: { fontSize: 12 },
  
  // 录音页
  recordScreenContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  recordCircle: { marginBottom: 30 },
  bigRecordButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.gradientStart, alignItems: 'center', justifyContent: 'center' },
  recordTimer: { fontSize: 48, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16 },
  recordHint: { fontSize: 18, color: COLORS.textPrimary, marginBottom: 8 },
  recordSubHint: { fontSize: 14, color: COLORS.textSecondary },
  recordResult: { width: '90%' },
  reRecordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gradientStart, paddingVertical: 16, borderRadius: 12, marginTop: 16, gap: 8 },
  reRecordText: { fontSize: 16, color: COLORS.textPrimary },
  
  // 我的页
  profileContent: { flex: 1, paddingHorizontal: 16 },
  profileHeader: { alignItems: 'center', paddingVertical: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  userName: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  historyItem: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 10 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyDate: { fontSize: 12, color: COLORS.textSecondary },
  langBadge: { backgroundColor: COLORS.gradientStart, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  langBadgeText: { fontSize: 10, color: COLORS.textPrimary },
  historyText: { fontSize: 14, color: COLORS.textPrimary },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 10 },
  settingText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, marginLeft: 12 },
  vipCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, marginBottom: 30 },
  vipLeft: {},
  vipTitle: { fontSize: 16, fontWeight: '600', color: '#FFD700' },
  vipSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});