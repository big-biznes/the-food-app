import { Modal } from 'react-native';
import FullScreenLoading from '@/components/FullScreenLoading';
import { useTranslation } from 'react-i18next';

/** Covers the auth screen while signing in, so the transition to home is one smooth step. */
export default function SigningInOverlay({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <FullScreenLoading title={t('auth.signingYouIn')} subtitle={t('auth.gettingReady')} />
    </Modal>
  );
}
