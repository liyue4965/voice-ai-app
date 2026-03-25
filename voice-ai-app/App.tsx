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
} from 'react-native';
import { Audio } from 'expo-av';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 颜色配置（参考图片）
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
};

const Tab = createBottomTabNavigator();

// ========== 首页 / 录音页面 ==========
function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingText, setRecordingText] = useState('');
  const [showResult, setShowResult] = useState(false);
  
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1Anim = useRef(new Animated.Value(0.3)).current;
  const wave2Anim = useRef(new Animated.Value(0.3)).current;
  const wave3Anim = useRef(new Animated.Value(0.3)).current;
  const timerRef = useRef(null);

  // 波纹动画
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const createWaveAnimation = (anim, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const w1 = createWaveAnimation(wave1Anim, 0);
      const w2 = createWaveAnimation(wave2Anim, 500);
      const w3 = createWaveAnimation(wave3Anim, 1000);
      
      w1.start();
      w2.start();
      w3.start();

      return () => {
        pulse.stop();
        w1.stop();
        w2.stop();
        w3.stop();
      };
    } else {
      pulseAnim.setValue(1);
      wave1Anim.setValue(0.3);
      wave2Anim.setValue(0.3);
      wave3Anim.setValue(0.3);
    }
  }, [isRecording]);

  // 计时器
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('需要麦克风权限');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      setShowResult(false);
    } catch (error) {
      console.error('录音失败:', error);
      alert('录音失败，请重试');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      
      // 模拟语音识别结果
      const mockResult = '这是模拟的语音转文字结果。实际使用时需要接入语音识别API，如讯飞、阿里云或百度语音识别服务。';
      setRecordingText(mockResult);
      setShowResult(true);
      
      recordingRef.current = null;
    } catch (error) {
      console.error('停止录音失败:', error);
    }
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>语音转文字</Text>
        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="person-circle-outline" size={32} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!showResult ? (
          <>
            {/* 录音按钮区域 */}
            <View style={styles.recordArea}>
              {/* 波纹动画 */}
              {isRecording && (
                <>
                  <Animated.View style={[
                    styles.waveRing,
                    styles.waveRing3,
                    { transform: [{ scale: wave3Anim }], opacity: wave3Anim * 0.3 }
                  ]} />
                  <Animated.View style={[
                    styles.waveRing,
                    styles.waveRing2,
                    { transform: [{ scale: wave2Anim }], opacity: wave2Anim * 0.5 }
                  ]} />
                  <Animated.View style={[
                    styles.waveRing,
                    styles.waveRing1,
                    { transform: [{ scale: wave1Anim }], opacity: wave1Anim * 0.7 }
                  ]} />
                </>
              )}

              {/* 主按钮 */}
              <TouchableOpacity onPress={handleRecordPress} activeOpacity={0.8}>
                <Animated.View style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={48} 
                    color={COLORS.textPrimary} 
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* 计时器 */}
            <Text style={styles.timer}>{formatTime(recordingTime)}</Text>

            {/* 提示文字 */}
            <Text style={styles.hint}>
              {isRecording ? '录音中... 点击停止' : '点击开始录音'}
            </Text>
          </>
        ) : (
          /* 结果显示 */
          <View style={styles.resultContainer}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>识别结果</Text>
              <Text style={styles.resultText}>{recordingText}</Text>
            </View>
            
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="copy-outline" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>复制</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => setShowResult(false)}
              >
                <Ionicons name="mic" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>重新录音</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ========== 我的页面 ==========
function ProfileScreen() {
  const [history] = useState([
    { id: '1', date: '2024-03-25 14:30', text: '这是第一条录音记录...' },
    { id: '2', date: '2024-03-24 10:15', text: '这是第二条录音记录...' },
    { id: '3', date: '2024-03-23 16:45', text: '这是第三条录音记录...' },
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>我的</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={COLORS.textPrimary} />
        </View>
        <Text style={styles.userName}>用户</Text>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>历史记录</Text>
        
        {history.map(item => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyText} numberOfLines={2}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="settings" size={24} color={COLORS.textSecondary} />
          <Text style={styles.settingText}>设置</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="info-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.settingText}>关于</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ========== 主应用 ==========
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
            
            if (route.name === '首页') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === '录音') {
              iconName = focused ? 'mic' : 'mic-outline';
            } else if (route.name === '我的') {
              iconName = focused ? 'person' : 'person-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="首页" component={HomeScreen} />
        <Tab.Screen name="录音" component={HomeScreen} />
        <Tab.Screen name="我的" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  
  // 顶部导航
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.bgPrimary,
  },
  headerLeft: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 32,
    alignItems: 'flex-end',
  },
  
  // 内容区
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  
  // 录音区域
  recordArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  
  // 波纹动画
  waveRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.gradientStart,
  },
  waveRing1: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  waveRing2: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  waveRing3: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  
  // 录音按钮
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gradientStart,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gradientStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  recordButtonActive: {
    backgroundColor: COLORS.recording,
  },
  
  // 计时器
  timer: {
    fontSize: 36,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: 12,
  },
  
  // 提示文字
  hint: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // 结果显示
  resultContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.gradientStart,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  
  // Tab Bar
  tabBar: {
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // 我的页面
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  historyText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  settingsSection: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
});