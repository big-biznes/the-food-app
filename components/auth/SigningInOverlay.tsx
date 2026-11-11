import { Modal } from 'react-native';
import FullScreenLoading from '@/components/FullScreenLoading';

/** Covers the auth screen while signing in, so the transition to home is one smooth step. */
export default function SigningInOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <FullScreenLoading title="Signing you in" subtitle="Getting your week ready…" />
    </Modal>
  );
}
