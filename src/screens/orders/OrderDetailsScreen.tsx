import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Badge, orderStatusVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useOrder, useUpdateOrderStatus } from '../../hooks/useOrders';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatOrderDate, formatRelativeTime } from '../../utils/formatDate';
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '../../types/order.types';
import { emitOrderStatusUpdate } from '../../services/socket';

export function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const { data: order, isLoading } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();

  const [updating, setUpdating] = useState(false);

  if (isLoading || !order) {
    return (
      <SafeScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      </SafeScreen>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status as any);
  const nextStatus =
    currentIdx >= 0 && currentIdx < ORDER_STATUS_FLOW.length - 1
      ? ORDER_STATUS_FLOW[currentIdx + 1]
      : null;

  const handleAdvanceStatus = () => {
    if (!nextStatus) return;
    Alert.alert('Update Order Status', `Move order to "${ORDER_STATUS_LABELS[nextStatus]}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setUpdating(true);
          try {
            await updateStatus.mutateAsync({ id: order._id, status: nextStatus });
            // Emit socket event so user app and admin update immediately
            emitOrderStatusUpdate(order._id, nextStatus);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await updateStatus.mutateAsync({ id: order._id, status: 'cancelled' });
          emitOrderStatusUpdate(order._id, 'cancelled');
        },
      },
    ]);
  };

  const isFinal = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title={order.orderNumber} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status pipeline */}
        <View style={styles.pipeline}>
          {ORDER_STATUS_FLOW.map((s, i) => {
            const stepIdx = ORDER_STATUS_FLOW.indexOf(order.status as any);
            const isDone = i <= stepIdx;
            const isActive = i === stepIdx;
            return (
              <React.Fragment key={s}>
                <View style={styles.pipelineStep}>
                  <View
                    style={[
                      styles.stepDot,
                      isDone && styles.stepDotDone,
                      isActive && styles.stepDotActive,
                    ]}
                  >
                    {isDone && !isActive && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isActive && { color: COLORS.primary, fontWeight: '800' },
                    ]}
                  >
                    {ORDER_STATUS_LABELS[s].replace(' for ', '\nfor ')}
                  </Text>
                </View>
                {i < ORDER_STATUS_FLOW.length - 1 && (
                  <View style={[styles.pipelineLine, i < stepIdx && styles.pipelineLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <Avatar uri={order.user.avatar} name={order.user.name} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.user.name}</Text>
              <Text style={styles.customerPhone}>{order.user.phone}</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Chat', {
                  screen: 'ChatConversation',
                  params: {
                    userId: order.user._id,
                    userName: order.user.name,
                    userAvatar: order.user.avatar,
                  },
                })
              }
              style={styles.chatBtn}
            >
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#94A3B8" />
            <Text style={styles.addressText}>
              {order.deliveryAddress.fullAddress}
              {order.deliveryAddress.landmark ? ` (${order.deliveryAddress.landmark})` : ''}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i > 0 && styles.itemBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.variant && <Text style={styles.itemVariant}>{item.variant}</Text>}
              </View>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}

          {/* Subtotals */}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalVal}>{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalVal}>{formatCurrency(order.deliveryFee)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandVal}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Method</Text>
            <Text style={styles.infoVal}>{order.paymentMethod.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Status</Text>
            <Badge
              label={order.paymentStatus}
              variant={
                order.paymentStatus === 'paid'
                  ? 'success'
                  : order.paymentStatus === 'failed'
                    ? 'danger'
                    : 'warning'
              }
              size="sm"
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Placed</Text>
            <Text style={styles.infoVal}>{formatOrderDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {!isFinal && (
          <View style={styles.actionsWrap}>
            {nextStatus && (
              <Button
                title={`Mark as ${ORDER_STATUS_LABELS[nextStatus]}`}
                fullWidth
                size="lg"
                loading={updating}
                onPress={handleAdvanceStatus}
              />
            )}
            <View style={{ height: 10 }} />
            <Button
              title="Cancel Order"
              variant="danger"
              fullWidth
              onPress={handleCancel}
              loading={updateStatus.isPending && !updating}
            />
          </View>
        )}
        {isFinal && (
          <View
            style={[
              styles.finalBadge,
              { backgroundColor: order.status === 'delivered' ? '#D1FAE5' : '#FFE4E6' },
            ]}
          >
            <Ionicons
              name={order.status === 'delivered' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={order.status === 'delivered' ? '#10B981' : '#F43F5E'}
            />
            <Text
              style={{
                color: order.status === 'delivered' ? '#065F46' : '#9F1239',
                fontWeight: '800',
                fontSize: 14,
              }}
            >
              This order has been {order.status}.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  pipeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pipelineStep: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: { backgroundColor: '#10B981' },
  stepDotActive: { backgroundColor: COLORS.accent, width: 24, height: 24, borderRadius: 12 },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
  pipelineLine: { flex: 0.5, height: 2, backgroundColor: '#E2E8F0', marginTop: 10 },
  pipelineLineDone: { backgroundColor: '#10B981' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerName: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  customerPhone: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addressText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  itemBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  itemName: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  itemVariant: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  itemPrice: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  totalVal: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  grandTotal: { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 4, paddingTop: 10 },
  grandLabel: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  grandVal: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoKey: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  infoVal: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  actionsWrap: { marginTop: 8 },
  finalBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14 },
});
