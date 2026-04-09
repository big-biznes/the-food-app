import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ALL_MEALS } from '@/data/meals';

const { width: SCREEN_W } = Dimensions.get('window');

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const meal = ALL_MEALS.find(m => m.id === id);

  const [step, setStep] = useState(0);

  if (!meal || meal.instructions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="#111111" />
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>No instructions</Text>
          <Text style={styles.emptyHint}>This recipe doesn't have cooking steps yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps = meal.instructions;
  const total = steps.length;
  const progress = (step + 1) / total;
  const isLast = step === total - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="#111111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{meal.name}</Text>
          <Text style={styles.headerSub}>Step {step + 1} of {total}</Text>
        </View>
        <View style={styles.closeBtnPlaceholder} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step content */}
      <View style={styles.content}>
        <View style={styles.stepNumberWrap}>
          <Text style={styles.stepNumber}>{step + 1}</Text>
        </View>
        <Text style={styles.stepText}>{steps[step]}</Text>
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomBar}>
        {step > 0 ? (
          <TouchableOpacity
            style={styles.backStepBtn}
            onPress={() => setStep(s => s - 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#111111" />
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backStepPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.nextBtn, isLast && styles.doneBtn]}
          onPress={() => {
            if (isLast) router.back();
            else setStep(s => s + 1);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Done' : 'Next step'}</Text>
          {!isLast && <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />}
          {isLast && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPlaceholder: { width: 40 },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111111',
    borderRadius: 2,
  },

  // Step content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  stepNumberWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },
  stepText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111111',
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  backStepPlaceholder: { width: 72 },
  backStepText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111111',
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  doneBtn: {
    backgroundColor: '#111111',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111111' },
  emptyHint: { fontSize: 14, color: '#AAAAAA', textAlign: 'center' },
});
