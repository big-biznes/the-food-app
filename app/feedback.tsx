import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { appInfo } from '@/lib/appInfo';

const MAX_LENGTH = 2000;

/** Settings → Send feedback: a message to the makers, stored with the account so they can answer. */
export default function FeedbackScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'writing' | 'sending' | 'sent'>('writing');
  const [failed, setFailed] = useState(false);
  const canSend = message.trim().length > 0 && state === 'writing';

  const send = async () => {
    if (!canSend) return;
    setState('sending');
    setFailed(false);
    const { error } = await supabase
      .from('feedback')
      .insert({ message: message.trim(), language: i18n.language, ...appInfo() });
    if (error) {
      setFailed(true);
      setState('writing');
      return;
    }
    setState('sent');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={22} color={c.text} />
      </PressableScale>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title} accessibilityRole="header">
            {t('feedback.title')}
          </Text>

          {state === 'sent' ? (
            <View style={styles.sent} accessibilityLiveRegion="polite">
              <Text style={styles.intro}>{t('feedback.thanks')}</Text>
              <PressableScale style={styles.button} onPress={() => router.back()} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{t('common.close')}</Text>
              </PressableScale>
            </View>
          ) : (
            <>
              <Text style={styles.intro}>{t('feedback.intro')}</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder={t('feedback.placeholder')}
                placeholderTextColor={c.textFaint}
                accessibilityLabel={t('feedback.title')}
                multiline
                maxLength={MAX_LENGTH}
                textAlignVertical="top"
                editable={state === 'writing'}
              />
              <Text style={styles.note}>{t('feedback.note')}</Text>
              {failed && (
                <Text style={styles.error} accessibilityRole="alert">
                  {t('feedback.failed')}
                </Text>
              )}
              <PressableScale
                style={[styles.button, !canSend && styles.buttonDisabled]}
                onPress={send}
                activeOpacity={0.8}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend }}
              >
                <Text style={styles.buttonText}>{t(state === 'sending' ? 'feedback.sending' : 'feedback.send')}</Text>
              </PressableScale>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      marginLeft: 20,
      marginBottom: 4,
    },
    scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56, gap: 16 },
    title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text },
    intro: { ...type.body, color: c.text },
    input: {
      minHeight: 160,
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontFamily: font.regular,
      fontSize: 16,
      lineHeight: 23,
      color: c.text,
    },
    note: { ...type.small, color: c.textMuted },
    error: { fontFamily: font.regular, fontSize: 13, color: c.danger },
    sent: { gap: 24 },
    button: { backgroundColor: c.primary, borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
    buttonDisabled: { backgroundColor: c.surfaceStrong },
    buttonText: { fontFamily: font.semibold, fontSize: 16, color: c.onPrimary },
  });
