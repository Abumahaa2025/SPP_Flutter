import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { SetupProgressBar } from '@/src/components/SetupProgressBar';
import {
  WizardChipGroup, WizardInfoBox, WizardTextField, WizardToggle,
} from '@/src/components/WizardFormFields';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import type {
  GasType, MaintenanceResponsibility, PaymentMethod, PropertyType,
  RentPeriod, ServiceResponsibility, SetupPhaseId, UnitStatus, UnitType,
} from '@/src/types/property-os';

const PHASES: SetupPhaseId[] = [
  'property', 'units', 'tenants', 'contracts', 'alerts', 'smartEmployee',
];

const emptyUnitDraft = () => ({
  number: '',
  type: 'apartment' as UnitType,
  rooms: '2',
  livingRooms: '1',
  bathrooms: '1',
  area: '',
  floor: '',
  kitchen: true,
  balcony: false,
  parking: false,
  elevator: true,
  furnished: false,
  status: 'vacant' as UnitStatus,
  rentAmount: '',
  rentPeriod: 'monthly' as RentPeriod,
  paymentMethod: 'transfer' as PaymentMethod,
  paymentDueDay: '1',
  electricity: 'tenant' as ServiceResponsibility,
  electricityMeter: '',
  water: 'tenant' as ServiceResponsibility,
  waterMeter: '',
  internet: 'tenant' as 'tenant' | 'included',
  gas: 'central' as GasType,
  maintenanceBy: 'contract' as MaintenanceResponsibility,
  hasInsurance: false,
  insuranceAmount: '',
  notes: '',
});

