// src/components/PaymentModal.jsx - API-Oriented (Supports Orders & Rentals)
import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { paymentService, orderService } from '../services/api';

export const PaymentModal = ({ isOpen, onClose, order, onPaymentComplete, user }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { addNotification } = useNotifications();

  // ✅ DETECT IF IT'S A RENTAL OR ORDER
  const isRental = order?.reference && !order?.recNo;
  const isOrder = order?.recNo && !order?.reference;

  // ✅ GET CORRECT FIELD NAMES BASED ON TYPE
  const receiptNo = isRental ? order?.reference : order?.recNo;
  const total = isRental ? (order?.totalAmount || 0) : (order?.total || 0);
  const deposit = order?.deposit || 0;
  const customerName = order?.customerName || 'N/A';
  
  // ✅ Calculate remaining balance from payments
  const paymentsTotal = order?.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalPaid = Math.max(paymentsTotal, deposit);
  const remainingBalance = Math.max(0, total - totalPaid);

  // Auto-set payment amount to remaining balance
  useEffect(() => {
    if (isOpen && remainingBalance > 0) {
      setPaymentAmount(remainingBalance.toString());
    }
  }, [isOpen, remainingBalance]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  const amount = parseFloat(paymentAmount);
  if (!amount || amount <= 0) {
    setError('Please enter a valid amount');
    setLoading(false);
    return;
  }

  if (amount > remainingBalance) {
    setError(`Amount exceeds remaining balance of KES ${remainingBalance.toLocaleString()}`);
    setLoading(false);
    return;
  }

  try {
    // ✅ MAP METHOD NAMES CORRECTLY
    const methodMap = {
      'cash': 'CASH',
      'm-pesa': 'M_PESA',  // ✅ FIXED: underscore instead of hyphen
      'bank': 'BANK'
    };

    // ✅ BUILD PAYMENT REQUEST BASED ON TYPE
    const paymentData = {
      amount: amount,
      method: methodMap[paymentMethod] || 'CASH',  // ✅ Use mapped value
      note: paymentNote || '',
      paymentDate: paymentDate,
      receiptNo: receiptNo,
      // ✅ Send either orderId OR rentalId based on type
      ...(isRental 
        ? { rentalId: order.id } 
        : { orderId: order.id }
      )
    };

    console.log(`📤 Recording ${isRental ? 'RENTAL' : 'ORDER'} payment via API:`, paymentData);
    
    // ✅ CALL API
    const result = await paymentService.recordPayment(paymentData);
    
    console.log('📥 Payment result:', result);

    if (result.success) {
      setSuccess(`✅ Payment of KES ${amount.toLocaleString()} recorded!`);
      
      // ✅ Send notification with correct context
      addNotification(
        `💰 Payment of KES ${amount.toLocaleString()} recorded for ${isRental ? 'Rental' : 'Order'} ${receiptNo} - ${customerName}`,
        'payment',
        isRental ? '/suit-rentals' : '/workbench',
        user?.email
      );
      
      // ✅ Refresh the data
      if (onPaymentComplete) {
        // For both order and rental, we pass back the updated data
        // The parent component will handle refreshing the list
        onPaymentComplete(result.payment);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(`❌ Payment failed: ${result.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('Payment error:', err);
    setError(`❌ Payment failed: ${err.message || 'Please try again'}`);
  }

  setLoading(false);
};

  const isFullyPaid = remainingBalance <= 0;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center p-2 sm:p-4 pt-6 sm:pt-12 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-800">Record Payment</h3>
              <p className="text-[10px] sm:text-xs text-gray-400">
                {isRental ? 'Rental' : 'Order'} #{receiptNo}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Order/Rental Summary */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium truncate ml-2">{customerName}</span>
            </div>
            {isRental && order.suitName && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-500">Suit</span>
                <span className="font-medium truncate ml-2">{order.suitName}</span>
              </div>
            )}
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold text-gray-800">KES {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-green-600">KES {totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm border-t border-gray-200 pt-1.5 sm:pt-2">
              <span className="text-gray-500 font-medium">Remaining</span>
              <span className={`font-bold text-base sm:text-lg ${remainingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                KES {remainingBalance.toLocaleString()}
              </span>
            </div>
            {isFullyPaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 sm:p-2 text-center">
                <span className="text-[10px] sm:text-xs text-green-700 font-medium">✅ Fully paid</span>
              </div>
            )}
          </div>

          {/* Payment Form */}
          {!isFullyPaid ? (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">
                  Payment Amount (KES)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter amount"
                    min="1"
                    max={remainingBalance}
                    required
                  />
                </div>
                <p className="text-[8px] sm:text-[10px] text-gray-400 mt-0.5 sm:mt-1">
                  Max: KES {remainingBalance.toLocaleString()}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {['cash', 'm-pesa', 'bank'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-medium border transition ${
                        paymentMethod === method
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {method === 'cash' ? '💵 Cash' : 
                       method === 'm-pesa' ? '📱 M-Pesa' : 
                       '🏦 Bank'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="M-Pesa code, bank ref..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-2 sm:p-2.5 rounded-lg text-[10px] sm:text-xs text-red-600 flex items-center gap-1.5">
                  <span>❌</span> {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 p-2 sm:p-2.5 rounded-lg text-[10px] sm:text-xs text-green-600 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {success}
                </div>
              )}

              {/* Buttons */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:flex sm:flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full sm:flex-1 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium transition ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    'Record Payment'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 sm:py-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {isRental ? 'Rental' : 'Order'} is fully paid!
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                Total: KES {total.toLocaleString()}
              </p>
              <button
                onClick={onClose}
                className="mt-3 sm:mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};