// ReceiptModal.jsx - API-Oriented (Supports Orders & Rentals) - WITH IMAGE SENDING
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { X, Send, DollarSign, Edit2, Trash2, Loader2, Phone, Mail, Download, Check } from 'lucide-react';

export const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  receipt, 
  user, 
  onRecordPayment,
  isAdminOwner,
  onEdit,
  onDelete 
}) => {
  const receiptRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!isOpen || !receipt) return null;

  const isAdminOwnerRole = isAdminOwner || user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isSales = user?.role === 'SALES' || user?.role === 'sales';
  const isTailor = user?.role === 'TAILOR' || user?.role === 'tailor';

  // ✅ DETECT IF IT'S A RENTAL OR ORDER
  const isRental = receipt?.reference && !receipt?.recNo;
  const isOrder = receipt?.recNo && !receipt?.reference;

  // ✅ GET CORRECT FIELD NAMES
  const receiptNo = isRental ? receipt?.reference : receipt?.recNo;
  const customerName = receipt?.customerName || 'N/A';
  const customerPhone = receipt?.customerPhone || 'N/A';
  const customerEmail = receipt?.customerEmail || 'N/A';
  const total = isRental ? (receipt?.totalAmount || 0) : (receipt?.total || 0);
  const deposit = receipt?.deposit || 0;
  const balance = isRental ? (receipt?.remainingBalance || 0) : (receipt?.balance || 0);
  const status = receipt?.status || 'PENDING';
  const paymentStatus = receipt?.paymentStatus || 'PENDING';
  const payments = receipt?.payments || [];
  const suitType = receipt?.suitType || '';
  const style = receipt?.style || 'Standard';
  const tailorEmail = isRental ? receipt?.rentedBy : receipt?.tailorEmail;
  
  // ✅ Get items from measurementItems
  const items = receipt?.measurementItems || receipt?.items || [];
  const totalItems = items.length;
  
  // Rental specific fields
  const suitName = receipt?.suitName || '';
  const suitCategory = receipt?.suitCategory || '';
  const suitColor = receipt?.suitColor || '';
  const rentalFee = receipt?.rentalFee || 0;
  const rentalStartDate = receipt?.rentalStartDate || '';
  const rentalEndDate = receipt?.rentalEndDate || '';
  const days = receipt?.days || 0;

  // Calculate total paid
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // ✅ Check if fully paid
  const isFullyPaid = paymentStatus === 'PAID' || paymentStatus === 'paid' || balance <= 0;

  // ✅ Helper to get measurement value
  const getMeasurement = (item, field, altFields = []) => {
    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
      return item[field];
    }
    for (const alt of altFields) {
      if (item[alt] !== undefined && item[alt] !== null && item[alt] !== '') {
        return item[alt];
      }
    }
    return 'N/A';
  };

  // ============================================================
  // ✅ GENERATE RECEIPT IMAGE
  // ============================================================
  const generateReceiptImage = async () => {
    if (!receiptRef.current) return null;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `Receipt-${receiptNo || 'KIIN'}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            const dataUrl = URL.createObjectURL(blob);
            resolve({ blob, file, dataUrl, fileName });
          } else {
            resolve(null);
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error generating receipt image:', error);
      return null;
    }
  };

  // ============================================================
  // ✅ SEND VIA WHATSAPP - PROPERLY SEND IMAGE
  // ============================================================
  const sendViaWhatsApp = async () => {
    if (!customerPhone || customerPhone === 'N/A') {
      alert('No phone number available for this customer.');
      setShowSendOptions(false);
      return;
    }

    setIsSending(true);
    setSelectedMethod('whatsapp');
    setShowSendOptions(false);

    try {
      const imageData = await generateReceiptImage();
      if (!imageData) {
        setIsSending(false);
        return;
      }

      // Format phone number
      let phone = customerPhone.replace(/\s/g, '').replace(/[^0-9+]/g, '');
      if (!phone.startsWith('+') && !phone.startsWith('0')) {
        phone = '254' + phone;
      } else if (phone.startsWith('0')) {
        phone = '254' + phone.substring(1);
      }
      phone = phone.replace('+', '');

      // Create WhatsApp message
      const message = `Hello ${customerName},\n\n` +
        `Thank you for choosing KIIN Clothline! 🎉\n\n` +
        `📋 ${isRental ? 'Rental' : 'Order'} Receipt #${receiptNo}\n` +
        `📅 Date: ${receipt.orderDate || receipt.date || receipt.rentalStartDate || 'N/A'}\n` +
        `💰 Total: KES ${total.toLocaleString()}\n` +
        `💳 Deposit: KES ${deposit.toLocaleString()}\n` +
        `📊 Balance: KES ${balance.toLocaleString()}\n` +
        `📌 Status: ${isFullyPaid ? '✅ Fully Paid' : '⚠️ Pending Payment'}\n\n` +
        `Please find your receipt attached below.\n` +
        `Thanks for your business! 🙏\n\n` +
        `KIIN Clothline`;

      // FIRST METHOD: Try native share with file
      if (navigator.canShare && navigator.canShare({ files: [imageData.file] })) {
        try {
          await navigator.share({
            files: [imageData.file],
            title: `Receipt ${receiptNo}`,
            text: message
          });
          setIsSending(false);
          setSelectedMethod(null);
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.error('Share failed:', shareErr);
          } else {
            // User cancelled, just return
            setIsSending(false);
            setSelectedMethod(null);
            return;
          }
        }
      }

      // SECOND METHOD: Try to send via WhatsApp with image using URL
      // We'll use a more direct approach for WhatsApp
      try {
        // Convert blob to base64 for WhatsApp
        const reader = new FileReader();
        reader.readAsDataURL(imageData.file);
        reader.onload = async function() {
          const base64Image = reader.result;
          
          // Create a temporary link to download the image
          const downloadLink = document.createElement('a');
          downloadLink.href = imageData.dataUrl;
          downloadLink.download = imageData.fileName;
          
          // Open WhatsApp with message and instruct to attach the downloaded image
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message + '\n\n')}`;
          window.open(whatsappUrl, '_blank');
          
          // Download the image
          setTimeout(() => {
            downloadLink.click();
            URL.revokeObjectURL(imageData.dataUrl);
          }, 500);
          
          setIsSending(false);
          setSelectedMethod(null);
        };
      } catch (err) {
        console.error('Error with WhatsApp fallback:', err);
        // Final fallback: just download
        const link = document.createElement('a');
        link.href = imageData.dataUrl;
        link.download = imageData.fileName;
        link.click();
        URL.revokeObjectURL(imageData.dataUrl);
        setIsSending(false);
        setSelectedMethod(null);
      }

    } catch (error) {
      console.error('Error sending via WhatsApp:', error);
      alert('Failed to send via WhatsApp. Please download the receipt manually.');
      // Try to download as fallback
      try {
        const imageData = await generateReceiptImage();
        if (imageData) {
          const link = document.createElement('a');
          link.href = imageData.dataUrl;
          link.download = imageData.fileName;
          link.click();
          URL.revokeObjectURL(imageData.dataUrl);
        }
      } catch (e) {
        console.error('Download fallback failed:', e);
      }
      setIsSending(false);
      setSelectedMethod(null);
    }
  };

  // ============================================================
  // ✅ SEND VIA EMAIL - PROPERLY SEND IMAGE
  // ============================================================
  const sendViaEmail = async () => {
    if (!customerEmail || customerEmail === 'N/A') {
      alert('No email address available for this customer.');
      setShowSendOptions(false);
      return;
    }

    setIsSending(true);
    setSelectedMethod('email');
    setShowSendOptions(false);

    try {
      const imageData = await generateReceiptImage();
      if (!imageData) {
        setIsSending(false);
        return;
      }

      // Create email subject and body
      const subject = `Your ${isRental ? 'Rental' : 'Order'} Receipt #${receiptNo} - KIIN Clothline`;
      const body = `Dear ${customerName},\n\n` +
        `Thank you for choosing KIIN Clothline! 🎉\n\n` +
        `Please find attached your ${isRental ? 'rental' : 'order'} receipt #${receiptNo}.\n\n` +
        `📋 Receipt Details:\n` +
        `• ${isRental ? 'Rental' : 'Order'} #: ${receiptNo}\n` +
        `• Date: ${receipt.orderDate || receipt.date || receipt.rentalStartDate || 'N/A'}\n` +
        `• Total: KES ${total.toLocaleString()}\n` +
        `• Deposit: KES ${deposit.toLocaleString()}\n` +
        `• Balance: KES ${balance.toLocaleString()}\n` +
        `• Status: ${isFullyPaid ? '✅ Fully Paid' : '⚠️ Pending Payment'}\n\n` +
        `We appreciate your business and look forward to serving you again! 🙏\n\n` +
        `Best regards,\n` +
        `KIIN Clothline Team`;

      // FIRST METHOD: Try native share with file
      if (navigator.canShare && navigator.canShare({ files: [imageData.file] })) {
        try {
          await navigator.share({
            files: [imageData.file],
            title: subject,
            text: body
          });
          setIsSending(false);
          setSelectedMethod(null);
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.error('Share failed:', shareErr);
          } else {
            setIsSending(false);
            setSelectedMethod(null);
            return;
          }
        }
      }

      // SECOND METHOD: Open email with attachment note
      const mailtoUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\n📎 Please find the receipt image attached to this email. (The image has been downloaded for your convenience)')}`;
      window.open(mailtoUrl, '_blank');
      
      // Download the image for attachment
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = imageData.dataUrl;
        link.download = imageData.fileName;
        link.click();
        URL.revokeObjectURL(imageData.dataUrl);
      }, 500);

      setIsSending(false);
      setSelectedMethod(null);

    } catch (error) {
      console.error('Error sending via email:', error);
      alert('Failed to send via email. Please download the receipt manually.');
      // Try to download as fallback
      try {
        const imageData = await generateReceiptImage();
        if (imageData) {
          const link = document.createElement('a');
          link.href = imageData.dataUrl;
          link.download = imageData.fileName;
          link.click();
          URL.revokeObjectURL(imageData.dataUrl);
        }
      } catch (e) {
        console.error('Download fallback failed:', e);
      }
      setIsSending(false);
      setSelectedMethod(null);
    }
  };

  // ============================================================
  // ✅ DOWNLOAD RECEIPT
  // ============================================================
  const downloadReceipt = async () => {
    try {
      const imageData = await generateReceiptImage();
      if (!imageData) return;
      
      const link = document.createElement('a');
      link.href = imageData.dataUrl;
      link.download = imageData.fileName;
      link.click();
      URL.revokeObjectURL(imageData.dataUrl);
      setShowSendOptions(false);
      setSelectedMethod(null);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt.');
    }
  };

  // ============================================================
  // ✅ HANDLE SEND BUTTON - SHOW OPTIONS MODAL
  // ============================================================
  const handleSendClick = () => {
    const hasPhone = customerPhone && customerPhone !== 'N/A';
    const hasEmail = customerEmail && customerEmail !== 'N/A';

    if (!hasPhone && !hasEmail) {
      // If no contact info, just download
      downloadReceipt();
      return;
    }

    // Show send options modal
    setShowSendOptions(true);
  };

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 p-3 bg-black/50 backdrop-blur-sm" 
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-3 pb-4 shadow-2xl animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm">
              🧾 {isRental ? 'Rental Receipt' : 'Order Receipt'}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* ✅ Receipt Content */}
          {/* ✅ Receipt Content - this whole block gets captured as the image */}
