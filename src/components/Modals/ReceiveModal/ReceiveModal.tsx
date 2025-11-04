import { BackButton } from "@src/components/Buttons/BackButton";
import { useEnsProfile } from "@src/context/ledger/useEnsProfile";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import {
  useCopyAddress,
  useCopyEns,
  QRCodeDisplay,
  useInvoiceGeneration,
  InvoiceSection,
  PrivatePaymentFields,
  PaymentTypeToggle,
} from ".";
import { BaseModal } from "@src/components/Modals/BaseModal";
import { useContext, useState } from "react";
import clsx from "clsx";
import { AMOUNT_REGEX } from "@src/common.constants";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { useDepositFees } from "@src/components/Panel/hooks/useFees";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { evmClients } = useContext(LedgerContext);
  const { ledger } = useContext(LedgerContext);
  const { decimals } = useContext(PanelContext);
  const primaryAddress = evmClients!.primaryClient()!.account
    .address as `0x${string}`;
  const { data: ensProfile } = useEnsProfile(primaryAddress);
  const { showCopiedTooltip: showAddressCopied, handleCopyAddress } =
    useCopyAddress(primaryAddress);
  const { showCopiedTooltip: showEnsCopied, handleCopyEns } = useCopyEns(
    ensProfile?.name,
  );
  const style = useDynamicHeight("h-dvh");

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [messageRequest, setMessageRequest] = useState("");
  const [messageError, setMessageError] = useState("");
  const [isPublicPayment, setIsPublicPayment] = useState(false);

  const { data: feesData } = useDepositFees(ledger!, decimals, isPublicPayment);

  // Invoice generation hook
  const {
    invoiceAddress,
    isGenerating: isGeneratingInvoice,
    generateInvoice,
    resetInvoice,
  } = useInvoiceGeneration(feesData!, decimals);

  // Copy hook for invoice address
  const {
    showCopiedTooltip: showInvoiceCopied,
    handleCopyAddress: handleCopyInvoice,
  } = useCopyAddress(invoiceAddress || ("" as `0x${string}`));

  const handleAmountChange = (value: string) => {
    if (!AMOUNT_REGEX.test(value)) return;
    setAmount(value);
    setAmountError("");

    // Reset invoice when amount changes
    if (isPublicPayment && invoiceAddress) {
      resetInvoice();
    }
  };

  const handleMessageRequestChange = (value: string) => {
    if (value.length <= 32) {
      setMessageRequest(value);
      setMessageError("");

      // Reset invoice when message changes
      if (isPublicPayment && invoiceAddress) {
        resetInvoice();
      }
    }
  };

  const handleGenerateInvoice = async () => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      setAmountError("Amount is required for invoice generation");
      return;
    }

    // Validate message
    if (!messageRequest || messageRequest.trim().length === 0) {
      setMessageError("Invoice ID/Message is required for invoice generation");
      return;
    }

    const success = await generateInvoice(amount, messageRequest);
    if (!success) {
      if (!amount || parseFloat(amount) <= 0) {
        setAmountError("Amount is required for invoice generation");
      }
      if (!messageRequest || messageRequest.trim().length === 0) {
        setMessageError(
          "Invoice ID/Message is required for invoice generation",
        );
      }
    }
  };

  // Reset invoice when switching payment types
  const handlePaymentTypeChange = (enabled: boolean) => {
    setIsPublicPayment(enabled);
    if (!enabled) {
      resetInvoice();
      setAmountError("");
      setMessageError("");
    }
  };

  const generateQRData = () => {
    // Use invoice address for public payments, otherwise use wallet address
    const targetAddress = isPublicPayment ? invoiceAddress : primaryAddress;
    if (!targetAddress) return "";

    const hasAmount = amount && parseFloat(amount) > 0;
    const hasMessage = messageRequest.trim().length > 0;

    if (isPublicPayment) {
      // For public payments, just return the invoice address (external ERC20 transfer)
      return invoiceAddress;
    }

    // For private payments (ZeroLedger)
    if (hasAmount || hasMessage) {
      // Build QR code with parameters
      let qrData = `zeroledger:address=${primaryAddress}`;
      if (hasAmount) {
        qrData += `&amount=${amount}`;
      }
      if (hasMessage) {
        qrData += `&message=${encodeURIComponent(messageRequest)}`;
      }
      return qrData;
    }

    // Just the address if no parameters specified
    return primaryAddress;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={true}
      contentClassName="relative justify-center overflow-y-auto"
      style={style}
    >
      <div className="px-6 py-5 h-full grid grid-cols-1">
        <BackButton onClick={onClose} className="place-self-start" />
        <div className="flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Receive Payment
            </h1>
            <p className="text-gray-400 text-sm px-5">
              {!isPublicPayment
                ? "Receive payments from ZeroLedger users"
                : "Receive payments from external wallet via one-time address"}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-8 relative">
            <div
              className={clsx(
                "transition-all duration-200",
                isPublicPayment && !invoiceAddress && "blur-lg",
              )}
            >
              <QRCodeDisplay value={generateQRData() || ""} size={192} />
            </div>
            {isPublicPayment && !invoiceAddress && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/80 text-sm font-medium">
                  Generate invoice to view QR code
                </p>
              </div>
            )}
          </div>

          {/* Payment Type Toggle */}
          <PaymentTypeToggle
            isPublicPayment={isPublicPayment}
            onChange={handlePaymentTypeChange}
          />

          {/* Invoice Generation (for public payments) */}
          {isPublicPayment && (
            <InvoiceSection
              amount={amount}
              amountError={amountError}
              message={messageRequest}
              messageError={messageError}
              invoiceAddress={invoiceAddress}
              isGenerating={isGeneratingInvoice}
              showCopiedTooltip={showInvoiceCopied}
              onAmountChange={handleAmountChange}
              onMessageChange={handleMessageRequestChange}
              onGenerate={handleGenerateInvoice}
              onCopyAddress={handleCopyInvoice}
            />
          )}

          {/* ZeroLedger-specific fields (only show for private payments) */}
          {!isPublicPayment && (
            <PrivatePaymentFields
              ensName={ensProfile?.name}
              walletAddress={primaryAddress}
              amount={amount}
              amountError={amountError}
              messageRequest={messageRequest}
              showEnsCopied={showEnsCopied}
              showAddressCopied={showAddressCopied}
              onAmountChange={handleAmountChange}
              onMessageRequestChange={handleMessageRequestChange}
              onCopyEns={handleCopyEns}
              onCopyAddress={handleCopyAddress}
            />
          )}
        </div>
      </div>
    </BaseModal>
  );
}
