import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import { light as hapticLight } from '../../utils/haptics';
import { useI18n } from '../../hooks/useI18n';
import { getTafsirList } from '../../utils/tafsir';
import OptionRow from './OptionRow';
import SectionLabel from './SectionLabel';
import PillButton from '../PillButton';

const makeStyles = (C) =>
  StyleSheet.create({
    center: { alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: 20 },
    error: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  });

export default function TafsirPanel({ selectedId, onSelectEdition }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    getTafsirList({ forceRefresh })
      .then(setItems)
      .catch((e) => setError(e.message || t('tafsir.listLoadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <PillButton variant="secondary" label={t('common.retry')} onPress={() => load(true)} />
      </View>
    );
  }

  return (
    <View>
      <SectionLabel>{t('tafsir.englishTafsirs')}</SectionLabel>
      <View>
        {items.map((item, i) => (
          <OptionRow
            key={item.id}
            label={item.name}
            subtitle={item.authorName}
            selected={selectedId === item.id}
            onPress={() => {
              hapticLight();
              onSelectEdition(item);
            }}
            isFirst={i === 0}
          />
        ))}
      </View>
    </View>
  );
}