<div ref={receiptRef} className="bg-white">
  <div className="text-xs space-y-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
    
    {/* 🏢 COMPANY LOGO - ADD THIS HERE */}
    <div className="flex justify-center mb-2 pb-2 border-b border-gray-200">
      <img 
        src="/logo.png" 
        alt="KIIN Clothline" 
        className="h-8 w-auto object-contain"
        crossOrigin="anonymous"
      />
    </div>
    
    {/* Receipt # */}
    <div className="flex justify-between">
      <span className="font-semibold text-gray-600">{isRental ? 'Rental #' : 'Receipt #'}</span>
      <span className="font-mono font-bold">{receiptNo}</span>
    </div>
              
              {/* Date */}
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Date</span>
                <span>{receipt.orderDate || receipt.date || receipt.rentalStartDate || 'N/A'}</span>
              </div>
              
              {/* Rental Period */}
              {isRental && rentalStartDate && rentalEndDate && (
                <>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Start Date</span>
                    <span>{new Date(rentalStartDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">End Date</span>
                    <span>{new Date(rentalEndDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Days</span>
                    <span>{days || 0} days</span>
                  </div>
                </>
              )}
              
              {/* Customer Info */}
              {customerName && (
                <>
                  <hr className="my-1 border-gray-200" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Customer</span>
                    <span className="font-medium">{customerName}</span>
                  </div>
                  {customerPhone && customerPhone !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Phone</span>
                      <span>{customerPhone}</span>
                    </div>
                  )}
                  {customerEmail && customerEmail !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Email</span>
                      <span className="text-xs truncate max-w-[130px]">{customerEmail}</span>
                    </div>
                  )}
                </>
              )}
              
              <hr className="my-1 border-gray-200" />
              
              {/* Suit Info - RENTAL */}
              {isRental && (
                <>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Suit</span>
                    <span className="text-right font-medium">{suitName || 'N/A'}</span>
                  </div>
                  {suitCategory && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Category</span>
                      <span className="text-right text-xs">{suitCategory}</span>
                    </div>
                  )}
                  {suitColor && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-600">Color</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs">{suitColor}</span>
                        <span 
                          className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                          style={{ backgroundColor: suitColor.toLowerCase() }}
                        />
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Daily Rate</span>
                    <span>KES {rentalFee?.toLocaleString() || 0}</span>
                  </div>
                </>
              )}
              
              {/* Suit Info - ORDER */}
              {isOrder && (
                <>
                  {suitType && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Suit Type</span>
                      <span className="text-right text-xs">{suitType}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Style</span>
                    <span className="text-right text-xs">{style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Items</span>
                    <span className="font-medium">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                  </div>
                </>
              )}
              
              {/* Financials */}
              {!isTailor ? (
                <>
                  <hr className="my-1 border-gray-200" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Total</span>
                    <span className="font-bold">KES {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Deposit</span>
                    <span className="text-emerald-600 font-semibold">KES {deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-dashed border-gray-300 pt-1">
                    <span className="font-semibold text-gray-600">Balance</span>
                    <span className={`font-bold text-base ${balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                      KES {balance.toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-gray-400 py-1">
                  {/* Financial details are not visible for Tailors */}
                </div>
              )}

              {/* Payment Status */}
              {!isTailor && (
              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold text-gray-600">Payment Status</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isFullyPaid ? 'bg-green-100 text-green-700' :
                  paymentStatus === 'PARTIAL' || paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {isFullyPaid ? '✅ Fully Paid' :
                   paymentStatus === 'PARTIAL' || paymentStatus === 'partial' ? '⚠️ Partial' :
                   '❌ Unpaid'}
                </span>
              </div>
              )}

                            {/* Payment History - collapsible */}
              {!isTailor && payments.length > 0 && (
                <details className="mt-1 p-2 bg-green-50 rounded-lg border border-green-100 cursor-pointer">
                  <summary className="flex items-center gap-1.5 list-none [&::-webkit-details-marker]:hidden">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-semibold text-xs text-gray-700">Payment History</span>
                    <span className="text-[9px] text-gray-400 ml-auto">{payments.length} payments</span>
                  </summary>

                  <div className="space-y-1 max-h-28 overflow-y-auto mt-1.5">
                    {payments.map((payment, idx) => (
                      <div key={payment.id || idx} className="flex items-center justify-between text-[10px] border-b border-green-100 pb-1 last:border-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[7px] font-medium px-1.5 py-0.5 rounded-full ${
                            payment.method?.toLowerCase() === 'cash' ? 'bg-green-200 text-green-700' :
                            payment.method?.toLowerCase() === 'm-pesa' ? 'bg-purple-200 text-purple-700' :
                            payment.method?.toLowerCase() === 'bank' ? 'bg-blue-200 text-blue-700' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {payment.method || 'cash'}
                          </span>
                          <span className="text-gray-500">
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-800">KES {payment.amount.toLocaleString()}</span>
                          {payment.receivedBy && (
                            <span className="text-[7px] text-gray-400 truncate max-w-[50px]">{payment.receivedBy}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] border-t border-green-200 pt-1 mt-1">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-bold text-green-600">
                      KES {totalPaid.toLocaleString()}
                    </span>
                  </div>
                </details>
              )}

              {/* Tailor / Rented By */}
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">{isRental ? 'Rented By' : 'Tailor'}</span>
                <span className="text-xs text-gray-500">{tailorEmail || 'unassigned'}</span>
              </div>
              
              {/* Status */}
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Status</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  status === 'COMPLETED' || status === 'completed' || status === 'returned' ? 'bg-green-100 text-green-700' :
                  status === 'IN_PROGRESS' || status === 'in-progress' || status === 'rented' ? 'bg-blue-100 text-blue-700' :
                  status === 'CANCELLED' || status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {status === 'COMPLETED' ? 'Completed' :
                   status === 'IN_PROGRESS' ? 'In Progress' :
                   status === 'CANCELLED' ? 'Cancelled' :
                   status === 'returned' ? 'Returned' :
                   status === 'rented' ? 'Rented' :
                   status || 'Pending'}
                </span>
              </div>
            </div>

            {/* ✅ MEASUREMENTS - FIXED for lowercase trouser fields */}
{isOrder && items.length > 0 && (
  <div className="mt-2 text-[10px]">
    <details className="cursor-pointer">
      <summary className="font-semibold text-gray-600 hover:text-gray-800">
        📏 View Measurements ({items.length} items)
      </summary>
      <div className="mt-1.5 space-y-1.5 max-h-32 overflow-y-auto">
        {items.map((item, idx) => {
          const itemType = item?.itemType || item?.type || '';
          const isCoat = itemType.toLowerCase() === 'coat';
          const isTrouser = itemType.toLowerCase() === 'trouser';
          const itemName = item?.itemName || item?.name || (isCoat ? 'Coat' : 'Trouser');
          
          return (
            <div key={idx} className="p-1.5 bg-gray-50 rounded border border-gray-100">
              <div className="font-semibold text-gray-700 text-[9px] uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-0.5">
                {itemName} #{idx + 1}
              </div>
              <div className="grid grid-cols-3 gap-0.5 text-[9px]">
                {isCoat ? (
                  <>
                    <span>FL: <b>{getMeasurement(item, 'coatFL', ['coat_fl'])}"</b></span>
                    <span>Ch: <b>{getMeasurement(item, 'coatCh', ['coat_ch'])}"</b></span>
                    <span>Wa: <b>{getMeasurement(item, 'coatWa', ['coat_wa'])}"</b></span>
                    <span>Sh: <b>{getMeasurement(item, 'coatSh', ['coat_sh'])}"</b></span>
                    <span className="col-span-2">Sl: <b>{getMeasurement(item, 'coatSl', ['coat_sl'])}"</b></span>
                  </>
                ) : isTrouser ? (
                  <>
                    <span>FL: <b>{getMeasurement(item, 'tfl', ['tFL', 't_fl'])}"</b></span>
                    <span>Wa: <b>{getMeasurement(item, 'twa', ['tWa', 't_wa'])}"</b></span>
                    <span>Th: <b>{getMeasurement(item, 'tth', ['tTh', 't_th'])}"</b></span>
                    <span>Kn: <b>{getMeasurement(item, 'tkn', ['tKn', 't_kn'])}"</b></span>
                    <span>B1: <b>{getMeasurement(item, 'tb1', ['tB1', 't_b1'])}"</b></span>
                    <span>B2: <b>{getMeasurement(item, 'tb2', ['tB2', 't_b2'])}"</b></span>
                  </>
                ) : (
                  <span className="col-span-3 text-gray-400">Unknown item type</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  </div>
)}
          </div>

          {/* ✅ ACTION BUTTONS */}
          <div className="space-y-1.5 mt-2 pb-2">
            {/* Record Payment Button */}
            {!isFullyPaid && (isAdminOwnerRole || isSales) && onRecordPayment && (
              <button
                onClick={() => onRecordPayment(receipt.id)}
                className="w-full py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
              >
                <DollarSign className="w-3 h-3" /> Record Payment
              </button>
            )}

            {/* Edit/Delete for Admin/Owner */}
            {isAdminOwnerRole && (
              <div className="flex gap-1.5">
                {onEdit && (
                  <button
                    onClick={() => { onClose(); onEdit(receipt.id); }}
                    className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onClose(); onDelete(receipt.id); }}
                    className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            )}

            {/* Send & Close Buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={handleSendClick}
                disabled={isSending}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" /> Send
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SEND OPTIONS MODAL */}
      {showSendOptions && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSendOptions(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">📤 Send Receipt</h3>
              <button 
                onClick={() => setShowSendOptions(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs">
              <p className="font-medium text-gray-700">Sending to:</p>
              <p className="text-gray-600">{customerName}</p>
              {customerPhone && customerPhone !== 'N/A' && (
                <p className="text-gray-500">📱 {customerPhone}</p>
              )}
              {customerEmail && customerEmail !== 'N/A' && (
                <p className="text-gray-500">✉️ {customerEmail}</p>
              )}
            </div>

            {/* Send Options */}
            <div className="space-y-2.5">
              {/* WhatsApp Option */}
              {customerPhone && customerPhone !== 'N/A' && (
                <button
                  onClick={sendViaWhatsApp}
                  disabled={isSending}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending && selectedMethod === 'whatsapp' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                  Send via WhatsApp
                </button>
              )}
              
              {/* Email Option */}
              {customerEmail && customerEmail !== 'N/A' && (
                <button
                  onClick={sendViaEmail}
                  disabled={isSending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending && selectedMethod === 'email' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  Send via Email
                </button>
              )}
              
              {/* Download Option */}
              <button
                onClick={downloadReceipt}
                disabled={isSending}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </button>
              
              {/* Cancel Button */}
              <button
                onClick={() => setShowSendOptions(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};