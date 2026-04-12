const contactForm = document.getElementById("contactForm");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");
const contactFormStatus = document.getElementById("contactFormStatus");
const lineContactBtn = document.querySelector('a[href*="line.me"]');

function trackGaEvent(eventName, params = {}) {
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    page_location: window.location.href,
    page_title: document.title,
    ...params
  });
}

function getContactMessage(type) {
  const lang = window.getCurrentLang ? window.getCurrentLang() : "zh-TW";

  const messages = {
    sending: {
      "zh-TW": "送出中，請稍候...",
      "en": "Sending, please wait..."
    },
    success: {
      "zh-TW": "已成功送出，我們會盡快與你聯絡。",
      "en": "Your message has been sent successfully. We will contact you soon."
    },
    error: {
      "zh-TW": "送出失敗，請稍後再試，或直接來信與我們聯絡。",
      "en": "Submission failed. Please try again later, or contact us by email directly."
    },
    invalid: {
      "zh-TW": "請先完整填寫必填欄位。",
      "en": "Please complete all required fields first."
    }
  };

  return messages[type]?.[lang] || messages[type]?.["zh-TW"] || "";
}

function setSubmittingState(isSubmitting) {
  if (!contactSubmitBtn) return;

  contactSubmitBtn.disabled = isSubmitting;
  contactSubmitBtn.classList.toggle("is-loading", isSubmitting);
}

function setStatus(type, message) {
  if (!contactFormStatus) return;

  contactFormStatus.textContent = message;
  contactFormStatus.className = "contact-form-status";

  if (type) {
    contactFormStatus.classList.add(`is-${type}`);
  }
}

async function submitContactForm(event) {
  event.preventDefault();

  if (!contactForm) return;

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    setStatus("error", getContactMessage("invalid"));

    trackGaEvent("form_validation_error", {
      form_name: "contact_form",
      page_type: "contact_page"
    });

    return;
  }

  setSubmittingState(true);
  setStatus("", getContactMessage("sending"));

  try {
    const formData = new FormData(contactForm);

    formData.append("page", window.location.href);
    formData.append("language", window.getCurrentLang ? window.getCurrentLang() : "zh-TW");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setStatus("success", getContactMessage("success"));

      trackGaEvent("generate_lead", {
        form_name: "contact_form",
        lead_type: "book_demo",
        page_type: "contact_page"
      });

      contactForm.reset();
    } else {
      setStatus("error", result.message || getContactMessage("error"));

      trackGaEvent("form_submit_error", {
        form_name: "contact_form",
        page_type: "contact_page",
        error_message: result.message || "submit_failed"
      });
    }
  } catch (error) {
    setStatus("error", getContactMessage("error"));

    trackGaEvent("form_submit_error", {
      form_name: "contact_form",
      page_type: "contact_page",
      error_message: error?.message || "network_error"
    });
  } finally {
    setSubmittingState(false);
  }
}

if (contactForm) {
  contactForm.addEventListener("submit", submitContactForm);
}

if (lineContactBtn) {
  lineContactBtn.addEventListener("click", () => {
    trackGaEvent("contact_click", {
      method: "line",
      page_type: "contact_page"
    });
  });
}