export function PropertySetupWizard() {
  const { t, isRTL, lang } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ phase?: string }>();
  const { countEnabled, update: updateNotif } = useNotificationPrefs();
  const {
    state, phases, saveProperty, addUnit, addTenant, addContract,
    enableAlerts, ensureTechnicianPortal, nextPhase,
  } = usePropertyOS(countEnabled);

  const initialPhase = (params.phase as SetupPhaseId) || nextPhase || 'property';
  const [phase, setPhase] = useState<SetupPhaseId>(
    PHASES.includes(initialPhase) ? initialPhase : 'property',
  );
  const [lastTenant, setLastTenant] = useState<typeof state.tenants[0] | null>(null);

  // Property draft
  const [propName, setPropName] = useState(state.property?.name ?? '');
  const [propType, setPropType] = useState<PropertyType>(state.property?.type ?? 'residential');
  const [city, setCity] = useState(state.property?.city ?? '');
  const [district, setDistrict] = useState(state.property?.district ?? '');
  const [buildings, setBuildings] = useState(String(state.property?.buildingCount ?? 1));
  const [unitCount, setUnitCount] = useState(String(state.property?.unitCount ?? 1));

  // Unit draft
  const [unitDraft, setUnitDraft] = useState(emptyUnitDraft);

  // Tenant draft
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenantUnitId, setTenantUnitId] = useState(state.units[0]?.id ?? '');
  const [moveIn, setMoveIn] = useState(new Date().toISOString().slice(0, 10));

  // Contract draft
  const [contractNum, setContractNum] = useState('');
  const [contractStart, setContractStart] = useState(new Date().toISOString().slice(0, 10));
  const [contractEnd, setContractEnd] = useState('');
  const [contractRent, setContractRent] = useState('');
  const [contractDeposit, setContractDeposit] = useState('');
  const [contractTerms, setContractTerms] = useState('');
  const [contractTenantId, setContractTenantId] = useState(state.tenants[0]?.id ?? '');

  const phaseIndex = PHASES.indexOf(phase);
  const currentPhaseMeta = phases.find((p) => p.id === phase);

  const unitTypeOptions = useMemo(() => ([
    'apartment', 'shop', 'office', 'warehouse', 'villa', 'room', 'other',
  ] as UnitType[]).map((v) => ({
    value: v,
    label: t(`pos.unitType.${v}` as 'pos.unitType.apartment'),
  })), [t]);

  const canContinueProperty = Boolean(propName.trim() && city.trim() && Number(unitCount) > 0);
  const canContinueUnit = Boolean(unitDraft.number.trim() && Number(unitDraft.rentAmount) > 0);
  const canContinueTenant = Boolean(tenantName.trim() && tenantPhone.trim() && tenantUnitId);
  const canContinueContract = Boolean(
    contractNum.trim() && contractStart && contractEnd && contractTenantId && Number(contractRent) > 0,
  );

  const goPhase = (p: SetupPhaseId) => {
    Haptics.selectionAsync();
    setPhase(p);
  };

  const blockIfIncomplete = (required: boolean) => {
    if (!required) {
      Alert.alert('', t('pos.wizard.blocked'));
      return true;
    }
    return false;
  };

  const onContinue = () => {
    Haptics.selectionAsync();
    if (phase === 'property') {
      if (blockIfIncomplete(canContinueProperty)) return;
      saveProperty({
        name: propName.trim(),
        type: propType,
        city: city.trim(),
        district: district.trim(),
        buildingCount: Math.max(0, Number(buildings) || 0),
        unitCount: Math.max(1, Number(unitCount) || 1),
      });
      goPhase('units');
      return;
    }
    if (phase === 'units') {
      if (blockIfIncomplete(canContinueUnit)) return;
      addUnit({
        number: unitDraft.number.trim(),
        type: unitDraft.type,
        rooms: unitDraft.type === 'apartment' ? Number(unitDraft.rooms) || undefined : undefined,
        livingRooms: unitDraft.type === 'apartment' ? Number(unitDraft.livingRooms) || undefined : undefined,
        bathrooms: unitDraft.type === 'apartment' ? Number(unitDraft.bathrooms) || undefined : undefined,
        kitchen: unitDraft.type === 'apartment' ? unitDraft.kitchen : undefined,
        balcony: unitDraft.type === 'apartment' ? unitDraft.balcony : undefined,
        area: unitDraft.area ? Number(unitDraft.area) : undefined,
        floor: unitDraft.floor ? Number(unitDraft.floor) : undefined,
        parking: unitDraft.parking,
        elevator: unitDraft.elevator,
        furnished: unitDraft.furnished,
        status: unitDraft.status,
        rentAmount: Number(unitDraft.rentAmount),
        rentPeriod: unitDraft.rentPeriod,
        paymentMethod: unitDraft.paymentMethod,
        paymentDueDay: Math.min(28, Math.max(1, Number(unitDraft.paymentDueDay) || 1)),
        electricity: unitDraft.electricity,
        electricityMeter: unitDraft.electricityMeter || undefined,
        water: unitDraft.water,
        waterMeter: unitDraft.waterMeter || undefined,
        internet: unitDraft.internet,
        gas: unitDraft.gas,
        maintenanceBy: unitDraft.maintenanceBy,
        hasInsurance: unitDraft.hasInsurance,
        insuranceAmount: unitDraft.hasInsurance ? Number(unitDraft.insuranceAmount) || undefined : undefined,
        notes: unitDraft.notes || undefined,
      });
      const target = state.property?.unitCount ?? 1;
      if (state.units.length + 1 >= target) {
        goPhase('tenants');
      } else {
        setUnitDraft(emptyUnitDraft());
      }
      return;
    }
    if (phase === 'tenants') {
      if (blockIfIncomplete(canContinueTenant)) return;
      const tenant = addTenant({
        name: tenantName.trim(),
        phone: tenantPhone.trim(),
        email: tenantEmail.trim(),
        nationalId: tenantId.trim() || undefined,
        unitId: tenantUnitId,
        moveInDate: moveIn,
      }, lang);
      setLastTenant(tenant);
      setContractTenantId(tenant?.id ?? '');
      const unit = state.units.find((u) => u.id === tenantUnitId);
      if (unit) setContractRent(String(unit.rentAmount));
      goPhase('contracts');
      return;
    }
    if (phase === 'contracts') {
      if (blockIfIncomplete(canContinueContract)) return;
      const tenant = state.tenants.find((x) => x.id === contractTenantId) ?? lastTenant;
      addContract({
        number: contractNum.trim(),
        tenantId: contractTenantId,
        unitId: tenant?.unitId ?? tenantUnitId,
        startDate: contractStart,
        endDate: contractEnd,
        rentAmount: Number(contractRent),
        paymentType: 'monthly',
        depositAmount: Number(contractDeposit) || 0,
        specialTerms: contractTerms.trim() || undefined,
      });
      goPhase('alerts');
      return;
    }
    if (phase === 'alerts') {
      enableAlerts();
      updateNotif('priorities', true);
      updateNotif('contractRenewals', true);
      updateNotif('maintenance', true);
      goPhase('smartEmployee');
      return;
    }
    router.replace('/');
  };

  const shareWhatsApp = () => {
    const tenant = lastTenant ?? state.tenants[state.tenants.length - 1];
    if (!tenant) return;
    const url = Platform.select({
      ios: `whatsapp://send?text=${encodeURIComponent(tenant.whatsAppMessage)}`,
      default: `https://wa.me/?text=${encodeURIComponent(tenant.whatsAppMessage)}`,
    });
    Linking.openURL(url!).catch(() => {});
  };

  const techLink = ensureTechnicianPortal();
  const tenantPortal = lastTenant ?? state.tenants[state.tenants.length - 1];

  return (
    <ScreenScaffold testID="property-os-wizard">
      <StoryScreenHeader
        question={t('pos.wizard.title')}
        hint={t('pos.wizard.subtitle')}
        showBack
        testID="property-os-header"
      />

      <SetupProgressBar compact testID="property-os-progress" />

      <Animated.View entering={FadeInDown.duration(500)}>
        <GlassCard padding={16} radiusToken="lg" edge="gold">
          <View style={[styles.phaseNav, isRTL && styles.rowRtl]}>
            {PHASES.map((p, i) => {
              const meta = phases.find((x) => x.id === p);
              const active = p === phase;
              const done = meta?.complete;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    if (i <= phaseIndex || done) goPhase(p);
                  }}
                  style={[styles.phaseDot, active && styles.phaseDotActive, done && styles.phaseDotDone]}
                >
                  <Text style={[styles.phaseDotText, (active || done) && styles.phaseDotTextActive]}>
                    {i + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.phaseTitle, isRTL && styles.rtl]}>
            {t(`pos.phase.${phase}` as 'pos.phase.property')}
            {currentPhaseMeta ? ` · ${currentPhaseMeta.percent}%` : ''}
          </Text>
        </GlassCard>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
      >
        {phase === 'property' ? (
          <PhaseCard>
            <Text style={[styles.lead, isRTL && styles.rtl]}>{t('pos.property.lead')}</Text>
            <WizardInfoBox why={t('pos.property.why')} example={t('pos.property.example')} />
            <WizardTextField label={t('pos.property.name')} value={propName} onChangeText={setPropName} placeholder={t('pos.property.namePh')} testID="pos-prop-name" />
            <WizardChipGroup label={t('pos.property.type')} options={(['residential', 'commercial', 'mixed', 'land', 'other'] as PropertyType[]).map((v) => ({ value: v, label: t(`pos.type.${v}` as 'pos.type.residential') }))} value={propType} onChange={setPropType} testID="pos-prop-type" />
            <WizardTextField label={t('pos.property.city')} value={city} onChangeText={setCity} placeholder={t('pos.property.cityPh')} testID="pos-prop-city" />
            <WizardTextField label={t('pos.property.district')} value={district} onChangeText={setDistrict} placeholder={t('pos.property.districtPh')} testID="pos-prop-district" />
            <WizardTextField label={t('pos.property.buildings')} value={buildings} onChangeText={setBuildings} keyboard="numeric" testID="pos-prop-buildings" />
            <WizardTextField label={t('pos.property.unitCount')} value={unitCount} onChangeText={setUnitCount} keyboard="numeric" testID="pos-prop-units" />
          </PhaseCard>
        ) : null}

        {phase === 'units' ? (
          <PhaseCard>
            <Text style={[styles.lead, isRTL && styles.rtl]}>{t('pos.units.lead')}</Text>
            <WizardInfoBox why={t('pos.units.why')} example={t('pos.units.example')} />
            {state.units.length > 0 ? (
              <Text style={[styles.saved, isRTL && styles.rtl]}>
                {t('pos.units.saved').replace('{n}', String(state.units.length))}
              </Text>
            ) : null}
            <WizardTextField label={t('pos.units.number')} value={unitDraft.number} onChangeText={(v) => setUnitDraft((d) => ({ ...d, number: v }))} placeholder={t('pos.units.numberPh')} testID="pos-unit-num" />
            <WizardChipGroup label={t('pos.units.type')} options={unitTypeOptions} value={unitDraft.type} onChange={(v) => setUnitDraft((d) => ({ ...d, type: v }))} testID="pos-unit-type" />
            {unitDraft.type === 'apartment' ? (
              <>
                <WizardTextField label={t('pos.units.rooms')} value={unitDraft.rooms} onChangeText={(v) => setUnitDraft((d) => ({ ...d, rooms: v }))} keyboard="numeric" />
                <WizardTextField label={t('pos.units.livingRooms')} value={unitDraft.livingRooms} onChangeText={(v) => setUnitDraft((d) => ({ ...d, livingRooms: v }))} keyboard="numeric" />
                <WizardTextField label={t('pos.units.bathrooms')} value={unitDraft.bathrooms} onChangeText={(v) => setUnitDraft((d) => ({ ...d, bathrooms: v }))} keyboard="numeric" />
                <WizardToggle label={t('pos.units.kitchen')} value={unitDraft.kitchen} onChange={(v) => setUnitDraft((d) => ({ ...d, kitchen: v }))} />
                <WizardToggle label={t('pos.units.balcony')} value={unitDraft.balcony} onChange={(v) => setUnitDraft((d) => ({ ...d, balcony: v }))} />
              </>
            ) : null}
            <WizardTextField label={t('pos.units.area')} value={unitDraft.area} onChangeText={(v) => setUnitDraft((d) => ({ ...d, area: v }))} keyboard="numeric" />
            <WizardTextField label={t('pos.units.floor')} value={unitDraft.floor} onChangeText={(v) => setUnitDraft((d) => ({ ...d, floor: v }))} keyboard="numeric" />
            <WizardToggle label={t('pos.units.parking')} value={unitDraft.parking} onChange={(v) => setUnitDraft((d) => ({ ...d, parking: v }))} />
            <WizardToggle label={t('pos.units.elevator')} value={unitDraft.elevator} onChange={(v) => setUnitDraft((d) => ({ ...d, elevator: v }))} />
            <WizardToggle label={t('pos.units.furnished')} value={unitDraft.furnished} onChange={(v) => setUnitDraft((d) => ({ ...d, furnished: v }))} />
            <WizardChipGroup label={t('pos.units.status')} options={(['occupied', 'vacant', 'reserved', 'maintenance'] as UnitStatus[]).map((v) => ({ value: v, label: t(`pos.status.${v}` as 'pos.status.occupied') }))} value={unitDraft.status} onChange={(v) => setUnitDraft((d) => ({ ...d, status: v }))} />
            <WizardTextField label={t('pos.rent.amount')} value={unitDraft.rentAmount} onChangeText={(v) => setUnitDraft((d) => ({ ...d, rentAmount: v }))} keyboard="numeric" testID="pos-unit-rent" />
            <WizardChipGroup label={t('pos.rent.period')} options={(['monthly', 'semi_annual', 'annual'] as RentPeriod[]).map((v) => ({ value: v, label: t(`pos.rent.${v}` as 'pos.rent.monthly') }))} value={unitDraft.rentPeriod} onChange={(v) => setUnitDraft((d) => ({ ...d, rentPeriod: v }))} />
            <WizardChipGroup label={t('pos.rent.paymentMethod')} options={(['transfer', 'cash', 'platform'] as PaymentMethod[]).map((v) => ({ value: v, label: t(`pos.pay.${v}` as 'pos.pay.transfer') }))} value={unitDraft.paymentMethod} onChange={(v) => setUnitDraft((d) => ({ ...d, paymentMethod: v }))} />
            <WizardTextField label={t('pos.rent.dueDay')} value={unitDraft.paymentDueDay} onChangeText={(v) => setUnitDraft((d) => ({ ...d, paymentDueDay: v }))} keyboard="numeric" />
            <WizardChipGroup label={t('pos.services.electricity')} options={(['tenant', 'owner', 'included'] as ServiceResponsibility[]).map((v) => ({ value: v, label: t(`pos.svc.${v}` as 'pos.svc.tenant') }))} value={unitDraft.electricity} onChange={(v) => setUnitDraft((d) => ({ ...d, electricity: v }))} />
            <WizardTextField label={t('pos.meter.electricity')} value={unitDraft.electricityMeter} onChangeText={(v) => setUnitDraft((d) => ({ ...d, electricityMeter: v }))} />
            <WizardChipGroup label={t('pos.services.water')} options={(['tenant', 'owner', 'included'] as ServiceResponsibility[]).map((v) => ({ value: v, label: t(`pos.svc.${v}` as 'pos.svc.tenant') }))} value={unitDraft.water} onChange={(v) => setUnitDraft((d) => ({ ...d, water: v }))} />
            <WizardTextField label={t('pos.meter.water')} value={unitDraft.waterMeter} onChangeText={(v) => setUnitDraft((d) => ({ ...d, waterMeter: v }))} />
            <WizardChipGroup label={t('pos.services.internet')} options={[{ value: 'tenant' as const, label: t('pos.svc.internetTenant') }, { value: 'included' as const, label: t('pos.svc.internetIncluded') }]} value={unitDraft.internet} onChange={(v) => setUnitDraft((d) => ({ ...d, internet: v }))} />
            <WizardChipGroup label={t('pos.services.gas')} options={(['central', 'independent'] as GasType[]).map((v) => ({ value: v, label: t(`pos.gas.${v}` as 'pos.gas.central') }))} value={unitDraft.gas} onChange={(v) => setUnitDraft((d) => ({ ...d, gas: v }))} />
            <WizardChipGroup label={t('pos.maintenance.by')} options={(['owner', 'tenant', 'contract'] as MaintenanceResponsibility[]).map((v) => ({ value: v, label: t(`pos.maint.${v}` as 'pos.maint.owner') }))} value={unitDraft.maintenanceBy} onChange={(v) => setUnitDraft((d) => ({ ...d, maintenanceBy: v }))} />
            <WizardChipGroup label={t('pos.insurance.has')} options={[{ value: 'yes' as const, label: t('pos.insurance.yes') }, { value: 'no' as const, label: t('pos.insurance.no') }]} value={unitDraft.hasInsurance ? 'yes' : 'no'} onChange={(v) => setUnitDraft((d) => ({ ...d, hasInsurance: v === 'yes' }))} />
            {unitDraft.hasInsurance ? (
              <WizardTextField label={t('pos.insurance.amount')} value={unitDraft.insuranceAmount} onChangeText={(v) => setUnitDraft((d) => ({ ...d, insuranceAmount: v }))} keyboard="numeric" />
            ) : null}
            <WizardTextField label={t('pos.units.notes')} value={unitDraft.notes} onChangeText={(v) => setUnitDraft((d) => ({ ...d, notes: v }))} placeholder={t('pos.units.notesPh')} />
          </PhaseCard>
        ) : null}

        {phase === 'tenants' ? (
          <PhaseCard>
            <Text style={[styles.lead, isRTL && styles.rtl]}>{t('pos.tenant.lead')}</Text>
            <WizardInfoBox why={t('pos.tenant.why')} example={t('pos.tenant.example')} />
            <WizardTextField label={t('pos.tenant.name')} value={tenantName} onChangeText={setTenantName} testID="pos-tenant-name" />
            <WizardTextField label={t('pos.tenant.phone')} value={tenantPhone} onChangeText={setTenantPhone} keyboard="phone-pad" testID="pos-tenant-phone" />
            <WizardTextField label={t('pos.tenant.email')} value={tenantEmail} onChangeText={setTenantEmail} keyboard="email-address" />
            <WizardTextField label={t('pos.tenant.nationalId')} value={tenantId} onChangeText={setTenantId} />
            <WizardChipGroup
              label={t('pos.tenant.unit')}
              options={state.units.map((u) => ({ value: u.id, label: u.number }))}
              value={tenantUnitId}
              onChange={setTenantUnitId}
              testID="pos-tenant-unit"
            />
            <WizardTextField label={t('pos.tenant.moveIn')} value={moveIn} onChangeText={setMoveIn} placeholder="YYYY-MM-DD" />
            {tenantPortal ? (
              <PortalPreview
                title={t('pos.portal.tenant.lead')}
                link={tenantPortal.portalUrl}
                extra={tenantPortal.whatsAppMessage}
                onShare={shareWhatsApp}
                shareLabel={t('pos.portal.shareWhatsapp')}
                isRTL={isRTL}
              />
            ) : null}
          </PhaseCard>
        ) : null}

        {phase === 'contracts' ? (
          <PhaseCard>
            <Text style={[styles.lead, isRTL && styles.rtl]}>{t('pos.contract.lead')}</Text>
            <WizardInfoBox why={t('pos.contract.why')} example={t('pos.contract.example')} />
            <WizardTextField label={t('pos.contract.number')} value={contractNum} onChangeText={setContractNum} testID="pos-contract-num" />
            <WizardChipGroup
              label={t('pos.tenant.name')}
              options={state.tenants.map((x) => ({ value: x.id, label: x.name }))}
              value={contractTenantId}
              onChange={setContractTenantId}
            />
            <WizardTextField label={t('pos.contract.start')} value={contractStart} onChangeText={setContractStart} placeholder="YYYY-MM-DD" />
            <WizardTextField label={t('pos.contract.end')} value={contractEnd} onChangeText={setContractEnd} placeholder="YYYY-MM-DD" />
            <WizardTextField label={t('pos.contract.rent')} value={contractRent} onChangeText={setContractRent} keyboard="numeric" />
            <WizardTextField label={t('pos.contract.deposit')} value={contractDeposit} onChangeText={setContractDeposit} keyboard="numeric" />
            <WizardTextField label={t('pos.contract.terms')} value={contractTerms} onChangeText={setContractTerms} />
          </PhaseCard>
        ) : null}

        {phase === 'alerts' ? (
          <PhaseCard>
            <Text style={[styles.lead, isRTL && styles.rtl]}>{t('pos.alerts.lead')}</Text>
            <WizardInfoBox why={t('pos.alerts.why')} example={t('pos.alerts.enable')} />
            <PortalPreview
              title={t('pos.portal.tech.lead')}
              subtitle={t('pos.portal.tech.why')}
              link={techLink}
              isRTL={isRTL}
            />
          </PhaseCard>
        ) : null}

        {phase === 'smartEmployee' ? (
          <PhaseCard>
            <Text style={[styles.lead, isRTL && styles.rtl]}>{t('pos.ready.lead')}</Text>
            <WizardInfoBox why={t('pos.ready.why')} example={t('pos.ready.goHome')} />
          </PhaseCard>
        ) : null}

        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.actions}>
          {phaseIndex > 0 ? (
            <Pressable style={styles.secondaryBtn} onPress={() => goPhase(PHASES[phaseIndex - 1])}>
              <Text style={styles.secondaryText}>{t('pos.back')}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primaryBtn} onPress={onContinue} testID="pos-wizard-continue">
            <Text style={styles.primaryText}>
              {phase === 'smartEmployee' ? t('pos.ready.goHome') : phase === 'units' && state.units.length + 1 < (state.property?.unitCount ?? 1) ? t('pos.units.addAnother') : t('pos.continue')}
            </Text>
            <Feather name="arrow-right" size={14} color={colors.bg} />
          </Pressable>
        </Animated.View>

        <Pressable style={styles.importLink} onPress={() => router.push('/upload')}>
          <Feather name="upload" size={14} color={colors.gold} />
          <Text style={styles.importText}>{t('pos.wizard.importAlt')}</Text>
        </Pressable>
        <Text style={[styles.importHint, isRTL && styles.rtl]}>{t('pos.wizard.importHint')}</Text>
      </ScrollView>
    </ScreenScaffold>
  );
}

