import Swal from "sweetalert2";

export const showSuccess = (text, title = "Success") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
  });
};

export const showError = (text, title = "Error") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
  });
};

export const showInfo = (text, title = "Info") => {
  return Swal.fire({
    icon: "info",
    title,
    text,
  });
};

export const showConfirm = (text, title = "Are you sure?") => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
  }).then((result) => result.isConfirmed);
};

export const showPaymentSuccess = (plan, billingCycle) => {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const cycle = billingCycle === "annual" ? "Annual" : "Monthly";

  const planFeatures = {
    Pro: [
      "All AI tools unlocked",
      "Real-time collaboration",
      "Priority processing",
      "Advanced analytics",
    ],
    Enterprise: [
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 priority support",
    ],
  };

  const features = planFeatures[planName] || [
    "Full platform access",
    "Priority support",
    "Advanced analytics",
    "API integrations",
  ];

  return Swal.fire({
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 8px 4px;">
        <!-- Stripe-style checkmark -->
        <div style="
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #635bff 0%, #7c3aed 100%);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(99, 91, 255, 0.35);
        ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <!-- Title -->
        <div style="font-size: 22px; font-weight: 700; color: #0a2540; margin-bottom: 6px; letter-spacing: -0.3px;">
          Payment successful
        </div>
        <div style="font-size: 14px; color: #425466; margin-bottom: 24px;">
          Your <strong style="color: #0a2540;">${planName}</strong> subscription is now active
        </div>

        <!-- Plan badge -->
        <div style="
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #635bff15, #7c3aed15);
          border: 1px solid #635bff30;
          border-radius: 20px;
          padding: 6px 14px;
          margin-bottom: 24px;
        ">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#635bff" stroke="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span style="font-size: 13px; font-weight: 600; color: #635bff;">${planName} · ${cycle} billing</span>
        </div>

        <!-- Features list -->
        <div style="
          background: #f6f9fc;
          border-radius: 10px;
          padding: 16px 20px;
          text-align: left;
          margin-bottom: 8px;
        ">
          ${features
            .map(
              (f) => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 5px 0;">
              <div style="
                width: 18px; height: 18px; min-width: 18px;
                background: #635bff;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
              ">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span style="font-size: 13px; color: #425466;">${f}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: "Go to Dashboard",
    confirmButtonColor: "#635bff",
    showCloseButton: false,
    customClass: {
      popup: "stripe-success-popup",
      confirmButton: "stripe-confirm-btn",
    },
    buttonsStyling: true,
    width: 420,
    padding: "32px",
    background: "#ffffff",
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
  });
};