function PhaseCard({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(550).delay(60)} style={{ marginTop: spacing.md }}>
      <GlassCard padding={20} radiusToken="lg" edge="emerald">{children}</GlassCard>
    </Animated.View>
  );
}

function PortalPreview({
  title, subtitle, link, extra, onShare, shareLabel, isRTL,
}: {
  title: string; subtitle?: string; link: string; extra?: string;
  onShare?: () => void; shareLabel?: string; isRTL: boolean;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.portalBox}>
      <Text style={[styles.portalTitle, isRTL && styles.rtl]}>{title}</Text>
      {subtitle ? <Text style={[styles.portalSub, isRTL && styles.rtl]}>{subtitle}</Text> : null}
      <Text style={[styles.portalLabel, isRTL && styles.rtl]}>{t('pos.portal.link')}</Text>
      <Text style={styles.portalLink} selectable>{link}</Text>
      {extra ? (
        <>
          <Text style={[styles.portalLabel, isRTL && styles.rtl, { marginTop: 8 }]}>{t('pos.portal.whatsapp')}</Text>
          <Text style={[styles.portalExtra, isRTL && styles.rtl]} selectable>{extra}</Text>
        </>
      ) : null}
      {onShare && shareLabel ? (
        <Pressable style={styles.shareBtn} onPress={onShare}>
          <Feather name="message-circle" size={14} color={colors.emerald} />
          <Text style={styles.shareText}>{shareLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  phaseNav: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  rowRtl: { flexDirection: 'row-reverse' },
  phaseDot: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  phaseDotActive: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  phaseDotDone: { borderColor: colors.emeraldEdge, backgroundColor: colors.emeraldSoft },
  phaseDotText: { color: colors.textSubtle, fontSize: 11, fontWeight: typography.weight.semibold },
  phaseDotTextActive: { color: colors.text },
  phaseTitle: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  lead: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: typography.weight.medium },
  saved: { color: colors.emerald, fontSize: 12, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.emerald, borderRadius: radius.md, paddingVertical: 16,
  },
  primaryText: { color: colors.bg, fontSize: 14, fontWeight: typography.weight.semibold },
  secondaryBtn: {
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  secondaryText: { color: colors.textDim, fontSize: 13 },
  importLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.lg, alignSelf: 'center' },
  importText: { color: colors.gold, fontSize: 13, fontWeight: typography.weight.medium },
  importHint: { color: colors.textSubtle, fontSize: 11.5, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  portalBox: {
    marginTop: spacing.md, padding: 14, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  portalTitle: { color: colors.text, fontSize: 14, fontWeight: typography.weight.semibold },
  portalSub: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 4 },
  portalLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, marginTop: 10, textTransform: 'uppercase' },
  portalLink: { color: colors.gold, fontSize: 11.5, marginTop: 4 },
  portalExtra: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 4 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.emeraldEdge,
    backgroundColor: colors.emeraldSoft,
  },
  shareText: { color: colors.emerald, fontSize: 12, fontWeight: typography.weight.medium },
});
